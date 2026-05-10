package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"audit-writer-processor/internal/config"
	"audit-writer-processor/internal/consumer"
	"audit-writer-processor/internal/handlers"
	"audit-writer-processor/internal/storage"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg := config.Load()
	logger.Info("starting audit writer processor", "worker", cfg.WorkerName)

	if !cfg.AuditEnabled {
		logger.Warn("AUDIT_ENABLED=false, worker exiting")
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	writer, err := storage.NewWriter(ctx, cfg.PostgresURL)
	if err != nil {
		logger.Error("failed to initialize postgres writer", "error", err)
		os.Exit(1)
	}
	defer writer.Close()

	if err := writer.EnsureSchema(ctx, cfg.AutoCreateAuditTable); err != nil {
		if errors.Is(err, storage.ErrMissingTable) {
			logger.Error("audit_events table missing; run backend migrations or set AUDIT_AUTO_CREATE_TABLE=true")
		} else {
			logger.Error("failed to validate audit schema", "error", err)
		}
		os.Exit(1)
	}

	handler := handlers.NewAuditHandler(writer, cfg.InsertTimeout)
	c := consumer.New(
		cfg.RabbitMQURL,
		cfg.RabbitMQExchange,
		cfg.RabbitMQExchangeTy,
		cfg.RabbitMQQueue,
		cfg.RabbitMQRoutingKey,
		cfg.RabbitMQDeadKey,
		cfg.Prefetch,
		cfg.ReconnectDelay,
		logger,
		handler,
		handlers.IsPermanent,
	)

	go func() {
		if err := c.Start(ctx); err != nil {
			logger.Error("consumer stopped with error", "error", err)
			cancel()
		}
	}()

	waitForSignal(logger, cancel)
	logger.Info("shutdown complete")
}

func waitForSignal(logger *slog.Logger, cancel context.CancelFunc) {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigCh
	logger.Info("received shutdown signal", "signal", sig.String())
	cancel()
}
