const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify
}));

jest.mock('nodemailer', () => ({
    createTransport: (...args) => mockCreateTransport(...args)
}));

const createMailer = require('../../src/platform/email');

describe('platform/email', () => {
    let originalEnv;
    let mailer;
    let mockWriteAuditEvent;
    let mockLogger;

    beforeEach(() => {
        originalEnv = { ...process.env };
        process.env.EMAIL_HOST = 'smtp.example.com';
        process.env.EMAIL_PORT = '587';
        process.env.EMAIL_USER = 'sender@example.com';
        process.env.EMAIL_PASSWORD = 'secret';
        process.env.EMAIL_FROM = 'sender@example.com';

        mockWriteAuditEvent = jest.fn().mockResolvedValue();
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn()
        };

        mailer = createMailer({
            logger: mockLogger,
            audit: {
                writeAuditEvent: (...args) => mockWriteAuditEvent(...args)
            }
        });

        mockVerify.mockResolvedValue(true);
        mockSendMail.mockResolvedValue({
            messageId: 'msg-1',
            accepted: ['user@example.com'],
            rejected: []
        });

        mockCreateTransport.mockClear();
        mockSendMail.mockClear();
        mockVerify.mockClear();
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    it('fails when SMTP accepts no recipients', async () => {
        mockSendMail.mockResolvedValue({
            messageId: 'msg-1',
            accepted: [],
            rejected: []
        });

        await expect(mailer.sendEmail({
            to: 'user@example.com',
            subject: 'Subject',
            text: 'Body'
        })).rejects.toMatchObject({
            code: 'EMAIL_SMTP_NO_ACCEPTED_RECIPIENTS',
            isPermanent: true
        });

        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            category: 'email',
            status: 'failure'
        }));
    });

    it('fails when SMTP rejects at least one recipient', async () => {
        mockSendMail.mockResolvedValue({
            messageId: 'msg-1',
            accepted: ['ok@example.com'],
            rejected: ['invalid@example.com']
        });

        await expect(mailer.sendEmail({
            to: 'ok@example.com, invalid@example.com',
            subject: 'Subject',
            text: 'Body'
        })).rejects.toMatchObject({
            code: 'EMAIL_SMTP_RECIPIENTS_REJECTED',
            isPermanent: true
        });
    });

    it('marks EENVELOPE transport errors as permanent', async () => {
        const envelopeError = new Error('all recipients were rejected');
        envelopeError.code = 'EENVELOPE';
        mockSendMail.mockRejectedValue(envelopeError);

        await expect(mailer.sendEmail({
            to: 'user@example.com',
            subject: 'Subject',
            text: 'Body'
        })).rejects.toMatchObject({
            code: 'EENVELOPE',
            isPermanent: true
        });
    });

    it('marks 4xx SMTP transport errors as transient', async () => {
        const temporaryError = new Error('mailbox busy');
        temporaryError.responseCode = 451;
        mockSendMail.mockRejectedValue(temporaryError);

        await expect(mailer.sendEmail({
            to: 'user@example.com',
            subject: 'Subject',
            text: 'Body'
        })).rejects.toMatchObject({
            responseCode: 451,
            isPermanent: false
        });
    });

    it('writes failure audit when mailer initialization times out', async () => {
        const timeoutError = new Error('connect ETIMEDOUT mail.example.com:587');
        timeoutError.code = 'ETIMEDOUT';
        mockVerify.mockRejectedValue(timeoutError);

        await expect(mailer.sendEmail({
            to: 'user@example.com',
            subject: 'Subject',
            text: 'Body'
        })).rejects.toMatchObject({
            code: 'ETIMEDOUT',
            isPermanent: false
        });

        expect(mockSendMail).not.toHaveBeenCalled();
        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            category: 'email',
            action: 'email.send',
            status: 'failure',
            errorMessage: 'connect ETIMEDOUT mail.example.com:587'
        }));
    });
});
