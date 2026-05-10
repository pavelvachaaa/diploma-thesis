const {
    RESOURCE_TYPES,
    ACCESS_LEVELS,
    addPermissionExists
} = require('@shared/authz/rebacSql');

module.exports = ({ getExecutor }) => {
    const addOrganizationAcl = ({
        params,
        actorUserId,
        resourceAlias = 'os',
        minAccess = ACCESS_LEVELS.READ
    }) => addPermissionExists({
        params,
        actorUserId,
        resourceType: RESOURCE_TYPES.ORGANIZATION,
        resourceAlias,
        resourceIdColumn: 'organization_id',
        minAccess
    });

    const getAllSteps = async (organizationId, options = {}) => {
        const executor = getExecutor(options);
        const params = [organizationId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addOrganizationAcl({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.READ
            })}`;
        }

        const result = await executor.query(`
            SELECT os.*, array_agg(
                CASE WHEN osd.document_id IS NOT NULL
                THEN json_build_object(
                    'id', od.id,
                    'name', od.name,
                    'is_mandatory', osd.is_mandatory
                ) END
            ) FILTER (WHERE osd.document_id IS NOT NULL) as documents
            FROM onboarding_steps os
            LEFT JOIN onboarding_step_documents osd ON osd.onboarding_step_id = os.id
            LEFT JOIN onboarding_documents od ON od.id = osd.document_id
            WHERE os.organization_id = $1
            ${aclClause}
            GROUP BY os.id
            ORDER BY os.order_index
        `, params);

        return result.rows;
    };

    const createStep = async (data, options = {}) => {
        const executor = getExecutor(options);
        const {
            title,
            description,
            step_type,
            organization_id,
            is_mandatory = true,
            order_index,
            days_from_start = 0,
            duration_days = 1,
            auto_assign = false,
            instructions,
            metadata = {},
            content_url,
            acknowledgment_text
        } = data;

        const result = await executor.query(
            `INSERT INTO onboarding_steps
             (id, title, description, step_type, content_url, acknowledgment_text, organization_id,
              is_mandatory, order_index, days_from_start, duration_days, auto_assign, instructions, metadata)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                title,
                description,
                step_type,
                content_url,
                acknowledgment_text,
                organization_id,
                is_mandatory,
                order_index,
                days_from_start,
                duration_days,
                auto_assign,
                instructions,
                JSON.stringify(metadata)
            ]
        );

        return result.rows[0] || null;
    };

    const updateStep = async (id, data, options = {}) => {
        const executor = getExecutor(options);
        const {
            title,
            description,
            step_type,
            is_mandatory,
            order_index,
            days_from_start,
            duration_days,
            auto_assign,
            instructions,
            metadata,
            content_url,
            acknowledgment_text
        } = data;

        const params = [
            title,
            description,
            step_type,
            content_url,
            acknowledgment_text,
            is_mandatory,
            order_index,
            days_from_start,
            duration_days,
            auto_assign,
            instructions,
            JSON.stringify(metadata),
            id
        ];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addOrganizationAcl({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const result = await executor.query(
            `UPDATE onboarding_steps SET
             title = $1, description = $2, step_type = $3, content_url = $4, acknowledgment_text = $5,
             is_mandatory = $6, order_index = $7, days_from_start = $8, duration_days = $9,
             auto_assign = $10, instructions = $11, metadata = $12
             WHERE id = $13
             ${aclClause}
             RETURNING *`,
            params
        );

        return result.rows[0] || null;
    };

    const deleteStep = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${addOrganizationAcl({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || ACCESS_LEVELS.WRITE
            })}`;
        }

        const result = await executor.query(
            `DELETE FROM onboarding_steps os
             WHERE os.id = $1
             ${aclClause}
             RETURNING *`,
            params
        );
        return result.rows[0] || null;
    };

    return {
        getAllSteps,
        createStep,
        updateStep,
        deleteStep
    };
};
