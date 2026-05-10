const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/cvAnalysis/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

describe('cvAnalysis HTTP controller', () => {
    const createMocks = () => ({
        cvAnalysisService: {
            getAnalysis: jest.fn(),
            getStatus: jest.fn(),
            searchBySkills: jest.fn(),
            getStats: jest.fn(),
            triggerReanalysis: jest.fn()
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
        mocks.cvAnalysisService.searchBySkills.mockResolvedValue({ skills: ['SQL', 'Node'], count: 0, results: [] });

        await controller.searchBySkills(req, res, next);

        expect(mocks.cvAnalysisService.searchBySkills).toHaveBeenCalledWith(' SQL, Node ', {
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
        mocks.cvAnalysisService.searchBySkills.mockRejectedValue(error);

        await controller.searchBySkills(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
    });

    it('returns status when full analysis is not available yet', async () => {
        const mocks = createMocks();
        const controller = createController(mocks);
        const req = createMockReq({ params: { applicantId: 'app-1' }, user: { id: 'user-1' } });
        const res = createMockRes();
        const next = jest.fn();
        mocks.cvAnalysisService.getAnalysis.mockResolvedValue(null);
        mocks.cvAnalysisService.getStatus.mockResolvedValue({ status: 'pending' });

        await controller.getAnalysis(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ status: 'pending' });
        expect(next).not.toHaveBeenCalled();
    });
});
