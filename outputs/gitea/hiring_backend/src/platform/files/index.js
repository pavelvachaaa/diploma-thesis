module.exports = ({ db, logger }) => {
    const getExecutor = (options = {}) => options.client || db;

    const toPositiveInt = (value, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
    };

    const getRetentionDays = () => toPositiveInt(process.env.FILE_RETENTION_DAYS, 30);

    const createFileRecord = async ({
        storageProvider = 's3',
        bucket,
        objectKey,
        mimeType = null,
        sizeBytes = null,
        originalFilename = null,
        checksumSha256 = null,
        organizationId = null,
        uploadedBy = null,
        sourceModule = 'unknown',
        metadata = {}
    }, options = {}) => {
        if (!bucket || !objectKey) {
            throw new Error('bucket and objectKey are required to create a file record');
        }

        const executor = getExecutor(options);
        const result = await executor.query(
            `INSERT INTO files (
                storage_provider,
                bucket,
                object_key,
                mime_type,
                size_bytes,
                original_filename,
                checksum_sha256,
                organization_id,
                uploaded_by,
                source_module,
                lifecycle_state,
                metadata
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11::jsonb
            )
            ON CONFLICT (bucket, object_key)
            DO UPDATE SET
                updated_at = NOW(),
                metadata = files.metadata || EXCLUDED.metadata
            RETURNING *`,
            [
                storageProvider,
                bucket,
                objectKey,
                mimeType,
                sizeBytes,
                originalFilename,
                checksumSha256,
                organizationId,
                uploadedBy,
                sourceModule,
                JSON.stringify(metadata || {})
            ]
        );

        return result.rows[0];
    };

    const getById = async (fileId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query('SELECT * FROM files WHERE id = $1', [fileId]);
        return result.rows[0] || null;
    };

    const resolveForDownload = async (fileId, options = {}) => {
        const file = await getById(fileId, options);
        if (!file) {
            return null;
        }

        return {
            id: file.id,
            bucket: file.bucket,
            file_path: file.object_key,
            object_key: file.object_key,
            original_name: file.original_filename,
            original_filename: file.original_filename,
            mime_type: file.mime_type,
            file_size: file.size_bytes,
            size_bytes: file.size_bytes,
            checksum_sha256: file.checksum_sha256,
            lifecycle_state: file.lifecycle_state,
            retention_until: file.retention_until
        };
    };

    const markRetained = async (fileId, options = {}) => {
        const executor = getExecutor(options);
        const retentionDays = toPositiveInt(options.retentionDays, getRetentionDays());

        const result = await executor.query(
            `UPDATE files
             SET lifecycle_state = 'retained',
                 retention_until = NOW() + ($2 || ' days')::interval,
                 deleted_at = NULL,
                 metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                fileId,
                String(retentionDays),
                JSON.stringify(options.metadata || {})
            ]
        );

        const file = result.rows[0] || null;
        if (file) {
            logger?.info?.('File marked as retained', {
                fileId,
                retentionUntil: file.retention_until
            });
        }

        return file;
    };

    const markDeleted = async (fileId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `UPDATE files
             SET lifecycle_state = 'deleted',
                 deleted_at = NOW(),
                 retention_until = NULL,
                 metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                fileId,
                JSON.stringify(options.metadata || {})
            ]
        );

        return result.rows[0] || null;
    };

    const markDeleteFailed = async (fileId, error, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `UPDATE files
             SET lifecycle_state = 'delete_failed',
                 metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                fileId,
                JSON.stringify({
                    delete_error: {
                        message: error?.message || 'Unknown delete error',
                        code: error?.code || null,
                        at: new Date().toISOString()
                    }
                })
            ]
        );

        return result.rows[0] || null;
    };

    const getLifecycleStats = async (options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                lifecycle_state,
                COUNT(*)::int AS count
            FROM files
            GROUP BY lifecycle_state
            ORDER BY lifecycle_state ASC
        `;
        const result = await executor.query(query);
        return result.rows;
    };

    return {
        getRetentionDays,
        createFileRecord,
        getById,
        resolveForDownload,
        markRetained,
        markDeleted,
        markDeleteFailed,
        getLifecycleStats
    };
};
