const { createMockLogger, createMockDb } = require('../helpers');
const createApplicantAttachments = require('../../src/domain/documents/service/applicantAttachments');

describe('documents applicantAttachments slice', () => {
    it('stores applicant attachment and delegates CV publish orchestration through cvIntentPort', async () => {
        const db = createMockDb();
        const slice = createApplicantAttachments({
            db,
            documentsRepository: {
                getApplicantOrganizationId: jest.fn().mockResolvedValue('org-1'),
                insertApplicantAttachment: jest.fn().mockResolvedValue({
                    id: 'att-1',
                    applicant_id: 'applicant-1',
                    file_id: 'file-1'
                }),
                getApplicantJobInfo: jest.fn().mockResolvedValue({
                    job_posting_id: 'job-1'
                })
            },
            documentsEvents: {
                enqueueApplicantDocumentUploaded: jest.fn().mockResolvedValue({})
            },
            logger: createMockLogger(),
            sideEffectOutboxService: {
                enqueueFileGcDelete: jest.fn().mockResolvedValue({})
            },
            fileGateway: {
                createFileRecord: jest.fn().mockResolvedValue({ id: 'file-1' })
            },
            detectBucketFromKey: jest.fn(() => 'attachments'),
            cvIntentPort: {
                queueApplicantAttachmentPublishIntent: jest.fn().mockResolvedValue({})
            }
        });

        const result = await slice.storeApplicantAttachment('applicant-1', {
            bucket: 'attachments',
            key: 'applicant-attachments/cv.pdf',
            mimetype: 'application/pdf',
            size: 1024,
            originalName: 'cv.pdf'
        });

        expect(result).toEqual(expect.objectContaining({ id: 'att-1' }));
    });
});
