package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// writeSSE writes a Server-Sent Event to the response writer.
func writeSSE(w http.ResponseWriter, flusher http.Flusher, event string, data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		slog.Error("Failed to marshal SSE data", "error", err)
		return
	}
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, string(jsonData))
	flusher.Flush()
}

// setupSSE sets SSE headers and returns the flusher. Returns nil if streaming is not supported.
func setupSSE(w http.ResponseWriter) http.Flusher {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return nil
	}
	return flusher
}
