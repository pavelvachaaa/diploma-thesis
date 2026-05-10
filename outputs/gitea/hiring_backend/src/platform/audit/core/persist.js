module.exports = ({ db, logger }) => {
    const state = {
        auditDbFallbackEnabled: true,
        missingTableLogged: false
    };

    const persistAuditEventToDb = async (payload) => {
        if (!state.auditDbFallbackEnabled) {
            return;
        }

        try {
            await db.query(
                `INSERT INTO audit_events (
                    request_id, source, category, action, status,
                    actor_user_id, actor_email, actor_roles, organization_id,
                    method, path, resource_type, resource_id, target, status_code,
                    ip, user_agent, metadata, before_state, after_state, error_message
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9,
                    $10, $11, $12, $13, $14, $15,
                    $16, $17, $18::jsonb, $19::jsonb, $20::jsonb, $21
                )`,
                [
                    payload.request_id,
                    payload.source,
                    payload.category,
                    payload.action,
                    payload.status,
                    payload.actor_user_id,
                    payload.actor_email,
                    payload.actor_roles,
                    payload.organization_id,
                    payload.method,
                    payload.path,
                    payload.resource_type,
                    payload.resource_id,
                    payload.target,
                    payload.status_code,
                    payload.ip,
                    payload.user_agent,
                    JSON.stringify(payload.metadata || {}),
                    payload.before_state ? JSON.stringify(payload.before_state) : null,
                    payload.after_state ? JSON.stringify(payload.after_state) : null,
                    payload.error_message
                ]
            );
        } catch (error) {
            if (error.code === '42P01') {
                state.auditDbFallbackEnabled = false;
                if (!state.missingTableLogged) {
                    state.missingTableLogged = true;
                    logger.warn('audit_events table not found. Disabling DB fallback audit persistence until restart.');
                }
                return;
            }

            logger.warn('Failed to persist audit event to DB fallback', {
                error: error.message,
                category: payload.category,
                action: payload.action
            });
        }
    };

    return {
        persistAuditEventToDb
    };
};
