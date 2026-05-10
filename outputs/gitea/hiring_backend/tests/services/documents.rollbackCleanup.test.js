jest.mock('@shared/file/gcOutbox', () => ({
    enqueueFileGcDelete: jest.fn().mockResolvedValue({})
}));

const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');
const { createMockLogger } = require('../helpers');
const createRollbackCleanup = require('../../src/domain/documents/service/rollbackCleanup');

describe('documents rollbackCleanup leaf', () => {
    it('queues file GC cleanup for rolled back applicant uploads', async () => {
        const leaf = createRollbackCleanup({
            sideEffectOutboxService: {},
            detectBucketFromKey: jest.fn(() => 'attachments'),
            logger: createMockLogger()
        });

        await leaf.queueRollbackCleanup({
            applicantId: 'applicant-1',
            fileData: {
                key: 'applicant-attachments/cv.pdf'
            },
            organizationId: 'org-1'
        });

        expect(enqueueFileGcDelete).toHaveBeenCalledWith(expect.objectContaining({
            objectKey: 'applicant-attachments/cv.pdf',
            organizationId: 'org-1'
        }));
    });
});
