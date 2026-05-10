describe('platform contracts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('logger exposes structured logger surface', () => {
        const logger = require('@platform/logger');

        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.trace).toBe('function');
        expect(typeof logger.fatal).toBe('function');
        expect(typeof logger.child).toBe('function');
    });

    it('db factory returns query/getClient contract', () => {
        const createDb = require('@platform/db');
        const logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn()
        };

        const db = createDb({ logger });

        expect(typeof db.query).toBe('function');
        expect(typeof db.getClient).toBe('function');
    });

    it('storage factory returns storage adapter contract', () => {
        const createStorage = require('@platform/storage');
        const storage = createStorage({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
                trace: jest.fn(),
                fatal: jest.fn()
            }
        });

        expect(typeof storage.ensureBuckets).toBe('function');
        expect(typeof storage.upload).toBe('function');
        expect(typeof storage.head).toBe('function');
        expect(typeof storage.download).toBe('function');
        expect(typeof storage.delete).toBe('function');
        expect(typeof storage.copy).toBe('function');
        expect(typeof storage.putBucketPolicy).toBe('function');
    });

    it('email factory returns mailer contract', () => {
        const createMailer = require('@platform/email');
        const mailer = createMailer({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
                trace: jest.fn(),
                fatal: jest.fn()
            },
            audit: { writeAuditEvent: jest.fn().mockResolvedValue() }
        });

        expect(typeof mailer.initialize).toBe('function');
        expect(typeof mailer.sendEmail).toBe('function');
        expect(typeof mailer.sendWelcomeEmail).toBe('function');
    });

    it('audit factory returns audit writer contract', () => {
        const createAudit = require('@platform/audit');
        const audit = createAudit({
            db: { query: jest.fn().mockResolvedValue({ rows: [] }) },
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
                trace: jest.fn(),
                fatal: jest.fn()
            },
            rabbitmqService: { publishAuditEvent: jest.fn().mockResolvedValue(true) }
        });

        expect(typeof audit.writeAuditEvent).toBe('function');
    });

    it('rabbitmq factory returns publisher contract', () => {
        const createRabbitmq = require('@platform/rabbitmq');
        const rabbitmq = createRabbitmq({
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
                trace: jest.fn(),
                fatal: jest.fn()
            }
        });

        expect(typeof rabbitmq.connect).toBe('function');
        expect(typeof rabbitmq.publishAuditEvent).toBe('function');
        expect(typeof rabbitmq.publishCVEvent).toBe('function');
        expect(typeof rabbitmq.publishCVEventConfirmed).toBe('function');
    });
});
