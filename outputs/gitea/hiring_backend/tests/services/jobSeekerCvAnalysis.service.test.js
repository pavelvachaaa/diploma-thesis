const createJobSeekerCvAnalysisService = require('../../src/core/jobSeekerCvAnalysis/application');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    jobSeekerCvAnalysisStorePort: {
        getByJobSeekerId: jest.fn(),
        getStatusByJobSeekerId: jest.fn(),
        createOrUpdatePending: jest.fn(),
        searchBySkills: jest.fn(),
        findMatchingByEmbedding: jest.fn(),
        getStats: jest.fn()
    },
    jobSeekerCvAnalysisUnitOfWorkPort: {
        runInTransaction: jest.fn(async (callback) => callback({ query: jest.fn(), release: jest.fn() }))
    },
    cvIntentPort: {
        queueJobSeekerCvPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-1' })
    },
    logger: createMockLogger()
});

describe('jobSeekerCvAnalysis.service', () => {
    it('throws NOT_FOUND when triggerAnalysis has no cv_file_path', async () => {
        const deps = createDependencies();
        const service = createJobSeekerCvAnalysisService(deps);

        await expect(service.triggerAnalysis({ id: 'js-1' })).rejects.toMatchObject({
            code: ErrorCode.NOT_FOUND,
            message: 'No CV file found for this job seeker'
        });
        expect(deps.jobSeekerCvAnalysisUnitOfWorkPort.runInTransaction).not.toHaveBeenCalled();
        expect(deps.cvIntentPort.queueJobSeekerCvPublishIntent).not.toHaveBeenCalled();
    });

    it('queues publish intent in a transaction for triggerAnalysis', async () => {
        const deps = createDependencies();
        const service = createJobSeekerCvAnalysisService(deps);

        const result = await service.triggerAnalysis({
            id: 'js-1',
            cv_file_path: 'job-seekers/js-1/cv.pdf'
        });

        expect(result).toEqual({
            message: 'CV analysis has been queued',
            status: 'pending'
        });
        expect(deps.jobSeekerCvAnalysisUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            label: 'jobSeekerCvAnalysis.enqueueJobSeekerCvPublish',
            requestId: null
        }));
        expect(deps.cvIntentPort.queueJobSeekerCvPublishIntent).toHaveBeenCalledWith({
            jobSeeker: {
                id: 'js-1',
                cv_file_path: 'job-seekers/js-1/cv.pdf'
            },
            requestId: null,
            reanalysis: false
        }, { client: expect.any(Object) });
    });

    it('propagates transaction failures when triggerAnalysis enqueue fails', async () => {
        const deps = createDependencies();
        deps.cvIntentPort.queueJobSeekerCvPublishIntent.mockRejectedValueOnce(new Error('enqueue failed'));
        const service = createJobSeekerCvAnalysisService(deps);

        await expect(service.triggerAnalysis({
            id: 'js-1',
            cv_file_path: 'job-seekers/js-1/cv.pdf'
        })).rejects.toThrow('enqueue failed');

        expect(deps.jobSeekerCvAnalysisUnitOfWorkPort.runInTransaction).toHaveBeenCalledTimes(1);
    });

    it('passes explicit requestId for reanalysis enqueue', async () => {
        const deps = createDependencies();
        const service = createJobSeekerCvAnalysisService(deps);
        const result = await service.triggerReanalysis('js-1', {
            id: 'js-1',
            cv_file_path: 'job-seekers/js-1/cv.pdf'
        }, { requestId: 'req-ctx-1' });

        expect(result).toEqual({
            message: 'CV analysis has been queued',
            status: 'pending'
        });
        expect(deps.jobSeekerCvAnalysisUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
            requestId: 'req-ctx-1'
        }));
        expect(deps.cvIntentPort.queueJobSeekerCvPublishIntent).toHaveBeenCalledWith({
            jobSeeker: {
                id: 'js-1',
                cv_file_path: 'job-seekers/js-1/cv.pdf'
            },
            requestId: 'req-ctx-1',
            reanalysis: true
        }, { client: expect.any(Object) });
    });
});
