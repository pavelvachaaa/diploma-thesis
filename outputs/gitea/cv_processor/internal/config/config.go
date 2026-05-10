package config

import (
	"os"
)

// Config holds all configuration for the CV processor
type Config struct {
	RabbitMQURL string
	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	TikaURL     string
	OllamaURL   string
	ModelUsed   string
}

// Load reads configuration from environment variables
func Load() *Config {
	return &Config{
		RabbitMQURL: getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		S3Endpoint:  getEnv("S3_ENDPOINT", "http://localhost:8333"),
		S3AccessKey: getEnv("S3_ACCESS_KEY", "admin"),
		S3SecretKey: getEnv("S3_SECRET_KEY", "admin"),
		TikaURL:     getEnv("TIKA_URL", "http://localhost:9998"),
		ModelUsed:   getEnv("MODEL_USED", "gemma3:12b"),
		OllamaURL:   getEnv("OLLAMA_URL", "http://localhost:11434"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
