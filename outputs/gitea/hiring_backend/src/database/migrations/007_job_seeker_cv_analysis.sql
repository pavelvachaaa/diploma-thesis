CREATE TABLE job_seeker_cv_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    model_used VARCHAR(100) DEFAULT 'llama3.1:8b',
    embedding_model VARCHAR(100) DEFAULT 'nomic-embed-text',
    processing_time_ms INTEGER,

    -- Source Data
    raw_text TEXT,

    -- Structured Data
    candidate_name TEXT,
    candidate_email TEXT,
    candidate_phone TEXT,
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    education JSONB DEFAULT '[]', 
    experience JSONB DEFAULT '[]',
    summary TEXT,
    
    
    -- Embedding vector (nomic-embed-text = 768 dimensions)
    embedding vector(768),

    CONSTRAINT uq_job_seeker_cv_analysis UNIQUE (job_seeker_id)
);

-- 1. Vector Index (Critical for speed)
CREATE INDEX idx_job_seeker_cv_vec ON job_seeker_cv_analyses USING hnsw (embedding vector_cosine_ops);

-- 2. Standard Search Index (For "Contains 'Java'" queries)
CREATE INDEX idx_job_seeker_cv_skills ON job_seeker_cv_analyses USING gin (skills);

-- 3. Status Index
CREATE INDEX idx_job_seeker_cv_status ON job_seeker_cv_analyses(status);