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

var fieldTypeLabels = map[string]string{
	"description": "popis pozice",
	"duty":        "náplň práce",
	"requirement": "požadavky",
	"benefit":     "benefity",
}

var fieldTypeRules = map[string]string{
	"description": "Napiš plynulý odstavec o 4-6 větách. Nepoužívej odrážky, pomlčky ani seznam bodů.",
	"duty":        "Zachovej formát seznamu bodů oddělených novým řádkem. Každý bod by měl být celá, srozumitelná věta. Každý bod začni na novém řádku bez odrážek a pomlček.",
	"requirement": "Zachovej formát seznamu bodů oddělených novým řádkem. Každý bod by měl být celá, srozumitelná věta. Každý bod začni na novém řádku bez odrážek a pomlček.",
	"benefit":     "Zachovej formát seznamu bodů oddělených novým řádkem. Každý bod by měl být celá, srozumitelná věta. Každý bod začni na novém řádku bez odrážek a pomlček.",
}

type RefineHandler struct {
	ollama *ai.OllamaClient
	model  string
}

func NewRefineHandler(ollama *ai.OllamaClient, model string) *RefineHandler {
	return &RefineHandler{
		ollama: ollama,
		model:  model,
	}
}

func (h *RefineHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RefineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("Invalid refine request body", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		http.Error(w, "text is required", http.StatusBadRequest)
		return
	}

	if _, ok := fieldTypeLabels[req.FieldType]; !ok {
		http.Error(w, "field_type must be one of: description, duty, requirement, benefit", http.StatusBadRequest)
		return
	}

	flusher := setupSSE(w)
	if flusher == nil {
		return
	}

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	label := fieldTypeLabels[req.FieldType]
	rules := fieldTypeRules[req.FieldType]

	jobTitleContext := ""
	if req.JobTitle != "" {
		jobTitleContext = fmt.Sprintf(" pro pozici \"%s\"", req.JobTitle)
	}

	prompt := fmt.Sprintf(ai.RefinePrompt, label, jobTitleContext, req.Text, rules)

	slog.Info("Refine request received", "field_type", req.FieldType, "text_length", len(req.Text))

	_, err := h.ollama.GenerateStream(ctx, h.model, ai.RefineSystemPrompt, prompt, func(token string) {
		writeSSE(w, flusher, models.EventToken, map[string]string{"token": token})
	})

	if err != nil {
		if ctx.Err() != nil {
			slog.Debug("Client disconnected during refine streaming")
			return
		}
		slog.Error("Refine streaming failed", "error", err)
		writeSSE(w, flusher, models.EventError, map[string]string{"error": err.Error()})
		return
	}

	slog.Info("Refine request completed", "field_type", req.FieldType)
	writeSSE(w, flusher, models.EventDone, map[string]string{})
}
