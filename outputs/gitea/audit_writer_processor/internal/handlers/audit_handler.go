package handlers

import (
	"context"
	"errors"
	"fmt"
	"time"

	"audit-writer-processor/internal/models"
	"audit-writer-processor/internal/storage"
)

var ErrPermanent = errors.New("permanent message error")

// AuditHandler validates and persists audit events.
type AuditHandler struct {
	writer        *storage.Writer
	insertTimeout time.Duration
}

func NewAuditHandler(writer *storage.Writer, insertTimeout time.Duration) *AuditHandler {
	if insertTimeout <= 0 {
		insertTimeout = 3 * time.Second
	}

	return &AuditHandler{
		writer:        writer,
		insertTimeout: insertTimeout,
	}
}

func (h *AuditHandler) Handle(ctx context.Context, event *models.AuditEvent) error {
	if event == nil {
		return fmt.Errorf("%w: empty payload", ErrPermanent)
	}

	event.Normalize()

	if event.Category == "" {
		return fmt.Errorf("%w: missing category", ErrPermanent)
	}
	if event.Action == "" {
		return fmt.Errorf("%w: missing action", ErrPermanent)
	}
	if event.Status != "success" && event.Status != "failure" {
		return fmt.Errorf("%w: invalid status %q", ErrPermanent, event.Status)
	}

	writeCtx, cancel := context.WithTimeout(ctx, h.insertTimeout)
	defer cancel()

	if err := h.writer.InsertEvent(writeCtx, event); err != nil {
		return err
	}

	return nil
}

func IsPermanent(err error) bool {
	return errors.Is(err, ErrPermanent)
}
