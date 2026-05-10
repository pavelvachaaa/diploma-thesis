const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists,
    addExistsClause,
    addClause
} = require('@shared/authz/rebacSql');

module.exports = ({ getExecutor, buildDocumentAccessCondition }) => {
    const getUserDocumentForDownload = async (userId, userDocumentId, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                f.object_key AS file_path,
                f.bucket,
                ud.uploaded_at,
                f.original_filename,
                f.mime_type,
                od.name as document_name,
                COALESCE(f.original_filename, od.name, 'document') as original_name,
                od.name as template_name
            FROM user_documents ud
            JOIN onboarding_documents od ON od.id = ud.document_id
            JOIN files f ON f.id = ud.file_id
            WHERE ud.user_id = $1 AND ud.id = $2 AND ud.file_id IS NOT NULL
        `;

        const result = await executor.query(query, [userId, userDocumentId]);
        if (result.rows.length === 0) {
            throw new Error('Document not found, not uploaded, or access denied');
        }

        return result.rows[0];
    };

    const getEmployeeDocumentForDownload = async (employeeId, documentId, options = {}) => {
        const executor = getExecutor(options);
        const params = [employeeId, documentId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM users u
                    WHERE u.id = ud.user_id${addClause('AND', addPermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        resourceType: RESOURCE_TYPES.ORGANIZATION,
                        resourceAlias: 'u',
                        resourceIdColumn: 'organization_id',
                        minAccess: options.minAccess || ACCESS_LEVELS.READ
                    }))}`
            );
        }

        const query = `
            SELECT
                f.object_key AS file_path,
                f.bucket,
                ud.uploaded_at,
                f.original_filename,
                f.mime_type,
                od.name as document_name,
                tf.original_filename as template_name,
                COALESCE(f.original_filename, od.name, 'document') as original_name
            FROM user_documents ud
            JOIN onboarding_documents od ON ud.document_id = od.id
            LEFT JOIN files tf ON tf.id = od.template_file_id
            JOIN files f ON f.id = ud.file_id
            WHERE ud.user_id = $1 AND ud.document_id = $2 AND ud.file_id IS NOT NULL
            ${aclClause}
        `;

        const result = await executor.query(query, params);
        if (result.rows.length === 0) {
            throw new Error('Document not found or not uploaded');
        }

        return result.rows[0];
    };

    const getOnboardingTemplateForDownload = async (templateId, options = {}) => {
        const executor = getExecutor(options);
        const params = [templateId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${buildDocumentAccessCondition({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const query = `
            SELECT
                f.object_key AS file_path,
                f.bucket,
                f.original_filename as original_name,
                f.mime_type
            FROM onboarding_documents od
            JOIN files f ON f.id = od.template_file_id
            WHERE od.id = $1
            ${aclClause}
        `;

        const result = await executor.query(query, params);
        if (result.rows.length === 0) {
            throw new Error('Template not found');
        }

        return result.rows[0];
    };

    const getOnboardingTemplateByFilename = async (templateFile, options = {}) => {
        const executor = getExecutor(options);
        const query = `
            SELECT
                f.object_key AS file_path,
                f.bucket,
                f.original_filename as original_name,
                f.mime_type
            FROM onboarding_documents od
            JOIN files f ON f.id = od.template_file_id
            WHERE f.original_filename = $1
        `;

        const result = await executor.query(query, [templateFile]);
        if (result.rows.length === 0) {
            throw new Error('Template file not found');
        }

        return result.rows[0];
    };

    return {
        getUserDocumentForDownload,
        getEmployeeDocumentForDownload,
        getOnboardingTemplateForDownload,
        getOnboardingTemplateByFilename
    };
};
