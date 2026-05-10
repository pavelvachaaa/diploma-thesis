package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
)

// OllamaClient communicates with a local Ollama instance.
type OllamaClient struct {
	baseURL string
	client  *http.Client
	numCtx  int
}

// NewOllama creates a new Ollama client.
func NewOllama(baseURL string, numCtx int) *OllamaClient {
	return &OllamaClient{
		baseURL: baseURL,
		client:  &http.Client{},
		numCtx:  numCtx,
	}
}

type generateOptions struct {
	NumCtx int `json:"num_ctx,omitempty"`
}

type generateRequest struct {
	Model   string          `json:"model"`
	Prompt  string          `json:"prompt"`
	System  string          `json:"system"`
	Stream  bool            `json:"stream"`
	Options generateOptions `json:"options,omitempty"`
}

type generateResponse struct {
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

// Generate sends a prompt to Ollama and returns the complete response text (non-streaming).
func (o *OllamaClient) Generate(model, system, prompt string) (string, error) {
	body, err := json.Marshal(generateRequest{
		Model:  model,
		Prompt: prompt,
		System: system,
		Stream: false,
		Options: generateOptions{
			NumCtx: o.numCtx,
		},
	})
	if err != nil {
		return "", fmt.Errorf("marshal generate request: %w", err)
	}

	slog.Debug("Ollama generate request", "model", model)
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

	slog.Debug("Ollama generate completed", "chars", len(result.Response))
	return result.Response, nil
}

// GenerateStream sends a prompt to Ollama with streaming enabled.
// For each token received, onToken is called. Returns the full accumulated text.
// Respects ctx cancellation.
func (o *OllamaClient) GenerateStream(ctx context.Context, model, system, prompt string, onToken func(string)) (string, error) {
	body, err := json.Marshal(generateRequest{
		Model:  model,
		Prompt: prompt,
		System: system,
		Stream: true,
		Options: generateOptions{
			NumCtx: o.numCtx,
		},
	})
	if err != nil {
		return "", fmt.Errorf("marshal generate request: %w", err)
	}

	slog.Debug("Ollama stream request", "model", model)
	req, err := http.NewRequestWithContext(ctx, "POST", o.baseURL+"/api/generate", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := o.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama stream request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama returned %d: %s", resp.StatusCode, string(respBody))
	}

	var fullText strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	// Increase scanner buffer for potentially large lines
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return fullText.String(), ctx.Err()
		default:
		}

		line := scanner.Text()
		if line == "" {
			continue
		}

		var chunk generateResponse
		if err := json.Unmarshal([]byte(line), &chunk); err != nil {
			continue
		}

		if chunk.Response != "" {
			fullText.WriteString(chunk.Response)
			onToken(chunk.Response)
		}

		if chunk.Done {
			break
		}
	}

	if err := scanner.Err(); err != nil {
		return fullText.String(), fmt.Errorf("reading stream: %w", err)
	}

	slog.Debug("Ollama stream completed", "chars", fullText.Len())
	return fullText.String(), nil
}

// cleanJSONResponse strips markdown code blocks and finds JSON content.
func CleanJSONResponse(s string) string {
	s = strings.TrimSpace(s)

	// Remove ```json ... ``` wrapping
	if strings.HasPrefix(s, "```") {
		lines := strings.Split(s, "\n")
		if len(lines) > 2 {
			lines = lines[1 : len(lines)-1]
			s = strings.Join(lines, "\n")
		}
	}

	// Find the JSON object boundaries
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start >= 0 && end > start {
		s = s[start : end+1]
	}

	return strings.TrimSpace(s)
}
