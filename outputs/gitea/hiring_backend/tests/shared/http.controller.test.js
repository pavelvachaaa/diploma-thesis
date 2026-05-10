const { createMockReq, createMockRes } = require('../helpers');

const {
    handle,
    sendResult,
    writeAndSend
} = require('../../src/shared/http/controller');

describe('shared/http/controller', () => {
    it('sendResult applies the fallback status code to a plain payload', () => {
        const res = createMockRes();
        const payload = { ok: true };

        const result = sendResult(res, payload, 201);

        expect(result).toEqual({
            statusCode: 201,
            body: payload
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(payload);
    });

    it('sendResult preserves explicit statusCode/body envelopes', () => {
        const res = createMockRes();
        const raw = {
            statusCode: 404,
            body: { message: 'Not found' }
        };

        const result = sendResult(res, raw, 200);

        expect(result).toBe(raw);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not found' });
    });

    it('handle forwards async errors to next', async () => {
        const req = createMockReq();
        const res = createMockRes();
        const next = jest.fn();
        const error = new Error('boom');
        const wrapped = handle(async () => {
            throw error;
        });

        await wrapped(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('writeAndSend delegates to runWrite and sends the normalized response', async () => {
        const req = createMockReq({
            method: 'POST',
            path: '/api/v1/admin/interviews'
        });
        const res = createMockRes();
        const handler = jest.fn();
        const runWrite = jest.fn().mockResolvedValue({ created: true });

        const result = await writeAndSend({
            req,
            res,
            scope: 'interviews.create',
            handler,
            runWrite,
            fallbackStatusCode: 201
        });

        expect(runWrite).toHaveBeenCalledWith({
            req,
            scope: 'interviews.create',
            handler,
            fallbackStatusCode: 201
        });
        expect(result).toEqual({
            statusCode: 201,
            body: { created: true }
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ created: true });
    });
});
