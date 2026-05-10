package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"cv-processor/internal/storage"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Handler is a generic function that processes an event of type T
type Handler[T any] func(ctx context.Context, event T) error

// Consumer is a generic RabbitMQ consumer that handles any event type T
type Consumer[T any] struct {
	url        string
	queue      string
	exchange   string
	routingKey string
	handler    Handler[T]
	workerName string // Used for logging (e.g., "Job Seeker Worker")
}

// New creates a generic consumer.
// T: The struct type to unmarshal the JSON into (e.g., models.CVEvent).
func New[T any](url, queue, routingKey, workerName string, handler Handler[T]) *Consumer[T] {
	return &Consumer[T]{
		url:        url,
		queue:      queue,
		exchange:   "cv_events", // Assumes all events go to this exchange
		routingKey: routingKey,
		handler:    handler,
		workerName: workerName,
	}
}

func (c *Consumer[T]) Start(ctx context.Context) error {
	conn, err := amqp.Dial(c.url)
	if err != nil {
		return fmt.Errorf("failed to dial rabbitmq: %w", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %w", err)
	}
	defer ch.Close()

	// (Idempotent)
	if err := ch.ExchangeDeclare(c.exchange, "topic", true, false, false, false, nil); err != nil {
		return fmt.Errorf("exchange declare: %w", err)
	}

	q, err := ch.QueueDeclare(c.queue, true, false, false, false, amqp.Table{
		"x-message-ttl": int32(86400000), // 24 hours
	})
	if err != nil {
		return fmt.Errorf("queue declare: %w", err)
	}

	if err := ch.QueueBind(q.Name, c.routingKey, c.exchange, false, nil); err != nil {
		return fmt.Errorf("queue bind: %w", err)
	}

	if err := ch.Qos(1, 0, false); err != nil {
		return err
	}

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("consume start: %w", err)
	}

	log.Printf("[%s] Started. Listening on queue '%s'...", c.workerName, c.queue)

	for {
		select {
		case <-ctx.Done():
			log.Printf("[%s] Shutting down...", c.workerName)
			return nil
		case msg, ok := <-msgs:
			if !ok {
				return nil
			}

			// Generic Logic: Unmarshal into T
			var event T
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				log.Printf("[%s] Malformed message: %v", c.workerName, err)
				msg.Nack(false, false) // Drop bad JSON
				continue
			}

			// Call the injected handler
			if err := c.handler(ctx, event); err != nil {
				log.Printf("[%s] Processing failed: %v", c.workerName, err)

				if storage.IsPermanentError(err) {
					log.Printf("[%s] Permanent error detected. Dropping message.", c.workerName)
					msg.Nack(false, false) // Drop
				} else {
					msg.Nack(false, true) // Retry (Requeue)
				}
				continue
			}

			msg.Ack(false)
			log.Printf("[%s] Processed successfully.", c.workerName)
		}
	}
}
