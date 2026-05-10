package handlers

import (
	"context"
	"fmt"
	"log"
	"time"

	"cv-processor/internal/ai"
	"cv-processor/internal/consumer"
	"cv-processor/internal/models"
)

func NewJobEmbeddingHandler(
	ollama *ai.OllamaClient,
	pub *consumer.Publisher,
	model string,
) consumer.Handler[models.JobEmbeddingRequest] {

	return func(ctx context.Context, event models.JobEmbeddingRequest) error {
		startTime := time.Now()
		log.Printf("[job-embedding:%s] Starting processing...", event.JobID)

		// Helper to handle failures
		handleFailure := func(msg string) error {
			log.Printf("[job-embedding:%s] Failed: %s", event.JobID, msg)
			failResult := &models.JobEmbeddingResult{
				JobID:        event.JobID,
				ContentHash:  event.ContentHash,
				Status:       "failed",
				ErrorMessage: msg,
			}
			_ = pub.PublishJobEmbeddingResult(failResult)
			return fmt.Errorf(msg)
		}

		// optimized for the embedding model.
		log.Printf("[job-embedding:%s] Refining job text", event.JobID)
		refinedText, err := ai.RefineJobForEmbedding(
			ollama,
			model,
			event.Title,
			event.Description,
			event.Requirements,
			event.Duties,
		)

		if err != nil {
			log.Printf("[job-embedding:%s] Refinement failed, falling back to raw concatenation: %v", event.JobID, err)
			refinedText = fmt.Sprintf("%s. %s", event.Title, event.Description)
		}

		log.Printf("[job-embedding:%s] Generating embedding vector", event.JobID)
		embedding, err := ai.GenerateEmbedding(ollama, refinedText)
		if err != nil {
			return handleFailure(fmt.Sprintf("Failed to generate embedding: %v", err))
		}

		processingTime := int(time.Since(startTime).Milliseconds())

		log.Printf("[job-embedding:%s] Publishing result (took %dms)", event.JobID, processingTime)
		result := &models.JobEmbeddingResult{
			JobID:            event.JobID,
			ContentHash:      event.ContentHash,
			Status:           "completed",
			Embedding:        embedding,
			ModelUsed:        "nomic-embed-text",
			ProcessingTimeMs: processingTime,
		}

		return pub.PublishJobEmbeddingResult(result)
	}
}
