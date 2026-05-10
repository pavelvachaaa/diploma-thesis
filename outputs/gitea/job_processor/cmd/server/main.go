package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"job-processor/internal/ai"
	"job-processor/internal/config"
	"job-processor/internal/handlers"
)

func main() {
	cfg := config.Load()

	var level slog.Level
	switch strings.ToLower(cfg.LogLevel) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: level})))

	slog.Info("Job Processor starting",
		"model", cfg.ModelUsed,
		"ollama", cfg.OllamaURL,
		"num_ctx", cfg.NumCtx,
		"port", cfg.Port,
		"log_level", cfg.LogLevel,
	)

	ollamaClient := ai.NewOllama(cfg.OllamaURL, cfg.NumCtx)
	chatHandler := handlers.NewChatHandler(ollamaClient, cfg.ModelUsed)
	refineHandler := handlers.NewRefineHandler(ollamaClient, cfg.ModelUsed)

	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/chat/stream", chatHandler)
	mux.HandleFunc("POST /api/v1/chat/extract", chatHandler.HandleExtract)
	mux.Handle("POST /api/v1/chat/refine", refineHandler)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		WriteTimeout: 5 * time.Minute,
		ReadTimeout:  10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("Server listening", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigCh
	slog.Info("Received signal, shutting down", "signal", sig)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server shutdown error", "error", err)
	}

	slog.Info("Server stopped")
}
