const { addExistsClause, addClause } = require('@shared/authz/rebacSql');

module.exports = ({
    getExecutor,
    ACCESS_LEVELS,
    buildNotePermissionExists
}) => {
    const createNote = async (noteData, options = {}) => {
        const { applicant_id, author_id, note } = noteData;
        const executor = getExecutor(options);

        const params = [applicant_id, author_id, note];
        let aclClause = '';

        if (options.actorUserId) {
            aclClause = addExistsClause(
                `    SELECT 1
                    FROM applicants a
                    WHERE a.id = $1${addClause('AND', buildNotePermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`,
                'WHERE'
            );
        }

        const sql = `
            INSERT INTO applicant_notes (id, applicant_id, author_id, note, created_at, updated_at)
            SELECT gen_random_uuid(), $1, $2, $3, NOW(), NOW()
            ${aclClause}
            RETURNING *
        `;

        const { rows } = await executor.query(sql, params);
        if (!rows[0]) {
            return null;
        }

        return rows[0];
    };

    const updateNote = async (noteId, noteText, options = {}) => {
        const executor = getExecutor(options);
        const params = [noteText, noteId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM applicants a
                    WHERE a.id = an.applicant_id${addClause('AND', buildNotePermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const sql = `
            UPDATE applicant_notes an
            SET note = $1, updated_at = NOW()
            WHERE an.id = $2${aclExists}
            RETURNING *
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0];
    };

    const deleteNote = async (noteId, options = {}) => {
        const executor = getExecutor(options);
        const params = [noteId];
        let aclExists = '';

        if (options.actorUserId) {
            aclExists = addExistsClause(
                `    SELECT 1
                    FROM applicants a
                    WHERE a.id = an.applicant_id${addClause('AND', buildNotePermissionExists({
                        params,
                        actorUserId: options.actorUserId,
                        minAccess: options.minAccess || ACCESS_LEVELS.WRITE
                    }))}`
            );
        }

        const sql = `
            DELETE FROM applicant_notes an
            WHERE an.id = $1${aclExists}
            RETURNING *
        `;

        const { rows } = await executor.query(sql, params);
        return rows[0];
    };

    return {
        createNote,
        updateNote,
        deleteNote
    };
};
