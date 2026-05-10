const createEmailApplication = require('../../src/core/email/application');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    emailOutboxPort: {
        enqueueRawEmail: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
        enqueueWelcomeEmail: jest.fn().mockResolvedValue({ id: 'outbox-2' }),
        isEnabled: jest.fn(() => true),
        getHealthStatus: jest.fn(() => ({ status: 'healthy', message: 'ok', timestamp: new Date().toISOString() }))
    },
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
    logger: createMockLogger()
});

describe('email application API contract', () => {
    it('exposes expected email application API surface', () => {
        const application = createEmailApplication(createDependencies());

        const expected = [
            'createEmailTemplate',
            'deleteEmailTemplate',
            'getEmailTemplate',
            'getEmailTemplates',
            'getHealthStatus',
            'sendApplicantEmail',
            'sendApplicationReceivedEmail',
            'sendApplicationStatusEmail',
            'sendApplicationUnderReviewEmail',
            'sendCustomEmail',
            'sendInterviewInvitation',
            'sendNotificationEmail',
            'sendRejectionEmail',
            'sendTestEmail',
            'sendWelcomeEmail',
            'updateEmailTemplate'
        ];

        expect(Object.keys(application).sort()).toEqual(expected);
    });
});
