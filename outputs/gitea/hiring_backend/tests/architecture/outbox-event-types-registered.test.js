const { EVENT_TYPES } = require('../../src/platform/outbox/constants');
const createHandlers = require('../../src/platform/outbox/handlers');

const createHandlersInstance = () => createHandlers({
    mailer: {
        sendWelcomeEmail: jest.fn(),
        sendEmail: jest.fn()
    },
    notificationService: {
        notifyRoleInOrg: jest.fn(),
        notifyUser: jest.fn()
    },
    rabbitmqService: {
        publishCVEventConfirmed: jest.fn(),
        publishJobSeekerCVEventConfirmed: jest.fn(),
        publishJobEmbeddingRequestConfirmed: jest.fn()
    },
    storageService: {
        delete: jest.fn()
    },
    fileGateway: {
        getById: jest.fn(),
        markDeleted: jest.fn(),
        markDeleteFailed: jest.fn()
    },
    rebacService: {
        syncUserRolePermissions: jest.fn(),
        syncMembershipPermissions: jest.fn(),
        deleteMembershipPermissions: jest.fn(),
        syncJobPostingPermissions: jest.fn(),
        syncOrganizationPermissions: jest.fn()
    },
    transformer: {
        decryptSecret: jest.fn(),
        materializeAttachmentsFromPayload: jest.fn(),
        materializeIcalEventFromPayload: jest.fn()
    },
    eventTypes: EVENT_TYPES
});

describe('outbox event type governance', () => {
    it('registers all canonical produced event types in outbox handlers', () => {
        const handlers = createHandlersInstance();
        const supported = handlers.getSupportedEventTypes();

        for (const eventType of Object.values(EVENT_TYPES)) {
            expect(supported.has(eventType)).toBe(true);
            expect(handlers.isEventTypeSupported(eventType)).toBe(true);
            expect(
                handlers.strategies.filter((strategy) => strategy.supports(handlers.normalizeEventType(eventType)))
            ).toHaveLength(1);
            expect(handlers.resolveStrategy(eventType).key).toEqual(expect.any(String));
        }
    });
});
