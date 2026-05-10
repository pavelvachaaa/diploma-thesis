jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: jest.fn(() => (_req, _res, next) => next())
}));

const { requireAuth } = require('@middlewares/auth.middleware');
const createOutboxRoutes = require('../../src/adapters/in/http/operations/outbox.routes');

describe('admin outbox routes', () => {
    it('requires super_admin role for all outbox operations endpoints', () => {
        const controller = {
            getSummary: jest.fn(),
            getEvents: jest.fn(),
            replayDead: jest.fn()
        };

        createOutboxRoutes({ operationsOutboxHttpController: controller });

        expect(requireAuth).toHaveBeenCalledWith(['super_admin']);
    });
});
