package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	RabbitMQURL        string
	RabbitMQExchange   string
	RabbitMQExchangeTy string
	RabbitMQQueue      string
	RabbitMQRoutingKey string
	RabbitMQDeadKey    string
	Prefetch           int
	ReconnectDelay     time.Duration

	PostgresURL          string
	AutoCreateAuditTable bool
	AuditEnabled         bool
	InsertTimeout        time.Duration
	WorkerName           string
}

func Load() *Config {
	routingKey := getEnv("AUDIT_ROUTING_KEY", "audit.event")
	deadKey := getEnv("AUDIT_DEAD_ROUTING_KEY", routingKey+".dead")

	return &Config{
		RabbitMQURL:        getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		RabbitMQExchange:   getEnv("AUDIT_EXCHANGE", "audit_events"),
		RabbitMQExchangeTy: getEnv("AUDIT_EXCHANGE_TYPE", "topic"),
		RabbitMQQueue:      getEnv("AUDIT_QUEUE", "audit_writer"),
		RabbitMQRoutingKey: routingKey,
		RabbitMQDeadKey:    deadKey,
		Prefetch:           getEnvInt("AUDIT_PREFETCH", 50),
		ReconnectDelay:     getEnvDuration("AUDIT_RECONNECT_DELAY", 5*time.Second),

		PostgresURL:          getEnv("POSTGRES_URL", "postgres://admin:admin@localhost:5432/hiring?sslmode=disable"),
		AutoCreateAuditTable: getEnvBool("AUDIT_AUTO_CREATE_TABLE", false),
		AuditEnabled:         getEnvBool("AUDIT_ENABLED", true),
		InsertTimeout:        getEnvDuration("AUDIT_INSERT_TIMEOUT", 3*time.Second),
		WorkerName:           getEnv("WORKER_NAME", "audit-writer-processor"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return parsed
}
