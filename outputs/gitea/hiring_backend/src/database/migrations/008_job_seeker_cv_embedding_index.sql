-- HNSW index for fast vector similarity search on job seeker CV embeddings
-- Uses CONCURRENTLY to avoid blocking writes during index creation

CREATE INDEX CONCURRENTLY idx_job_seeker_cv_analyses_embedding
    ON job_seeker_cv_analyses USING hnsw (embedding vector_cosine_ops);

-- Rollback instructions:
-- DROP INDEX idx_job_seeker_cv_analyses_embedding;
