const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const createInternalUsersRoutes = require('../../src/adapters/in/http/internalUsers/admin.routes');

describe('admin internal users routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the admin/hr auth guard on the search endpoint', () => {
        const router = createInternalUsersRoutes({
            internalUsersHttpController: {
                search: jest.fn()
            }
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(['admin', 'hr']);
    });
});
