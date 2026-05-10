const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/contactInquiries/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const buildMocks = () => ({
    contactInquiriesApplication: {
        submitInquiry: jest.fn(),
        getAllInquiries: jest.fn(),
        getInquiryById: jest.fn(),
        sendReply: jest.fn(),
    },
});

describe('contactInquiries controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createMockRes();
        next = jest.fn();
    });

    it('maps ApplicationError VALIDATION_ERROR to 400 via handle()', async () => {
        const req = createMockReq({
            body: { email: 'john@example.com', message: 'Hello', gdprConsent: true }
        });
        const error = new ApplicationError('Name is required', { code: ErrorCode.VALIDATION_ERROR });
        mocks.contactInquiriesApplication.submitInquiry.mockRejectedValue(error);

        await controller.submitPublicInquiry(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('submits valid inquiry payload with raw body values', async () => {
        const req = createMockReq({
            body: {
                name: '  John Doe  ',
                email: '  john@example.com ',
                phone: '  +420777111222  ',
                message: '  Hello world  ',
                gdprConsent: true,
            },
        });

        mocks.contactInquiriesApplication.submitInquiry.mockResolvedValue({
            id: 'ci-1',
            name: 'John Doe',
            email: 'john@example.com',
            submitted_at: '2026-03-19T11:00:00.000Z',
        });

        await controller.submitPublicInquiry(req, res, next);

        expect(mocks.contactInquiriesApplication.submitInquiry).toHaveBeenCalledWith({
            name: '  John Doe  ',
            email: '  john@example.com ',
            phone: '  +420777111222  ',
            message: '  Hello world  ',
            gdprConsent: true,
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Contact inquiry submitted successfully',
            inquiry: {
                id: 'ci-1',
                name: 'John Doe',
                email: 'john@example.com',
                submitted_at: '2026-03-19T11:00:00.000Z',
            },
        });
    });

    it('returns 404 for missing inquiry detail', async () => {
        const req = createMockReq({ params: { id: 'missing' } });
        mocks.contactInquiriesApplication.getInquiryById.mockResolvedValue(null);

        await controller.getContactInquiryByIdAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Contact inquiry not found' }));
    });

    it('sends reply for valid admin payload with raw body values', async () => {
        const req = createMockReq({
            params: { id: 'ci-1' },
            body: {
                subject: '  Re: dotaz  ',
                message: '  Dobrý den  ',
            },
            user: {
                id: 'admin-1',
                name: 'Admin',
                surname: 'User',
            },
        });

        mocks.contactInquiriesApplication.sendReply.mockResolvedValue({
            id: 'ci-1',
            status: 'answered',
        });

        await controller.sendReplyAdmin(req, res, next);

        expect(mocks.contactInquiriesApplication.sendReply).toHaveBeenCalledWith('ci-1', {
            subject: '  Re: dotaz  ',
            message: '  Dobrý den  ',
            senderUser: req.user,
        });
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Email byl úspěšně odeslán',
            inquiry: {
                id: 'ci-1',
                status: 'answered',
            },
        });
    });

    it('maps ApplicationError NOT_FOUND to 404 when replying to missing inquiry', async () => {
        const req = createMockReq({
            params: { id: 'ci-1' },
            body: { subject: 'Re: dotaz', message: 'Dobrý den' }
        });
        const error = new ApplicationError('Contact inquiry not found', { code: ErrorCode.NOT_FOUND });
        mocks.contactInquiriesApplication.sendReply.mockRejectedValue(error);

        await controller.sendReplyAdmin(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 404);
        expect(res.json).not.toHaveBeenCalled();
    });

    it('forwards non-ApplicationError failures to next unchanged', async () => {
        const req = createMockReq({
            params: { id: 'ci-1' },
            body: { subject: 'Re: dotaz', message: 'Dobrý den' }
        });
        const error = new Error('boom');
        mocks.contactInquiriesApplication.sendReply.mockRejectedValue(error);

        await controller.sendReplyAdmin(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
