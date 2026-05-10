const { createMockLogger } = require('../helpers');
const createCvPublish = require('../../src/domain/documents/service/cvPublish');

describe('documents cvPublish leaf', () => {
    it('queues CV publish intent only for CV-like applicant attachments', async () => {
        const cvIntentPort = {
            queueApplicantAttachmentPublishIntent: jest.fn().mockResolvedValue({})
        };
        const leaf = createCvPublish({
            documentsRepository: {
                getApplicantJobInfo: jest.fn().mockResolvedValue({ job_posting_id: 'job-1' })
            },
            cvIntentPort,
            logger: createMockLogger()
        });

        await leaf.maybeQueueApplicantCvPublish({
            attachment: { id: 'att-1' },
            applicantId: 'applicant-1',
            organizationId: 'org-1',
            fileData: {
                key: 'applicant-attachments/cv.pdf',
                mimetype: 'application/pdf'
            }
        }, {
            client: { query: jest.fn() }
        });

        expect(cvIntentPort.queueApplicantAttachmentPublishIntent).toHaveBeenCalledWith(
            expect.objectContaining({
                applicantId: 'applicant-1',
                organizationId: 'org-1'
            }),
            expect.objectContaining({
                client: expect.any(Object)
            })
        );
    });
});
