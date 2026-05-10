const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/cv/cvIntent.proxy');

describe('CvIntentPort runtime proxy', () => {
    it('delegates CV publish intent operations through cvService', async () => {
        const cvService = {
            queueApplicantAttachmentPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
            queueApplicantReanalysisPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-2' }),
            queueJobSeekerCvPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-3' }),
            queueJobEmbeddingRequestIntent: jest.fn().mockResolvedValue({ id: 'outbox-4' })
        };
        const port = createProxy({ cvService });
        const options = { client: { query: jest.fn() } };

        await port.queueApplicantAttachmentPublishIntent({ attachment: { id: 'att-1' } }, options);
        await port.queueApplicantReanalysisPublishIntent({ attachmentInfo: { attachment_id: 'att-1' } });
        await port.queueJobSeekerCvPublishIntent({ jobSeeker: { id: 'js-1' } });
        await port.queueJobEmbeddingRequestIntent({ job: { id: 'job-1' } });

        expect(cvService.queueApplicantAttachmentPublishIntent).toHaveBeenCalledWith(
            { attachment: { id: 'att-1' } },
            { client: expect.any(Object) }
        );
        expect(cvService.queueApplicantReanalysisPublishIntent).toHaveBeenCalledWith(
            { attachmentInfo: { attachment_id: 'att-1' } },
            {}
        );
        expect(cvService.queueJobSeekerCvPublishIntent).toHaveBeenCalledWith({ jobSeeker: { id: 'js-1' } }, {});
        expect(cvService.queueJobEmbeddingRequestIntent).toHaveBeenCalledWith({ job: { id: 'job-1' } }, {});
    });
});
