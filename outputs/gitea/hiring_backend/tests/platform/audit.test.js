const createAudit = require('../../src/platform/audit');

describe('platform/audit', () => {
    const originalEnv = { ...process.env };

    const loadAudit = ({
        publishResult = true,
        publishError = null,
        dbQueryImplementation = null,
        env = {}
    } = {}) => {
        process.env = {
            ...originalEnv,
            NODE_ENV: 'test',
            AUDIT_ENABLE_IN_TESTS: 'true',
            AUDIT_ENABLED: 'true',
            AUDIT_TRANSPORT: 'rabbitmq',
            AUDIT_FAILURE_POLICY: 'best_effort_non_blocking',
            AUDIT_FALLBACK_TO_DB: 'false',
            ...env
        };

        const db = {
            query: jest.fn()
        };

        if (dbQueryImplementation) {
            db.query.mockImplementation(dbQueryImplementation);
        } else {
            db.query.mockResolvedValue({ rows: [] });
        }

        const rabbitmqService = {
            publishAuditEvent: jest.fn()
        };

        if (publishError) {
            rabbitmqService.publishAuditEvent.mockRejectedValue(publishError);
        } else {
            rabbitmqService.publishAuditEvent.mockResolvedValue(publishResult);
        }

        const logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn()
        };

        const audit = createAudit({ db, logger, rabbitmqService });
        return { audit, db, rabbitmqService, logger };
    };

    afterEach(() => {
        process.env = { ...originalEnv };
        jest.clearAllMocks();
    });

    it('does not fallback to DB when Rabbit publish succeeds', async () => {
        const { audit, db, rabbitmqService } = loadAudit({
            publishResult: true,
            env: { AUDIT_FALLBACK_TO_DB: 'true' }
        });

        await expect(audit.writeAuditEvent({ action: 'test.action' })).resolves.toBeUndefined();

        expect(rabbitmqService.publishAuditEvent).toHaveBeenCalledTimes(1);
        expect(db.query).not.toHaveBeenCalled();
    });

    it('attempts DB fallback when Rabbit publish fails and fallback is enabled', async () => {
        const { audit, db, rabbitmqService } = loadAudit({
            publishResult: false,
            env: { AUDIT_FALLBACK_TO_DB: 'true' }
        });

        await expect(audit.writeAuditEvent({ action: 'test.action' })).resolves.toBeUndefined();

        expect(rabbitmqService.publishAuditEvent).toHaveBeenCalledTimes(1);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('drops event with structured warning when Rabbit publish fails and fallback is disabled', async () => {
        const { audit, db, logger } = loadAudit({
            publishResult: false,
            env: { AUDIT_FALLBACK_TO_DB: 'false' }
        });

        await expect(audit.writeAuditEvent({ action: 'test.action' })).resolves.toBeUndefined();

        expect(db.query).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
            'Audit event dropped after publish failure (fallback disabled)',
            expect.objectContaining({
                action: 'test.action',
                fallback_enabled: false,
                failure_policy: 'best_effort_non_blocking'
            })
        );
    });

    it('disables DB fallback when audit_events table is missing and does not throw', async () => {
        const missingTableError = new Error('relation "audit_events" does not exist');
        missingTableError.code = '42P01';

        const { audit, db, rabbitmqService } = loadAudit({
            publishResult: false,
            env: { AUDIT_FALLBACK_TO_DB: 'true' },
            dbQueryImplementation: jest.fn().mockRejectedValue(missingTableError)
        });

        await expect(audit.writeAuditEvent({ action: 'test.action.one' })).resolves.toBeUndefined();
        await expect(audit.writeAuditEvent({ action: 'test.action.two' })).resolves.toBeUndefined();

        expect(rabbitmqService.publishAuditEvent).toHaveBeenCalledTimes(2);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});
