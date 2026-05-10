const createCvAnalysisService = require('../../src/core/cvAnalysis/application');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');
const { createMockLogger } = require('../helpers');

const createDependencies = () => {
    const txClient = { query: jest.fn(), release: jest.fn() };

    return {
        cvAnalysisStorePort: {
            getApplicantAttachmentInfo: jest.fn()
        },
        cvAnalysisUnitOfWorkPort: {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        },
        cvIntentPort: {
            queueApplicantReanalysisPublishIntent: jest.fn()
        },
        logger: createMockLogger(),
        txClient
    };
};

describe('cvAnalysis.service', () => {
    it('queues applicant reanalysis publish intent in a transaction', async () => {
        const deps = createDependencies();
        const attachmentInfo = {
            attachment_id: 'att-1',
            file_path: 'applicant-attachments/cv.pdf',
            job_posting_id: 'job-1',
            organization_id: 'org-1'
        };
        deps.cvAnalysisStorePort.getApplicantAttachmentInfo.mockResolvedValue(attachmentInfo);

        const service = createCvAnalysisService(deps);
        const result = await service.triggerReanalysis('app-1');

        expect(result).toEqual({
            message: 'CV reanalysis has been queued',
            status: 'pending'
        });
        expect(deps.cvAnalysisUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            label: 'cvAnalysis.triggerReanalysis',
            requestId: expect.any(String)
        }));
        expect(deps.cvIntentPort.queueApplicantReanalysisPublishIntent).toHaveBeenCalledWith(
            expect.objectContaining({
                attachmentInfo,
                applicantId: 'app-1',
                requestId: expect.any(String)
            }),
            { client: deps.txClient }
        );
    });

    it('throws NOT_FOUND when applicant has no attachment', async () => {
        const deps = createDependencies();
        deps.cvAnalysisStorePort.getApplicantAttachmentInfo.mockResolvedValue(null);

        const service = createCvAnalysisService(deps);

        await expect(service.triggerReanalysis('app-1')).rejects.toMatchObject({
            code: ErrorCode.NOT_FOUND,
            message: 'No CV attachment found for this applicant'
        });
        expect(deps.cvIntentPort.queueApplicantReanalysisPublishIntent).not.toHaveBeenCalled();
        expect(deps.cvAnalysisUnitOfWorkPort.runInTransaction).not.toHaveBeenCalled();
    });

    it('propagates transaction failures when enqueue fails', async () => {
        const deps = createDependencies();
        deps.cvAnalysisStorePort.getApplicantAttachmentInfo.mockResolvedValue({
            attachment_id: 'att-1',
            file_path: 'applicant-attachments/cv.pdf'
        });
        deps.cvIntentPort.queueApplicantReanalysisPublishIntent.mockRejectedValue(new Error('enqueue failed'));

        const service = createCvAnalysisService(deps);

        await expect(service.triggerReanalysis('app-1')).rejects.toThrow('enqueue failed');
        expect(deps.cvAnalysisUnitOfWorkPort.runInTransaction).toHaveBeenCalledTimes(1);
    });

    it('passes explicit requestId into reanalysis publish enqueue', async () => {
        const deps = createDependencies();
        const attachmentInfo = {
            attachment_id: 'att-1',
            file_path: 'applicant-attachments/cv.pdf'
        };
        deps.cvAnalysisStorePort.getApplicantAttachmentInfo.mockResolvedValue(attachmentInfo);

        const service = createCvAnalysisService(deps);
        const result = await service.triggerReanalysis('app-1', { requestId: 'req-1' });

        expect(result).toEqual({
            message: 'CV reanalysis has been queued',
            status: 'pending'
        });
        expect(deps.cvAnalysisUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            requestId: 'req-1'
        }));
        expect(deps.cvIntentPort.queueApplicantReanalysisPublishIntent).toHaveBeenCalledWith(
            expect.objectContaining({
                attachmentInfo,
                applicantId: 'app-1',
                requestId: 'req-1'
            }),
            { client: deps.txClient }
        );
    });
});
