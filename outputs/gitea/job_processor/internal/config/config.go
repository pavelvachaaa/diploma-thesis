package config

import (
	"os"
	"strconv"
)

type Config struct {
	OllamaURL string
	ModelUsed string
	NumCtx    int
	Port      string
	LogLevel  string
}

func Load() *Config {
	return &Config{
		OllamaURL: getEnv("OLLAMA_URL", "http://localhost:11434"),
		ModelUsed: getEnv("MODEL_USED", "gemma3:12b"),
		NumCtx:    getEnvInt("NUM_CTX", 16384),
		Port:      getEnv("PORT", "8090"),
		LogLevel:  getEnv("LOG_LEVEL", "info"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
