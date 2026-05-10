module.exports = ({ getExecutor }) => {
    const getStepDocuments = async (onboardingStepId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT
                od.id as document_id,
                od.name,
                od.description,
                osd.is_mandatory,
                f.object_key as file_path,
                f.original_filename as file_name,
                f.mime_type,
                f.bucket as file_bucket
            FROM onboarding_step_documents osd
            JOIN onboarding_documents od ON od.id = osd.document_id
            LEFT JOIN files f ON f.id = od.template_file_id
            WHERE osd.onboarding_step_id = $1
            ORDER BY od.name ASC
        `, [onboardingStepId]);

        return result.rows.map((doc) => ({
            ...doc,
            download_url: doc.file_path ? `/api/v1/employee/onboarding/steps/documents/${doc.document_id}/download` : null
        }));
    };

    const isDocumentAttachedToStep = async (onboardingStepId, documentId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT 1
            FROM onboarding_step_documents
            WHERE onboarding_step_id = $1 AND document_id = $2
        `, [onboardingStepId, documentId]);

        return result.rows.length > 0;
    };

    const getMandatoryDocuments = async (onboardingStepId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT
                od.id as document_id,
                od.name
            FROM onboarding_step_documents osd
            JOIN onboarding_documents od ON od.id = osd.document_id
            WHERE osd.onboarding_step_id = $1 AND osd.is_mandatory = true
        `, [onboardingStepId]);

        return result.rows;
    };

    const getDocumentForDownload = async (documentId, userId, options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(`
            SELECT DISTINCT
                od.id,
                od.name,
                f.object_key as file_path,
                f.original_filename as file_name,
                f.mime_type,
                f.bucket as file_bucket
            FROM onboarding_documents od
            JOIN onboarding_step_documents osd ON osd.document_id = od.id
            JOIN user_onboarding_steps ous ON ous.onboarding_step_id = osd.onboarding_step_id
            LEFT JOIN files f ON f.id = od.template_file_id
            WHERE od.id = $1
                AND ous.user_id = $2
                AND od.template_file_id IS NOT NULL
        `, [documentId, userId]);

        return result.rows[0] || null;
    };

    return {
        getStepDocuments,
        isDocumentAttachedToStep,
        getMandatoryDocuments,
        getDocumentForDownload
    };
};
