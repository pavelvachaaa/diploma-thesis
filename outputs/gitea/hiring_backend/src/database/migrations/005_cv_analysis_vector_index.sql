-- HNSW index for fast cosine similarity search on CV embeddings
-- Uses CONCURRENTLY to avoid blocking production writes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cv_analyses_embedding
    ON cv_analyses USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
