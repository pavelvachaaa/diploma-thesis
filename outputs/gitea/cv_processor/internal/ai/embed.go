package ai

import "fmt"

const embeddingModel = "nomic-embed-text"

// GenerateEmbedding creates a vector embedding for the given text
func GenerateEmbedding(client *OllamaClient, text string) ([]float32, error) {
	// nomic-embed-text supports up to 2048 tokens (~4 chars per token)
	if len(text) > 7000 {
		text = text[:7000]
	}

	embedding, err := client.Embed(embeddingModel, text)
	if err != nil {
		return nil, fmt.Errorf("generate embedding: %w", err)
	}

	return embedding, nil
}
