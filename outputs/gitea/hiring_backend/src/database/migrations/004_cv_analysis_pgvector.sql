-- CV Analysis with pgvector for semantic search
-- Requires pgvector/pgvector:pg17 Docker image
-- Final flattened schema matching Go cv-processor/internal/models/models.go

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CV Analysis results table (flattened schema - no JSONB for extracted_data/evaluation_detail)
CREATE TABLE cv_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attachment_id UUID NOT NULL REFERENCES application_attachments(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Extracted text from CV
    raw_text TEXT,

    -- Flattened extracted data (from Go ExtractedData struct)
    candidate_name TEXT,
    candidate_email TEXT,
    candidate_phone TEXT,
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    education JSONB DEFAULT '[]',  -- Array of {institution, degree, field, year}
    experience JSONB DEFAULT '[]', -- Array of {company, position, duration, description}
    summary TEXT,
    verbal_evaluation TEXT,

    -- Flattened evaluation (from Go Evaluation struct)
    evaluation_score INTEGER CHECK (evaluation_score >= 0 AND evaluation_score <= 100),
    evaluation_reasoning TEXT,
    evaluation_strengths TEXT[] DEFAULT '{}',
    evaluation_weaknesses TEXT[] DEFAULT '{}',

    -- Embedding vector (nomic-embed-text = 768 dimensions)
    embedding vector(768),

    -- Processing metadata
    model_used VARCHAR(100) DEFAULT 'llama3.1:8b',
    embedding_model VARCHAR(100) DEFAULT 'nomic-embed-text',
    processing_time_ms INTEGER,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cv_analysis_attachment UNIQUE (attachment_id)
);

-- Standard indexes
CREATE INDEX idx_cv_analyses_applicant ON cv_analyses(applicant_id);
CREATE INDEX idx_cv_analyses_org ON cv_analyses(organization_id);
CREATE INDEX idx_cv_analyses_score ON cv_analyses(evaluation_score DESC);

-- GIN index on skills array for efficient && (overlap) queries
CREATE INDEX idx_cv_analyses_skills ON cv_analyses USING gin (skills);
