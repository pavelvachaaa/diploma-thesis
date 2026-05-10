const {
    getAuditTransport,
    shouldFallbackToDb,
    getAuditFailurePolicy
} = require('./core/config');
const buildPayload = require('./core/payload');
const createPersistor = require('./core/persist');

module.exports = ({ db, logger, rabbitmqService }) => {
    let policyLogged = false;

    const { persistAuditEventToDb } = createPersistor({
        db,
        logger
    });

    const logPolicyOnce = () => {
        if (policyLogged) return;
        policyLogged = true;

        logger.info('Audit trail policy initialized', {
            audit_enabled: (process.env.AUDIT_ENABLED || 'true') === 'true',
            audit_transport: getAuditTransport(),
            audit_failure_policy: getAuditFailurePolicy(logger),
            audit_fallback_to_db: shouldFallbackToDb()
        });
    };

    const writeAuditEvent = async (event = {}) => {
        if ((process.env.AUDIT_ENABLED || 'true') === 'false') {
            return;
        }

        if (process.env.NODE_ENV === 'test' && (process.env.AUDIT_ENABLE_IN_TESTS || 'false') !== 'true') {
            return;
        }

        logPolicyOnce();

        const payload = buildPayload({ event });
        const transport = getAuditTransport();
        const failurePolicy = getAuditFailurePolicy(logger);
        const fallbackEnabled = shouldFallbackToDb();

        try {
            if (transport === 'db') {
                await persistAuditEventToDb(payload);
                return;
            }

            const published = await rabbitmqService.publishAuditEvent(payload);

            if (!published && fallbackEnabled) {
                await persistAuditEventToDb(payload);
                return;
            }

            if (!published) {
                logger.warn('Audit event dropped after publish failure (fallback disabled)', {
                    category: payload.category,
                    action: payload.action,
                    transport,
                    failure_policy: failurePolicy,
                    fallback_enabled: fallbackEnabled
                });
            }
        } catch (error) {
            logger.warn('Failed to emit audit event', {
                error: error.message,
                category: payload.category,
                action: payload.action,
                transport
            });

            if (fallbackEnabled) {
                await persistAuditEventToDb(payload);
                return;
            }

            logger.warn('Audit event dropped due to transport failure (fallback disabled)', {
                category: payload.category,
                action: payload.action,
                transport,
                failure_policy: failurePolicy,
                fallback_enabled: fallbackEnabled
            });
        }
    };

    return {
        writeAuditEvent
    };
};
