package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"

	"job-processor/internal/ai"
	"job-processor/internal/models"
)

type ChatHandler struct {
	ollama *ai.OllamaClient
	model  string
}

func NewChatHandler(ollama *ai.OllamaClient, model string) *ChatHandler {
	return &ChatHandler{
		ollama: ollama,
		model:  model,
	}
}

// ServeHTTP handles POST /api/v1/chat/stream.
func (h *ChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("Invalid request body", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Messages) == 0 {
		slog.Warn("Empty messages array")
		http.Error(w, "Messages array is required", http.StatusBadRequest)
		return
	}

	flusher := setupSSE(w)
	if flusher == nil {
		return
	}

	// Create cancellable context tied to client disconnect
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	slog.Info("Chat request received", "messages", len(req.Messages), "org", req.OrganizationName)

	// Build prompt from message history
	prompt := buildPrompt(req.Messages)

	systemPrompt := ai.ChatSystemPrompt
	if req.OrganizationName != "" {
		systemPrompt += fmt.Sprintf("\n\nOrganizace uživatele: %s", req.OrganizationName)
	}
	if req.ExistingOfferText != "" {
		systemPrompt += fmt.Sprintf("\n\nAktuální text nabídky, na kterém uživatel pracuje:\n%s", req.ExistingOfferText)
	}

	_, err := h.ollama.GenerateStream(ctx, h.model, systemPrompt, prompt, func(token string) {
		writeSSE(w, flusher, models.EventToken, map[string]string{"token": token})
	})

	if err != nil {
		if ctx.Err() != nil {
			slog.Debug("Client disconnected during streaming")
			return
		}
		slog.Error("Streaming failed", "error", err)
		writeSSE(w, flusher, models.EventError, map[string]string{"error": err.Error()})
		return
	}

	slog.Info("Chat request completed", "messages", len(req.Messages))
	writeSSE(w, flusher, models.EventDone, map[string]string{})
}

// HandleExtract handles POST /api/v1/chat/extract.
func (h *ChatHandler) HandleExtract(w http.ResponseWriter, r *http.Request) {
	var req models.ExtractRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("Invalid extract request body", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.OfferText) == "" {
		http.Error(w, "offer_text is required", http.StatusBadRequest)
		return
	}

	slog.Info("Extract request received", "text_length", len(req.OfferText))

	draft, err := h.extractFromText(r.Context(), req.OfferText)
	if err != nil {
		slog.Error("Extraction failed", "error", err)
		http.Error(w, "Nepodařilo se extrahovat data nabídky", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(draft)
}

// extractFromText extracts structured job data from offer text using Ollama.
func (h *ChatHandler) extractFromText(ctx context.Context, offerText string) (*models.JobDraft, error) {
	prompt := fmt.Sprintf(ai.ExtractionFromTextPrompt, offerText)

	for attempt := 1; attempt <= 3; attempt++ {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		slog.Debug("Extraction attempt", "attempt", attempt)
		response, err := h.ollama.Generate(h.model, ai.ExtractionSystemPrompt, prompt)
		if err != nil {
			return nil, fmt.Errorf("ollama generate (attempt %d): %w", attempt, err)
		}

		cleaned := ai.CleanJSONResponse(response)

		var draft models.JobDraft
		if err := json.Unmarshal([]byte(cleaned), &draft); err != nil {
			slog.Warn("JSON parse error", "attempt", attempt, "error", err)
			if attempt == 3 {
				return nil, fmt.Errorf("failed to parse job data after 3 attempts: %w", err)
			}
			continue
		}

		return &draft, nil
	}

	return nil, fmt.Errorf("extraction failed after all attempts")
}

// buildPrompt concatenates messages into a single prompt for Ollama.
func buildPrompt(messages []models.ChatMessage) string {
	var sb strings.Builder
	for _, msg := range messages {
		switch msg.Role {
		case "user":
			sb.WriteString("Uživatel: ")
		case "assistant":
			sb.WriteString("Asistent: ")
		}
		sb.WriteString(msg.Content)
		sb.WriteString("\n\n")
	}
	sb.WriteString("Asistent: ")
	return sb.String()
}

