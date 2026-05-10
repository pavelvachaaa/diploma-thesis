module.exports = ({ db, getExecutor }) => {
    const getUserDocumentStats = async (options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `SELECT
                COUNT(*)::int AS count,
                COALESCE(SUM(f.size_bytes), 0)::bigint AS total_size
             FROM user_documents ud
             JOIN files f ON f.id = ud.file_id`
        );

        return result.rows[0];
    };

    const getApplicantAttachmentStats = async (options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `SELECT
                COUNT(*)::int AS count,
                COALESCE(SUM(f.size_bytes), 0)::bigint AS total_size
             FROM application_attachments aa
             JOIN files f ON f.id = aa.file_id`
        );

        return result.rows[0];
    };

    const getOnboardingTemplateStats = async (options = {}) => {
        const executor = getExecutor(options);
        const result = await executor.query(
            `SELECT
                COUNT(*)::int AS count,
                COALESCE(SUM(f.size_bytes), 0)::bigint AS total_size
             FROM onboarding_documents od
             JOIN files f ON f.id = od.template_file_id`
        );

        return result.rows[0];
    };

    return {
        getUserDocumentStats,
        getApplicantAttachmentStats,
        getOnboardingTemplateStats
    };
};
