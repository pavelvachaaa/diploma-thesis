package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// OllamaClient communicates with local Ollama instance
type OllamaClient struct {
	baseURL string
	client  *http.Client
}

const generateNumCtx = 16384

// NewOllama creates a new Ollama client
func NewOllama(baseURL string) *OllamaClient {
	return &OllamaClient{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

// generateOptions holds model options for Ollama API requests
type generateOptions struct {
	NumCtx   int `json:"num_ctx,omitempty"`
	NumBatch int `json:"num_batch,omitempty"`
}

// generateRequest is the request body for /api/generate
type generateRequest struct {
	Model   string          `json:"model"`
	Prompt  string          `json:"prompt"`
	System  string          `json:"system"`
	Stream  bool            `json:"stream"`
	Options generateOptions `json:"options,omitempty"`
}

// generateResponse is the response from /api/generate
type generateResponse struct {
	Response string `json:"response"`
}

// embeddingRequest is the request body for /api/embeddings
type embeddingRequest struct {
	Model   string          `json:"model"`
	Prompt  string          `json:"prompt"`
	Options generateOptions `json:"options,omitempty"`
}

// embeddingResponse is the response from /api/embeddings
type embeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

// Generate sends a prompt to Ollama and returns the response text
func (o *OllamaClient) Generate(model, system, prompt string) (string, error) {
	body, err := json.Marshal(generateRequest{
		Model:  model,
		Prompt: prompt,
		System: system,
		Stream: false,
		Options: generateOptions{
			NumCtx: generateNumCtx,
		},
	})
	if err != nil {
		return "", fmt.Errorf("marshal generate request: %w", err)
	}

	resp, err := o.client.Post(o.baseURL+"/api/generate", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("ollama generate request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result generateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode ollama response: %w", err)
	}

	return result.Response, nil
}

// Embed generates an embedding vector for the given text
func (o *OllamaClient) Embed(model, text string) ([]float32, error) {
	body, err := json.Marshal(embeddingRequest{
		Model:  model,
		Prompt: text,
		Options: generateOptions{
			NumCtx:   2048,
			NumBatch: 2048,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("marshal embedding request: %w", err)
	}

	resp, err := o.client.Post(o.baseURL+"/api/embeddings", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("ollama embedding request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ollama returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result embeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode embedding response: %w", err)
	}

	if len(result.Embedding) == 0 {
		return nil, fmt.Errorf("empty embedding returned from ollama")
	}

	return result.Embedding, nil
}
