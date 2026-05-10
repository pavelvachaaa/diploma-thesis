const createDocumentsService = require('../../src/domain/documents/service');

const createDependencies = () => ({
    db: {
        getClient: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        }),
        query: jest.fn().mockResolvedValue({ rows: [] })
    },
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn()
    },
    sideEffectOutboxService: {
        enqueueRoleNotification: jest.fn().mockResolvedValue([])
    },
    storageService: {
        delete: jest.fn()
    },
    cvIntentPort: {
        isCvMimeType: jest.fn().mockReturnValue(false)
    }
});

describe('documents.service API contract', () => {
    it('exposes the expected documents service API surface', () => {
        const service = createDocumentsService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'detectBucketFromKey',
            'getApplicantAttachmentForDownload',
            'getApplicantAttachments',
            'getChatAttachmentForDownload',
            'getFileStatistics',
            'storeApplicantAttachment',
            'storeChatAttachment'
        ]);
    });
});
