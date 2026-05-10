package models

// ChatMessage represents a single message in the conversation.
type ChatMessage struct {
	Role    string `json:"role"`    // "user" or "assistant"
	Content string `json:"content"`
}

// ChatRequest is the incoming request body for the chat stream endpoint.
type ChatRequest struct {
	Messages          []ChatMessage `json:"messages"`
	OrganizationName  string        `json:"organization_name"`
	ExistingOfferText string        `json:"existing_offer_text,omitempty"`
}

// ExtractRequest is the incoming request body for the extract endpoint.
type ExtractRequest struct {
	OfferText        string `json:"offer_text"`
	OrganizationName string `json:"organization_name"`
}

// JobDraft represents the structured job posting data extracted by AI.
type JobDraft struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Duties       []string `json:"duties"`
	Requirements []string `json:"requirements"`
	Benefits     []string `json:"benefits"`
	Department   string   `json:"department"`
	ContractType string   `json:"contract_type"`
}

// RefineRequest is the incoming request body for the refine endpoint.
type RefineRequest struct {
	Text      string `json:"text"`
	FieldType string `json:"field_type"` // "description", "duty", "requirement", "benefit"
	JobTitle  string `json:"job_title,omitempty"`
}

// SSE event types
const (
	EventToken = "token"
	EventDone  = "done"
	EventError = "error"
)
