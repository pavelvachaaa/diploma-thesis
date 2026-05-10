const createEmailApplication = require('../../src/core/email/application');
const createEmailOutboxAdapter = require('../../src/adapters/out/integration/email/outbox');
const { createMockLogger } = require('../helpers');

const buildSideEffectOutboxService = (enabled = true) => ({
    isEnabled: jest.fn().mockReturnValue(enabled),
    isWorkerEnabled: jest.fn().mockReturnValue(enabled),
    EVENT_TYPES: { RAW_EMAIL: 'email.raw.v1', WELCOME_EMAIL: 'email.welcome.v1' },
    enqueue: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    normalizeAttachmentsForPayload: jest.fn((a) => a),
    normalizeIcalEventForPayload: jest.fn((e) => e),
    buildWelcomePayload: jest.fn(() => ({ encryptedPassword: {} }))
});

const buildMocks = (outboxEnabled = true) => {
    const sideEffectOutboxService = buildSideEffectOutboxService(outboxEnabled);
    return {
        emailOutboxPort: createEmailOutboxAdapter({ sideEffectOutboxService }),
        emailPreferencesLookupPort: {
            getPreferences: jest.fn().mockResolvedValue({ emailEnabled: true }),
            getTypePreferences: jest.fn().mockResolvedValue({ emailEnabled: null })
        },
        emailTemplatesStorePort: {
            getAll: jest.fn().mockResolvedValue([]),
            getById: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue(null),
            remove: jest.fn().mockResolvedValue(null)
        },
        logger: createMockLogger(),
        sideEffectOutboxService
    };
};

describe('email application', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('queues custom employee email when outbox is enabled', async () => {
        const mocks = buildMocks(true);
        const application = createEmailApplication(mocks);

        const result = await application.sendCustomEmail({
            to: 'employee@example.com',
            subject: 'Subject',
            message: 'Body',
            employeeName: 'Eva Nová',
            senderName: 'Admin User'
        });

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(1);
        expect(result.success).toBe(true);
        expect(result.queued).toBe(true);
        expect(result.sent).toBe(false);
        expect(result.outboxId).toBe('outbox-1');
    });

    it('throws when outbox is disabled', async () => {
        const mocks = buildMocks(false);
        const application = createEmailApplication(mocks);

        await expect(
            application.sendCustomEmail({
                to: 'employee@example.com',
                subject: 'Subject',
                message: 'Body',
                employeeName: 'Eva Nová',
                senderName: 'Admin User'
            })
        ).rejects.toThrow('Side effect outbox must be enabled for business email delivery');

        expect(mocks.sideEffectOutboxService.enqueue).not.toHaveBeenCalled();
    });
});
