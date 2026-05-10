package handlers

import (
	"context"
	"fmt"
	"log"
	"time"

	"cv-processor/internal/ai"
	"cv-processor/internal/consumer"
	"cv-processor/internal/extractor"
	"cv-processor/internal/models"
	"cv-processor/internal/storage"
)

func NewJobSeekerHandler(
	seaweed *storage.SeaweedClient,
	tika *extractor.TikaClient,
	ollama *ai.OllamaClient,
	pub *consumer.Publisher,
	model string,
) consumer.Handler[models.JobSeekerCVEvent] {

	return func(ctx context.Context, event models.JobSeekerCVEvent) error {
		startTime := time.Now()
		log.Printf("[job-seeker:%s] Starting processing...", event.JobSeekerID)

		handleFailure := func(msg string) error {
			log.Printf("[job-seeker:%s] Failed: %s", event.JobSeekerID, msg)
			failResult := &models.JobSeekerCVResult{
				JobSeekerID:    event.JobSeekerID,
				OrganizationID: event.OrganizationID,
				Status:         "failed",
				ErrorMessage:   msg,
			}
			// We return the original error to the consumer so it can decide to Ack/Nack
			// But we also try to publish the failure status to the backend.
			_ = pub.PublishJobSeekerResult(failResult)
			return fmt.Errorf(msg)
		}

		log.Printf("[job-seeker:%s] Downloading from %s/%s", event.JobSeekerID, event.S3Bucket, event.S3Key)
		fileData, err := seaweed.Download(ctx, event.S3Bucket, event.S3Key)
		if err != nil {
			return handleFailure(fmt.Sprintf("Failed to download file: %v", err))
		}

		log.Printf("[job-seeker:%s] Extracting text via Tika (%d bytes)", event.JobSeekerID, len(fileData))
		text, err := tika.Extract(fileData, event.MimeType)
		if err != nil {
			return handleFailure(fmt.Sprintf("Failed to extract text: %v", err))
		}

		log.Printf("[job-seeker:%s] Extracting structured data via Ollama", event.JobSeekerID)
		extracted, err := ai.ExtractData(ollama, model, text)
		if err != nil {
			log.Printf("[job-seeker:%s] Structured extraction warning: %v", event.JobSeekerID, err)
			extracted = &models.ExtractedData{}
		}

		// Generate "Searchable Profile" (HyDE) for Vector Alignment
		// This transforms the raw CV into a format that looks more like a Job Description
		log.Printf("[job-seeker:%s] Refining profile for embedding alignment", event.JobSeekerID)
		refinedProfile, err := ai.RefineSeekerForEmbedding(ollama, model, text)
		if err != nil {
			log.Printf("[job-seeker:%s] Refinement failed, falling back to summary", event.JobSeekerID)
			refinedProfile = extracted.Summary
			if refinedProfile == "" {
				refinedProfile = text // Ultimate fallback
			}
		}

		log.Printf("[job-seeker:%s] Generating embedding vector", event.JobSeekerID)
		embedding, err := ai.GenerateEmbedding(ollama, refinedProfile)
		if err != nil {
			log.Printf("[job-seeker:%s] Embedding generation failed (non-fatal): %v", event.JobSeekerID, err)
			embedding = nil
		}

		processingTime := int(time.Since(startTime).Milliseconds())

		log.Printf("[job-seeker:%s] Publishing results (took %dms)", event.JobSeekerID, processingTime)
		result := &models.JobSeekerCVResult{
			JobSeekerID:    event.JobSeekerID,
			OrganizationID: event.OrganizationID,
			Status:         "completed",
			RawText:        text,

			// Flatten extracted data
			CandidateName:    extracted.Name,
			CandidateEmail:   extracted.Email,
			CandidatePhone:   extracted.Phone,
			Skills:           extracted.Skills,
			Languages:        extracted.Languages,
			Certifications:   extracted.Certifications,
			Education:        extracted.Education,
			Experience:       extracted.Experience,
			Summary:          extracted.Summary,
			VerbalEvaluation: extracted.VerbalEvaluation,

			Embedding:        embedding,
			ModelUsed:        model,
			EmbeddingModel:   "nomic-embed-text",
			ProcessingTimeMs: processingTime,
		}

		return pub.PublishJobSeekerResult(result)
	}
}
