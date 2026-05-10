module.exports = ({
    db,
    getExecutor,
    DOCUMENT_SELECT_FIELDS,
    buildDocumentFilters,
    buildDocumentAccessCondition
}) => {
    const getAll = async (options = {}) => {
        const {
            page = 0,
            limit = 50,
            search,
            organizationId,
            typeId,
            required,
            actorUserId = null,
            minAccess
        } = options;
        const offset = page * limit;

        let query = `
            SELECT ${DOCUMENT_SELECT_FIELDS}, dt.name as type_name,
                   CASE
                       WHEN od.applies_to_all_organizations = true THEN 'Všechny organizace'
                       ELSE o.name
                   END as organization_name,
                   od.applies_to_all_organizations
            FROM onboarding_documents od
            LEFT JOIN files tf ON tf.id = od.template_file_id
            LEFT JOIN document_types dt ON dt.id = od.type_id
            LEFT JOIN organizations o ON o.id = od.organization_id
        `;
        let countQuery = `
            SELECT COUNT(*) as total
            FROM onboarding_documents od
            LEFT JOIN document_types dt ON dt.id = od.type_id
            LEFT JOIN organizations o ON o.id = od.organization_id
        `;

        const { queryParams, whereClause } = buildDocumentFilters({
            search,
            organizationId,
            typeId,
            required,
            actorUserId,
            minAccess
        });

        query += whereClause;
        countQuery += whereClause;

        query += ` ORDER BY o.name, od.name LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        const [dataResult, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(countQuery, queryParams.slice(0, -2))
        ]);

        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].total),
                totalPages: Math.ceil(countResult.rows[0].total / limit)
            }
        };
    };

    const getById = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${buildDocumentAccessCondition({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess
            })}`;
        }

        const { rows } = await executor.query(`
            SELECT ${DOCUMENT_SELECT_FIELDS}, dt.name as type_name,
                   CASE
                       WHEN od.applies_to_all_organizations = true THEN 'Všechny organizace'
                       ELSE o.name
                   END as organization_name,
                   od.applies_to_all_organizations
            FROM onboarding_documents od
            LEFT JOIN files tf ON tf.id = od.template_file_id
            LEFT JOIN document_types dt ON dt.id = od.type_id
            LEFT JOIN organizations o ON o.id = od.organization_id
            WHERE od.id = $1
            ${aclClause}
        `, params);
        return rows[0] || null;
    };

    const getByOrganization = async (organizationId, options = {}) => {
        const executor = getExecutor(options);
        const params = [organizationId];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${buildDocumentAccessCondition({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess
            })}`;
        }

        const { rows } = await executor.query(`
            SELECT ${DOCUMENT_SELECT_FIELDS}, dt.name as type_name, o.name as organization_name
            FROM onboarding_documents od
            LEFT JOIN files tf ON tf.id = od.template_file_id
            LEFT JOIN document_types dt ON dt.id = od.type_id
            JOIN organizations o ON o.id = od.organization_id
            WHERE od.organization_id = $1
            ${aclClause}
            ORDER BY od.name
        `, params);
        return rows;
    };

    const create = async (data, options = {}) => {
        const executor = getExecutor(options);
        const {
            name,
            description,
            type_id,
            organization_id,
            required,
            template_file_id = null,
            uploaded_at,
            is_template = true,
            status = 'active',
            applies_to_all_organizations = false
        } = data;

        const appliesToAll = applies_to_all_organizations === true || applies_to_all_organizations === 'true';

        const { rows } = await executor.query(
            `INSERT INTO onboarding_documents
             (id, name, description, type_id, organization_id, required, template_file_id, uploaded_at, is_template, status, applies_to_all_organizations)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [name, description, type_id || null, appliesToAll ? null : organization_id, required, template_file_id, uploaded_at, is_template, status, appliesToAll]
        );
        return getById(rows[0].id, {
            ...options,
            minAccess: options.minAccess || 'read'
        });
    };

    const update = async (id, data, options = {}) => {
        const executor = getExecutor(options);
        const {
            name,
            description,
            type_id,
            organization_id,
            required,
            applies_to_all_organizations = false,
            template_file_id
        } = data;
        const appliesToAll = applies_to_all_organizations === true || applies_to_all_organizations === 'true';
        const fields = [];
        const values = [];

        const setField = (column, value) => {
            fields.push(`${column} = $${values.length + 1}`);
            values.push(value);
        };

        if (name !== undefined) setField('name', name);
        if (description !== undefined) setField('description', description);
        if (type_id !== undefined) setField('type_id', type_id || null);
        if (organization_id !== undefined || applies_to_all_organizations !== undefined) {
            setField('organization_id', appliesToAll ? null : organization_id);
        }
        if (required !== undefined) setField('required', required);
        if (applies_to_all_organizations !== undefined) setField('applies_to_all_organizations', appliesToAll);
        if (template_file_id !== undefined) setField('template_file_id', template_file_id);

        if (fields.length === 0) {
            return getById(id, options);
        }

        let aclClause = '';
        if (options.actorUserId) {
            aclClause = ` AND ${buildDocumentAccessCondition({
                params: values,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || 'write'
            })}`;
        }

        values.push(id);
        const { rows } = await executor.query(
            `UPDATE onboarding_documents
             SET ${fields.join(', ')}
             WHERE id = $${values.length}
             ${aclClause}
             RETURNING id`,
            values
        );

        if (rows.length === 0) {
            return null;
        }

        return getById(id, {
            ...options,
            minAccess: options.minAccess || 'read'
        });
    };

    const deleteOne = async (id, options = {}) => {
        const executor = getExecutor(options);
        const params = [id];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = ` AND ${buildDocumentAccessCondition({
                params,
                actorUserId: options.actorUserId,
                minAccess: options.minAccess || 'write'
            })}`;
        }

        const { rows } = await executor.query(
            `DELETE FROM onboarding_documents od
             WHERE od.id = $1
             ${aclClause}
             RETURNING *`,
            params
        );
        return rows[0] || null;
    };

    return {
        getAll,
        getById,
        getByOrganization,
        create,
        update,
        deleteOne
    };
};
