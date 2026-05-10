package consumer

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"audit-writer-processor/internal/models"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Handler interface {
	Handle(ctx context.Context, event *models.AuditEvent) error
}

type PermanentClassifier interface {
	IsPermanent(err error) bool
}

// Consumer consumes audit events from RabbitMQ and passes them to a handler.
type Consumer struct {
	url            string
	exchange       string
	exchangeType   string
	queue          string
	routingKey     string
	deadRoutingKey string
	prefetch       int
	reconnectDelay time.Duration
	logger         *slog.Logger
	handler        Handler
	isPermanent    func(error) bool
}

func New(
	url, exchange, exchangeType, queue, routingKey, deadRoutingKey string,
	prefetch int,
	reconnectDelay time.Duration,
	logger *slog.Logger,
	handler Handler,
	isPermanent func(error) bool,
) *Consumer {
	if prefetch <= 0 {
		prefetch = 50
	}
	if reconnectDelay <= 0 {
		reconnectDelay = 5 * time.Second
	}
	if exchangeType == "" {
		exchangeType = "topic"
	}
	if deadRoutingKey == "" {
		deadRoutingKey = routingKey + ".dead"
	}

	return &Consumer{
		url:            url,
		exchange:       exchange,
		exchangeType:   exchangeType,
		queue:          queue,
		routingKey:     routingKey,
		deadRoutingKey: deadRoutingKey,
		prefetch:       prefetch,
		reconnectDelay: reconnectDelay,
		logger:         logger,
		handler:        handler,
		isPermanent:    isPermanent,
	}
}

func (c *Consumer) Start(ctx context.Context) error {
	for {
		err := c.consumeOnce(ctx)
		if err == nil {
			return nil
		}

		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return nil
		}
		if ctx.Err() != nil {
			return nil
		}

		c.logger.Error("consumer loop failed, reconnecting", "error", err, "delay", c.reconnectDelay)

		select {
		case <-ctx.Done():
			return nil
		case <-time.After(c.reconnectDelay):
		}
	}
}

func (c *Consumer) consumeOnce(ctx context.Context) error {
	conn, err := amqp.Dial(c.url)
	if err != nil {
		return fmt.Errorf("dial rabbitmq: %w", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("open channel: %w", err)
	}
	defer ch.Close()

	if err := ch.ExchangeDeclare(c.exchange, c.exchangeType, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare exchange: %w", err)
	}

	deadQueue := c.queue + ".dead"
	if _, err := ch.QueueDeclare(deadQueue, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dead queue: %w", err)
	}
	if err := ch.QueueBind(deadQueue, c.deadRoutingKey, c.exchange, false, nil); err != nil {
		return fmt.Errorf("bind dead queue: %w", err)
	}

	q, err := ch.QueueDeclare(c.queue, true, false, false, false, amqp.Table{
		"x-dead-letter-exchange":    c.exchange,
		"x-dead-letter-routing-key": c.deadRoutingKey,
	})
	if err != nil {
		return fmt.Errorf("declare queue: %w", err)
	}

	if err := ch.QueueBind(q.Name, c.routingKey, c.exchange, false, nil); err != nil {
		return fmt.Errorf("bind queue: %w", err)
	}

	if err := ch.Qos(c.prefetch, 0, false); err != nil {
		return fmt.Errorf("qos: %w", err)
	}

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		return fmt.Errorf("consume: %w", err)
	}

	closeCh := make(chan *amqp.Error, 1)
	ch.NotifyClose(closeCh)

	c.logger.Info("consumer ready", "queue", q.Name, "routing_key", c.routingKey, "prefetch", c.prefetch)

	for {
		select {
		case <-ctx.Done():
			c.logger.Info("consumer context cancelled")
			return nil
		case amqpErr := <-closeCh:
			if amqpErr == nil {
				return nil
			}
			return fmt.Errorf("rabbitmq channel closed: %w", amqpErr)
		case msg, ok := <-msgs:
			if !ok {
				return errors.New("delivery channel closed")
			}

			if err := c.processMessage(ctx, msg); err != nil {
				c.logger.Error("message processing failed", "error", err)
				if c.isPermanent != nil && c.isPermanent(err) {
					_ = msg.Nack(false, false)
					continue
				}

				// Avoid endless poison loops: drop redelivered transient failures.
				if msg.Redelivered {
					_ = msg.Nack(false, false)
					continue
				}

				_ = msg.Nack(false, true)
				continue
			}

			if err := msg.Ack(false); err != nil {
				c.logger.Error("ack failed", "error", err)
			}
		}
	}
}

func (c *Consumer) processMessage(ctx context.Context, msg amqp.Delivery) error {
	var event models.AuditEvent
	if err := json.Unmarshal(msg.Body, &event); err != nil {
		return fmt.Errorf("invalid json payload: %w", err)
	}

	return c.handler.Handle(ctx, &event)
}
