package models

import (
	"encoding/json"
	"strings"
	"time"
)

// AuditEvent represents the queue payload to persist in audit_events.
// It accepts both snake_case and camelCase payload fields.
type AuditEvent struct {
	OccurredAt *time.Time `json:"occurred_at,omitempty"`

	RequestID      string `json:"request_id,omitempty"`
	RequestIDCamel string `json:"requestId,omitempty"`

	Source string `json:"source,omitempty"`

	Category string `json:"category"`
	Action   string `json:"action"`
	Status   string `json:"status,omitempty"`

	ActorUserID      string   `json:"actor_user_id,omitempty"`
	ActorUserIDCamel string   `json:"actorUserId,omitempty"`
	ActorEmail       string   `json:"actor_email,omitempty"`
	ActorEmailCamel  string   `json:"actorEmail,omitempty"`
	ActorRoles       []string `json:"actor_roles,omitempty"`
	ActorRolesCamel  []string `json:"actorRoles,omitempty"`

	OrganizationID      string `json:"organization_id,omitempty"`
	OrganizationIDCamel string `json:"organizationId,omitempty"`

	Method string `json:"method,omitempty"`
	Path   string `json:"path,omitempty"`

	ResourceType      string `json:"resource_type,omitempty"`
	ResourceTypeCamel string `json:"resourceType,omitempty"`
	ResourceID        string `json:"resource_id,omitempty"`
	ResourceIDCamel   string `json:"resourceId,omitempty"`

	Target     string `json:"target,omitempty"`
	StatusCode *int   `json:"status_code,omitempty"`

	IP      string `json:"ip,omitempty"`
	IPCamel string `json:"ipAddress,omitempty"`

	UserAgent      string `json:"user_agent,omitempty"`
	UserAgentCamel string `json:"userAgent,omitempty"`

	Metadata      json.RawMessage `json:"metadata,omitempty"`
	MetadataCamel json.RawMessage `json:"meta,omitempty"`

	BeforeState      json.RawMessage `json:"before_state,omitempty"`
	BeforeStateCamel json.RawMessage `json:"beforeState,omitempty"`
	AfterState       json.RawMessage `json:"after_state,omitempty"`
	AfterStateCamel  json.RawMessage `json:"afterState,omitempty"`

	ErrorMessage      string `json:"error_message,omitempty"`
	ErrorMessageCamel string `json:"errorMessage,omitempty"`
}

// Normalize resolves aliases and applies defaults.
func (e *AuditEvent) Normalize() {
	e.RequestID = firstNonEmpty(e.RequestID, e.RequestIDCamel)
	e.ActorUserID = firstNonEmpty(e.ActorUserID, e.ActorUserIDCamel)
	e.ActorEmail = firstNonEmpty(e.ActorEmail, e.ActorEmailCamel)
	e.OrganizationID = firstNonEmpty(e.OrganizationID, e.OrganizationIDCamel)
	e.ResourceType = firstNonEmpty(e.ResourceType, e.ResourceTypeCamel)
	e.ResourceID = firstNonEmpty(e.ResourceID, e.ResourceIDCamel)
	e.IP = firstNonEmpty(e.IP, e.IPCamel)
	e.UserAgent = firstNonEmpty(e.UserAgent, e.UserAgentCamel)
	e.ErrorMessage = firstNonEmpty(e.ErrorMessage, e.ErrorMessageCamel)

	if len(e.ActorRoles) == 0 && len(e.ActorRolesCamel) > 0 {
		e.ActorRoles = e.ActorRolesCamel
	}
	if len(e.Metadata) == 0 && len(e.MetadataCamel) > 0 {
		e.Metadata = e.MetadataCamel
	}
	if len(e.BeforeState) == 0 && len(e.BeforeStateCamel) > 0 {
		e.BeforeState = e.BeforeStateCamel
	}
	if len(e.AfterState) == 0 && len(e.AfterStateCamel) > 0 {
		e.AfterState = e.AfterStateCamel
	}

	e.Category = strings.TrimSpace(e.Category)
	e.Action = strings.TrimSpace(e.Action)
	e.Status = strings.TrimSpace(strings.ToLower(e.Status))
	if e.Status == "" {
		e.Status = "success"
	}
	if e.Source == "" {
		e.Source = "api"
	}
	if len(e.Metadata) == 0 {
		e.Metadata = json.RawMessage(`{}`)
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}
