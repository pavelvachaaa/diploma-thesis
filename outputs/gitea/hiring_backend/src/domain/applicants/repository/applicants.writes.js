const { RESOURCE_TYPES, addPermissionExists } = require('@shared/authz/rebacSql');

module.exports = ({
    getExecutor,
    ACCESS_LEVELS,
    buildApplicantPermissionExists
}) => {
    const createApplicant = async (applicantData, options = {}) => {
        const {
            name,
            surname,
            email,
            phone,
            address,
            city,
            zip,
            education,
            field,
            experience,
            last_employer,
            last_position,
            gdpr_consent,
            current_status,
            job_posting_id,
            organization_id
        } = applicantData;
        const executor = getExecutor(options);

        const params = [
            name,
            surname,
            email,
            phone,
            address,
            city,
            zip,
            education,
            field,
            experience,
            last_employer,
            last_position,
            gdpr_consent,
            current_status,
            job_posting_id,
            organization_id
        ];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addPermissionExists({
                params,
                actorUserId: options.actorUserId,
                resourceType: RESOURCE_TYPES.JOB_POSTING,
                resourceAlias: 'jp',
                resourceIdColumn: 'id',
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const sql = `
            INSERT INTO applicants (
                id, name, surname, email, phone, address, city, zip,
                education, field, experience, last_employer, last_position,
                gdpr_consent, current_status, job_posting_id, organization_id, applied_at
            )
            SELECT
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14, $15, COALESCE($16, jp.organization_id), NOW()
            FROM job_postings jp
            WHERE jp.id = $15${aclClause}
            RETURNING *
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0];
    };

    const updateApplicantStatus = async (applicantId, statusName, options = {}) => {
        const executor = getExecutor(options);
        const params = [statusName, applicantId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = ` AND ${buildApplicantPermissionExists({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const sql = `
            UPDATE applicants a
            SET current_status = $1
            WHERE a.id = $2${aclExists}
            RETURNING a.*
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0];
    };

    return {
        createApplicant,
        updateApplicantStatus
    };
};
