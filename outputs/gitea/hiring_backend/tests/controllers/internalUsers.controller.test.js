const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/internalUsers/controller');

describe('internalUsers controller', () => {
    let internalUsersApplication;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        internalUsersApplication = {
            search: jest.fn()
        };
        controller = createController({ internalUsersApplication });
        res = createMockRes();
        next = jest.fn();
    });

    it('returns search results through shared controller helpers', async () => {
        const req = createMockReq({
            query: { q: 'pavel' }
        });
        internalUsersApplication.search.mockResolvedValue([{ id: 'user-1' }]);

        await controller.search(req, res, next);

        expect(internalUsersApplication.search).toHaveBeenCalledWith({ query: 'pavel' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 'user-1' }]);
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards errors to next via handle()', async () => {
        const req = createMockReq({
            query: { q: 'pavel' }
        });
        const error = new Error('boom');
        error.code = 'TEST_FAILURE';
        internalUsersApplication.search.mockRejectedValue(error);

        await controller.search(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
