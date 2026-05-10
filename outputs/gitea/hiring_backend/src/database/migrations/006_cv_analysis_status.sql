-- Add status tracking to cv_analyses table for real-time progress monitoring
-- Status values: pending, processing, completed, failed

-- Add new status columns
ALTER TABLE cv_analyses
ADD COLUMN status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN error_message TEXT,
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN failed_at TIMESTAMP WITH TIME ZONE;

-- Index for efficient status queries
CREATE INDEX idx_cv_analyses_status ON cv_analyses(status);

-- Update existing records to 'completed' status (they have processed_at set)
UPDATE cv_analyses SET status = 'completed' WHERE processed_at IS NOT NULL;

-- Rollback instructions:
-- ALTER TABLE cv_analyses
--     DROP COLUMN status,
--     DROP COLUMN error_message,
--     DROP COLUMN created_at,
--     DROP COLUMN started_at,
--     DROP COLUMN failed_at;
-- DROP INDEX idx_cv_analyses_status;
