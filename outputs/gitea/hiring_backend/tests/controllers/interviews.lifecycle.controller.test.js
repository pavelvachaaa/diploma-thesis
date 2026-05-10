const { createMockReq, createMockRes, createMockLogger } = require('../helpers');

const createInterviewsController = require('../../src/domain/interviews/controller');

const passthroughIdempotencyService = () => ({
    execute: jest.fn(async (_options, handler) => handler())
});

const buildMocks = () => ({
    calendarService: {
        createInterview: jest.fn(),
        updateInterview: jest.fn(),
        cancelInterview: jest.fn(),
        markCompleted: jest.fn(),
        markNoShow: jest.fn(),
        resendInvitation: jest.fn()
    },
    applicantsService: {
        getApplicantById: jest.fn()
    },
    commandIdempotencyService: passthroughIdempotencyService(),
    logger: createMockLogger(),
    fileDownload: {
        downloadFile: jest.fn()
    }
});

describe('interviews lifecycle controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createInterviewsController(mocks);
        res = createMockRes();
        next = jest.fn();
    });

    it('returns 404 when create is called for an inaccessible applicant', async () => {
        const req = createMockReq({
            body: {
                applicant_id: 'app-1',
                title: 'Interview',
                scheduled_at: new Date().toISOString()
            }
        });

        mocks.applicantsService.getApplicantById.mockResolvedValue(null);

        await controller.create(req, res, next);

        expect(mocks.commandIdempotencyService.execute).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Applicant not found' });
        expect(next).not.toHaveBeenCalled();
    });

    it('updates interviews through the shared idempotent write path', async () => {
        const req = createMockReq({
            params: { id: 'int-1' },
            body: {
                title: 'Updated interview'
            },
            headers: {
                'Idempotency-Key': 'idem-interview-update'
            }
        });
        const interview = { id: 'int-1', title: 'Updated interview' };

        mocks.calendarService.updateInterview.mockResolvedValue(interview);

        await controller.update(req, res, next);

        expect(mocks.commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'interviews.update',
                idempotencyKey: 'idem-interview-update'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(interview);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when cancel is called without a reason', async () => {
        const req = createMockReq({
            params: { id: 'int-1' },
            body: {}
        });

        await controller.cancel(req, res, next);

        expect(mocks.commandIdempotencyService.execute).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cancellation reason is required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('marks interviews complete through the standardized write wrapper', async () => {
        const req = createMockReq({
            params: { id: 'int-1' },
            body: { notes: 'Strong fit' },
            headers: {
                'Idempotency-Key': 'idem-interview-complete'
            }
        });
        const interview = { id: 'int-1', status: 'completed' };

        mocks.calendarService.markCompleted.mockResolvedValue(interview);

        await controller.complete(req, res, next);

        expect(mocks.commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'interviews.complete',
                idempotencyKey: 'idem-interview-complete'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(interview);
        expect(next).not.toHaveBeenCalled();
    });

    it('marks interviews as no-show through the standardized write wrapper', async () => {
        const req = createMockReq({
            params: { id: 'int-1' },
            body: { notes: 'Did not arrive' },
            headers: {
                'Idempotency-Key': 'idem-interview-no-show'
            }
        });
        const interview = { id: 'int-1', status: 'no_show' };

        mocks.calendarService.markNoShow.mockResolvedValue(interview);

        await controller.markNoShow(req, res, next);

        expect(mocks.commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'interviews.noShow',
                idempotencyKey: 'idem-interview-no-show'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(interview);
        expect(next).not.toHaveBeenCalled();
    });
});
