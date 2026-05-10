package models

// CVEvent represents a message from RabbitMQ for CV processing
type CVEvent struct {
	AttachmentID     string `json:"attachment_id"`
	ApplicantID      string `json:"applicant_id"`
	JobPostingID     string `json:"job_posting_id"`
	OrganizationID   string `json:"organization_id"`
	S3Bucket         string `json:"s3_bucket"`
	S3Key            string `json:"s3_key"`
	MimeType         string `json:"mime_type"`
	OriginalFilename string `json:"original_filename"`
	JobTitle         string `json:"job_title"`
	JobDescription   string `json:"job_description"`
}

// ExtractedData represents structured data extracted from a CV
type ExtractedData struct {
	Name             string       `json:"name"`
	Email            string       `json:"email"`
	Phone            string       `json:"phone"`
	Skills           []string     `json:"skills"`
	Education        []Education  `json:"education"`
	Experience       []Experience `json:"experience"`
	Languages        []string     `json:"languages"`
	Certifications   []string     `json:"certifications"`
	Summary          string       `json:"summary"`
	VerbalEvaluation string       `json:"verbal_evaluation"`
}

// Education represents an education entry
type Education struct {
	Institution string `json:"institution"`
	Degree      string `json:"degree"`
	Field       string `json:"field"`
	Year        string `json:"year"`
}

// Experience represents a work experience entry
type Experience struct {
	Company     string `json:"company"`
	Position    string `json:"position"`
	Duration    string `json:"duration"`
	Description string `json:"description"`
}

// Evaluation represents the AI evaluation of a candidate
type Evaluation struct {
	Score      int      `json:"score"`
	Reasoning  string   `json:"reasoning"`
	Strengths  []string `json:"strengths"`
	Weaknesses []string `json:"weaknesses"`
}

// CVAnalysisResult is the flattened message Go sends back to Node.js via RabbitMQ
// Node.js is responsible for saving this to PostgreSQL
type CVAnalysisResult struct {
	AttachmentID   string `json:"attachment_id"`
	ApplicantID    string `json:"applicant_id"`
	OrganizationID string `json:"organization_id"`

	// Status tracking - 'completed' or 'failed'
	Status       string `json:"status,omitempty"`
	ErrorMessage string `json:"error_message,omitempty"`

	RawText string `json:"raw_text"`

	// Flattened extracted data
	CandidateName    string       `json:"candidate_name"`
	CandidateEmail   string       `json:"candidate_email"`
	CandidatePhone   string       `json:"candidate_phone"`
	Skills           []string     `json:"skills"`
	Languages        []string     `json:"languages"`
	Certifications   []string     `json:"certifications"`
	Education        []Education  `json:"education"`
	Experience       []Experience `json:"experience"`
	Summary          string       `json:"summary"`
	VerbalEvaluation string       `json:"verbal_evaluation"`

	// Flattened evaluation
	EvaluationScore      int      `json:"evaluation_score"`
	EvaluationReasoning  string   `json:"evaluation_reasoning"`
	EvaluationStrengths  []string `json:"evaluation_strengths"`
	EvaluationWeaknesses []string `json:"evaluation_weaknesses"`

	// Embedding and metadata
	Embedding        []float32 `json:"embedding"`
	ModelUsed        string    `json:"model_used"`
	EmbeddingModel   string    `json:"embedding_model"`
	ProcessingTimeMs int       `json:"processing_time_ms"`
}

// JobSeekerCVEvent represents a message from RabbitMQ for job seeker CV processing
type JobSeekerCVEvent struct {
	JobSeekerID      string `json:"job_seeker_id"`
	OrganizationID   string `json:"organization_id"`
	S3Bucket         string `json:"s3_bucket"`
	S3Key            string `json:"s3_key"`
	MimeType         string `json:"mime_type"`
	OriginalFilename string `json:"original_filename"`
}

// JobSeekerCVResult is the message Go sends back for job seeker CV analysis
// Similar to CVAnalysisResult but without job-specific evaluation
type JobSeekerCVResult struct {
	JobSeekerID    string `json:"job_seeker_id"`
	OrganizationID string `json:"organization_id"`

	// Status tracking - 'completed' or 'failed'
	Status       string `json:"status,omitempty"`
	ErrorMessage string `json:"error_message,omitempty"`

	RawText string `json:"raw_text"`

	// Flattened extracted data
	CandidateName    string       `json:"candidate_name"`
	CandidateEmail   string       `json:"candidate_email"`
	CandidatePhone   string       `json:"candidate_phone"`
	Skills           []string     `json:"skills"`
	Languages        []string     `json:"languages"`
	Certifications   []string     `json:"certifications"`
	Education        []Education  `json:"education"`
	Experience       []Experience `json:"experience"`
	Summary          string       `json:"summary"`
	VerbalEvaluation string       `json:"verbal_evaluation"`

	// NO evaluation fields - job seekers aren't compared to a specific job

	// Embedding and metadata
	Embedding        []float32 `json:"embedding"`
	ModelUsed        string    `json:"model_used"`
	EmbeddingModel   string    `json:"embedding_model"`
	ProcessingTimeMs int       `json:"processing_time_ms"`
}

// JobEmbeddingRequest represents a request from Node.js to generate a job embedding
type JobEmbeddingRequest struct {
	JobID        string `json:"job_id"`
	ContentHash  string `json:"content_hash"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	Requirements string `json:"requirements"`
	Duties       string `json:"duties"`
}

// JobEmbeddingResult is the message Go sends back for job embedding generation
type JobEmbeddingResult struct {
	JobID       string `json:"job_id"`
	ContentHash string `json:"content_hash"`

	// Status tracking - 'completed' or 'failed'
	Status       string `json:"status"`
	ErrorMessage string `json:"error_message,omitempty"`

	// Embedding vector
	Embedding []float32 `json:"embedding,omitempty"`

	// Processing metadata
	ModelUsed        string `json:"model_used"`
	ProcessingTimeMs int    `json:"processing_time_ms"`
}
