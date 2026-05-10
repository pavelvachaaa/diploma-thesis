const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/jobSeekerCvAnalysis/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

describe('jobSeekerCvAnalysis HTTP controller', () => {
    const createMocks = () => ({
        jobSeekerCvAnalysisService: {
            getAnalysis: jest.fn(),
            getStatus: jest.fn(),
            triggerReanalysis: jest.fn(),
            searchBySkills: jest.fn(),
            getStats: jest.fn()
        },
        jobSeekersAccessPort: {
            getJobSeekerById: jest.fn()
        }
    });

    it('passes raw skills query values to the application layer', async () => {
        const mocks = createMocks();
        const controller = createController(mocks);
        const req = createMockReq({
            query: { skills: ' SQL, Node ', limit: '25' },
            user: { id: 'user-1' }
        });
        const res = createMockRes();
        const next = jest.fn();
        mocks.jobSeekerCvAnalysisService.searchBySkills.mockResolvedValue({ skills: ['SQL', 'Node'], count: 0, results: [] });

        await controller.searchBySkills(req, res, next);

        expect(mocks.jobSeekerCvAnalysisService.searchBySkills).toHaveBeenCalledWith(' SQL, Node ', {
            actorUserId: 'user-1',
            minAccess: 'read',
            limit: '25'
        });
        expect(res.json).toHaveBeenCalledWith({ skills: ['SQL', 'Node'], count: 0, results: [] });
        expect(next).not.toHaveBeenCalled();
    });

    it('maps ApplicationError validation failures through handle()', async () => {
        const mocks = createMocks();
        const controller = createController(mocks);
        const req = createMockReq({ query: {}, user: { id: 'user-1' } });
        const res = createMockRes();
        const next = jest.fn();
        const error = new ApplicationError('Skills parameter is required (comma-separated)', {
            code: ErrorCode.VALIDATION_ERROR
        });
        mocks.jobSeekerCvAnalysisService.searchBySkills.mockRejectedValue(error);

        await controller.searchBySkills(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
    });

    it('uses jobSeekersAccessPort for reanalysis job seeker lookup', async () => {
        const mocks = createMocks();
        const controller = createController(mocks);
        const req = createMockReq({ params: { id: 'js-1' }, user: { id: 'user-1' } });
        const res = createMockRes();
        const next = jest.fn();
        const jobSeeker = { id: 'js-1', cv_file_path: 'job-seekers/cv.pdf' };
        mocks.jobSeekersAccessPort.getJobSeekerById.mockResolvedValue(jobSeeker);
        mocks.jobSeekerCvAnalysisService.triggerReanalysis.mockResolvedValue({
            message: 'CV analysis has been queued',
            status: 'pending'
        });

        await controller.triggerReanalysis(req, res, next);

        expect(mocks.jobSeekersAccessPort.getJobSeekerById).toHaveBeenCalledWith('js-1', {
            actorUserId: 'user-1',
            minAccess: 'write'
        });
        expect(mocks.jobSeekerCvAnalysisService.triggerReanalysis).toHaveBeenCalledWith('js-1', jobSeeker);
        expect(res.json).toHaveBeenCalledWith({
            message: 'CV analysis has been queued',
            status: 'pending'
        });
    });
});
