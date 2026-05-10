module.exports = ({
    db,
    ACCESS_LEVELS,
    buildApplicantPermissionJoin
}) => {
    const getAllApplicants = async ({ actorUserId, page = 1, limit = 10, search = '', status = '', organizationName = '' }) => {
        const offset = (page - 1) * limit;

        const queryParams = [];
        const whereConditions = [];
        let paramCounter = 1;

        const permissionJoin = buildApplicantPermissionJoin({
            params: queryParams,
            actorUserId,
            minAccess: ACCESS_LEVELS.READ
        });
        paramCounter = queryParams.length + 1;

        if (search) {
            whereConditions.push(`(
                LOWER(a.name || ' ' || a.surname) LIKE LOWER($${paramCounter}) OR
                LOWER(a.email) LIKE LOWER($${paramCounter}) OR
                LOWER(jp.title) LIKE LOWER($${paramCounter})
            )`);
            queryParams.push(`%${search}%`);
            paramCounter++;
        }

        if (status) {
            if (status.includes(',')) {
                const statuses = status.split(',').map((value) => value.trim());
                const statusPlaceholders = statuses.map((_, index) => `$${paramCounter + index}`).join(',');
                whereConditions.push(`a.current_status IN (${statusPlaceholders})`);
                queryParams.push(...statuses);
                paramCounter += statuses.length;
            } else {
                whereConditions.push(`a.current_status = $${paramCounter}`);
                queryParams.push(status);
                paramCounter++;
            }
        }

        if (organizationName) {
            whereConditions.push(`LOWER(o.name) LIKE LOWER($${paramCounter})`);
            queryParams.push(`%${organizationName}%`);
            paramCounter++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countSql = `
            SELECT COUNT(*) as total
            FROM applicants a
            JOIN job_postings_with_status jp ON a.job_posting_id = jp.id
            ${permissionJoin}
            JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN application_statuses aps ON a.current_status = aps.name
            ${whereClause}
        `;

        const countResult = await db.query(countSql, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);

        const dataSql = `
            SELECT
                a.*,
                jp.title as job_title,
                o.name as organization_name,
                aps.name as current_status_name,
                aps.description as current_status_description
            FROM applicants a
            JOIN job_postings_with_status jp ON a.job_posting_id = jp.id
            ${permissionJoin}
            JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN application_statuses aps ON a.current_status = aps.name
            ${whereClause}
            ORDER BY a.applied_at DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        queryParams.push(limit, offset);

        const { rows } = await db.query(dataSql, queryParams);

        return {
            data: rows,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    };

    return {
        getAllApplicants
    };
};
