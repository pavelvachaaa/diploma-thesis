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

func NewApplicantHandler(
	seaweed *storage.SeaweedClient,
	tika *extractor.TikaClient,
	ollama *ai.OllamaClient,
	pub *consumer.Publisher,
	model string,
) consumer.Handler[models.CVEvent] {

	// This is the actual function that RabbitMQ will call
	return func(ctx context.Context, event models.CVEvent) error {
		startTime := time.Now()
		log.Printf("[%s] Processing applicant CV...", event.AttachmentID)

		// 1. Download
		fileData, err := seaweed.Download(ctx, event.S3Bucket, event.S3Key)
		if err != nil {
			return publishFailure(pub, event, fmt.Sprintf("Download failed: %v", err))
		}

		// 2. Extract
		text, err := tika.Extract(fileData, event.MimeType)
		if err != nil {
			return publishFailure(pub, event, fmt.Sprintf("Extraction failed: %v", err))
		}

		// 3. AI Tasks
		extracted, err := ai.ExtractData(ollama, model, text)
		if err != nil {
			return publishFailure(pub, event, fmt.Sprintf("AI Extraction failed: %v", err))
		}

		evaluation, err := ai.Evaluate(ollama, model, text, event.JobTitle, event.JobDescription)
		if err != nil {
			return publishFailure(pub, event, fmt.Sprintf("AI Evaluation failed: %v", err))
		}

		embedding, err := ai.GenerateEmbedding(ollama, text)
		if err != nil {
			return publishFailure(pub, event, fmt.Sprintf("Embedding generation failed: %v", err))
		}

		// 4. Publish
		processingTime := int(time.Since(startTime).Milliseconds())
		result := &models.CVAnalysisResult{
			AttachmentID:   event.AttachmentID,
			ApplicantID:    event.ApplicantID,
			OrganizationID: event.OrganizationID,
			Status:         "completed",
			RawText:        text,

			// Flattened extracted data
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

			// Flattened evaluation
			EvaluationScore:      evaluation.Score,
			EvaluationReasoning:  evaluation.Reasoning,
			EvaluationStrengths:  evaluation.Strengths,
			EvaluationWeaknesses: evaluation.Weaknesses,

			Embedding:        embedding,
			ModelUsed:        model,
			EmbeddingModel:   "nomic-embed-text",
			ProcessingTimeMs: processingTime,
		}

		log.Printf("[%s] CV analysis complete: score=%d, skills=%v",
			event.AttachmentID, evaluation.Score, extracted.Skills)

		return pub.PublishResult(result)
	}
}

// Helper function to handle failures gracefully
func publishFailure(pub *consumer.Publisher, event models.CVEvent, msg string) error {
	log.Printf("[%s] Failed: %s", event.AttachmentID, msg)
	return pub.PublishResult(&models.CVAnalysisResult{
		AttachmentID:   event.AttachmentID,
		ApplicantID:    event.ApplicantID,
		OrganizationID: event.OrganizationID,
		Status:         "failed",
		ErrorMessage:   msg,
	})
}
