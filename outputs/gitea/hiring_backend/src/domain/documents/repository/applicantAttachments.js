module.exports = ({ db, getExecutor }) => {
    const insertApplicantAttachment = async (data, options = {}) => {
        const executor = getExecutor(options);

        const insertResult = await executor.query(
            `INSERT INTO application_attachments (id, applicant_id, file_id, uploaded_at)
             VALUES (gen_random_uuid(), $1, $2, NOW())
             RETURNING id`,
            [data.applicantId, data.fileId]
        );

        const attachmentId = insertResult.rows[0]?.id;
        const fetchResult = await executor.query(
            `SELECT
                aa.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket
             FROM application_attachments aa
             JOIN files f ON f.id = aa.file_id
             WHERE aa.id = $1`,
            [attachmentId]
        );

        return fetchResult.rows[0];
    };

    const getApplicantOrganizationId = async (applicantId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            'SELECT organization_id FROM applicants WHERE id = $1',
            [applicantId]
        );

        return result.rows[0]?.organization_id || null;
    };

    const getApplicantJobInfo = async (applicantId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `SELECT jp.title, jp.description, a.organization_id, jp.id as job_posting_id
             FROM applicants a
             JOIN job_postings jp ON jp.id = a.job_posting_id
             WHERE a.id = $1`,
            [applicantId]
        );

        return result.rows[0] || {};
    };

    const getApplicantAttachments = async (applicantId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `SELECT
                aa.*,
                f.object_key AS file_path,
                f.original_filename,
                f.mime_type,
                f.size_bytes AS file_size,
                f.bucket
             FROM application_attachments aa
             JOIN files f ON f.id = aa.file_id
             WHERE applicant_id = $1
             ORDER BY aa.uploaded_at DESC`,
            [applicantId]
        );

        return result.rows;
    };

    return {
        insertApplicantAttachment,
        getApplicantOrganizationId,
        getApplicantJobInfo,
        getApplicantAttachments
    };
};
