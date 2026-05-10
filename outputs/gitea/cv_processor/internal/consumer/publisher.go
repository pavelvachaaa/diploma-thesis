package consumer

import (
	"encoding/json"
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"

	"cv-processor/internal/models"
)

// Publisher sends CV analysis results back to Node.js via RabbitMQ
type Publisher struct {
	channel  *amqp.Channel
	exchange string
}

// NewPublisher creates a publisher using an existing AMQP connection
func NewPublisher(conn *amqp.Connection) (*Publisher, error) {
	ch, err := conn.Channel()
	if err != nil {
		return nil, fmt.Errorf("create channel: %w", err)
	}

	exchange := "cv_events"

	// Ensure exchange exists (idempotent)
	if err := ch.ExchangeDeclare(exchange, "topic", true, false, false, false, nil); err != nil {
		ch.Close()
		return nil, fmt.Errorf("declare exchange: %w", err)
	}

	// Declare the results queue and bind to cv.analyzed
	_, err = ch.QueueDeclare("cv_results", true, false, false, false, amqp.Table{
		"x-message-ttl": int32(86400000),
	})
	if err != nil {
		ch.Close()
		return nil, fmt.Errorf("declare results queue: %w", err)
	}

	if err := ch.QueueBind("cv_results", "cv.analyzed", exchange, false, nil); err != nil {
		ch.Close()
		return nil, fmt.Errorf("bind results queue: %w", err)
	}

	// Declare the job seeker results queue and bind to job_seeker_cv.analyzed
	_, err = ch.QueueDeclare("job_seeker_cv_results", true, false, false, false, amqp.Table{
		"x-message-ttl": int32(86400000),
	})
	if err != nil {
		ch.Close()
		return nil, fmt.Errorf("declare job seeker results queue: %w", err)
	}

	if err := ch.QueueBind("job_seeker_cv_results", "job_seeker_cv.analyzed", exchange, false, nil); err != nil {
		ch.Close()
		return nil, fmt.Errorf("bind job seeker results queue: %w", err)
	}

	// Declare the job embedding results queue and bind to job.embedding.completed
	_, err = ch.QueueDeclare("job_embedding_results", true, false, false, false, amqp.Table{
		"x-message-ttl": int32(86400000),
	})
	if err != nil {
		ch.Close()
		return nil, fmt.Errorf("declare job embedding results queue: %w", err)
	}

	if err := ch.QueueBind("job_embedding_results", "job.embedding.completed", exchange, false, nil); err != nil {
		ch.Close()
		return nil, fmt.Errorf("bind job embedding results queue: %w", err)
	}

	return &Publisher{channel: ch, exchange: exchange}, nil
}

// PublishResult sends a CV analysis result back to Node.js
func (p *Publisher) PublishResult(result *models.CVAnalysisResult) error {
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("marshal result: %w", err)
	}

	return p.channel.Publish(p.exchange, "cv.analyzed", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

// PublishJobSeekerResult sends a job seeker CV analysis result back to Node.js
func (p *Publisher) PublishJobSeekerResult(result *models.JobSeekerCVResult) error {
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("marshal job seeker result: %w", err)
	}

	return p.channel.Publish(p.exchange, "job_seeker_cv.analyzed", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

// PublishJobEmbeddingResult sends a job embedding result back to Node.js
func (p *Publisher) PublishJobEmbeddingResult(result *models.JobEmbeddingResult) error {
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("marshal job embedding result: %w", err)
	}

	return p.channel.Publish(p.exchange, "job.embedding.completed", false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

// Close closes the publisher channel
func (p *Publisher) Close() error {
	if p.channel != nil {
		return p.channel.Close()
	}
	return nil
}
