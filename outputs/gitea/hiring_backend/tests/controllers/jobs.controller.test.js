const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/jobs/controller');

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

describe('jobs controller', () => {
    let jobsApplication;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jobsApplication = {
            getJobs: jest.fn().mockResolvedValue([]),
            getJobsAdmin: jest.fn(),
            getJobById: jest.fn(),
            getJobDetail: jest.fn(),
            getJobDetailAdmin: jest.fn(),
            createJob: jest.fn(),
            updateJob: jest.fn(),
            duplicateJob: jest.fn(),
            deleteJob: jest.fn(),
            getMatchingJobSeekers: jest.fn(),
            getJobEmbeddingStatus: jest.fn(),
            updateAuthorizedPeople: jest.fn(),
            getOrRequestEmbedding: jest.fn(),
            getStatus: jest.fn()
        };
        controller = createController({ jobsApplication });
        res = createMockRes();
        next = jest.fn();
    });

    it('maps location seat code to location filter for public jobs endpoint', async () => {
        const req = createMockReq({
            query: { location: 'ul', page: '0' }
        });

        await controller.getJobs(req, res, next);

        expect(jobsApplication.getJobs).toHaveBeenCalledWith(expect.objectContaining({
            page: 0,
            filters: expect.objectContaining({
                org: undefined,
                location: 'UL'
            })
        }));
        expect(res.json).toHaveBeenCalledWith([]);
        expect(next).not.toHaveBeenCalled();
    });

    it('treats location UUID as legacy org filter', async () => {
        const req = createMockReq({
            query: { location: UUID_A, page: '0' }
        });

        await controller.getJobs(req, res, next);

        expect(jobsApplication.getJobs).toHaveBeenCalledWith(expect.objectContaining({
            filters: expect.objectContaining({
                org: UUID_A,
                location: undefined
            })
        }));
    });

    it('keeps org filter precedence over location', async () => {
        const req = createMockReq({
            query: { org: UUID_A, location: 'UL', page: '0' }
        });

        await controller.getJobs(req, res, next);

        expect(jobsApplication.getJobs).toHaveBeenCalledWith(expect.objectContaining({
            filters: expect.objectContaining({
                org: UUID_A,
                location: undefined
            })
        }));
    });

    it('keeps org filter unchanged when passed explicitly', async () => {
        const req = createMockReq({
            query: { org: UUID_B, page: '0' }
        });

        await controller.getJobs(req, res, next);

        expect(jobsApplication.getJobs).toHaveBeenCalledWith(expect.objectContaining({
            filters: expect.objectContaining({
                org: UUID_B
            })
        }));
    });
});
