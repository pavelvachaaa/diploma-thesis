package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	amqp "github.com/rabbitmq/amqp091-go"

	"cv-processor/internal/ai"
	"cv-processor/internal/config"
	"cv-processor/internal/consumer"
	"cv-processor/internal/extractor"
	"cv-processor/internal/handlers"
	"cv-processor/internal/storage"
)

func main() {
	log.Println("CV Processor starting...")

	cfg := config.Load()

	rabbitConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer rabbitConn.Close()

	publisher, err := consumer.NewPublisher(rabbitConn)
	if err != nil {
		log.Fatalf("Failed to create publisher: %v", err)
	}
	defer publisher.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	seaweedClient, err := storage.NewSeaweed(
		ctx,
		cfg.S3Endpoint,
		cfg.S3AccessKey,
		cfg.S3SecretKey,
	)

	if err != nil {
		log.Fatalf("Failed to create SeaweedFS client: %v", err)
	}

	tikaClient := extractor.NewTika(cfg.TikaURL)
	ollamaClient := ai.NewOllama(cfg.OllamaURL)

	applicantHandler := handlers.NewApplicantHandler(
		seaweedClient,
		tikaClient,
		ollamaClient,
		publisher,
		cfg.ModelUsed,
	)

	jobSeekerHandler := handlers.NewJobSeekerHandler(
		seaweedClient,
		tikaClient,
		ollamaClient,
		publisher,
		cfg.ModelUsed,
	)

	jobEmbeddingHandler := handlers.NewJobEmbeddingHandler(
		ollamaClient,
		publisher,
		cfg.ModelUsed,
	)

	appConsumer := consumer.New(
		cfg.RabbitMQURL,
		"cv_processing",    // Queue Name
		"cv.uploaded",      // Routing Key
		"Applicant Worker", // Log Label
		applicantHandler,   // The handler function from step 4
	)

	seekerConsumer := consumer.New(
		cfg.RabbitMQURL,
		"job_seeker_cv_processing",
		"job_seeker_cv.uploaded",
		"Seeker Worker",
		jobSeekerHandler,
	)

	embedConsumer := consumer.New(
		cfg.RabbitMQURL,
		"job_embedding_processing",
		"job.embedding.requested",
		"Embedding Worker",
		jobEmbeddingHandler,
	)

	// Start all consumers in separate goroutines
	go func() {
		if err := appConsumer.Start(ctx); err != nil {
			log.Printf("Applicant consumer stopped: %v", err)
		}
	}()

	go func() {
		if err := seekerConsumer.Start(ctx); err != nil {
			log.Printf("Job Seeker consumer stopped: %v", err)
		}
	}()

	go func() {
		if err := embedConsumer.Start(ctx); err != nil {
			log.Printf("Job Embedding consumer stopped: %v", err)
		}
	}()

	log.Println("All workers started successfully. Press Ctrl+C to stop.")
	waitForShutdown(cancel)
}

func waitForShutdown(cancel context.CancelFunc) {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigCh
	log.Printf("Received signal %v, shutting down...", sig)

	cancel() // This cancels the context, causing all consumers to stop their loops

	log.Println("Shutdown complete.")
}
