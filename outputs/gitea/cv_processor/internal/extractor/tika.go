package extractor

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

// TikaClient extracts text from documents via Apache Tika
type TikaClient struct {
	baseURL string
	client  *http.Client
}

// NewTika creates a new Tika client
func NewTika(baseURL string) *TikaClient {
	return &TikaClient{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

// Extract sends a document to Tika and returns extracted text
func (t *TikaClient) Extract(data []byte, mimeType string) (string, error) {
	req, err := http.NewRequest("PUT", t.baseURL+"/tika", bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("create tika request: %w", err)
	}

	req.Header.Set("Content-Type", mimeType)
	req.Header.Set("Accept", "text/plain")

	resp, err := t.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("tika request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("tika returned %d: %s", resp.StatusCode, string(body))
	}

	text, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read tika response: %w", err)
	}

	return string(text), nil
}
