const createChatService = require('../../src/domain/chat/service');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    chatRepository: {},
    chatAccessPolicy: {},
    notificationUrlPort: {
        generateNotificationUrlForUser: jest.fn()
    },
    sideEffectOutboxService: {
        enqueueUserNotification: jest.fn()
    },
    logger: createMockLogger()
});

describe('chat.service API contract', () => {
    it('exposes expected chat service API surface', () => {
        const service = createChatService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'deleteConversation',
            'deleteMessage',
            'getAttachmentForDownload',
            'getAvailableUsers',
            'getHRUsersForChat',
            'listMessages',
            'listThreads',
            'markAsRead',
            'sendMessageWithAttachments',
            'validateMessageParticipants'
        ]);
    });
});
