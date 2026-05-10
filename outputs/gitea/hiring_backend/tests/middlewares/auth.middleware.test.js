jest.mock('@/container', () => ({
    resolve: jest.fn()
}));

const container = require('@/container');
const { authMiddleware, requireAuth } = require('../../src/middlewares/auth.middleware');

const createReq = (overrides = {}) => ({
    cookies: {
        auth_token: 'token'
    },
    user: null,
    ...overrides
});

const createRes = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    return res;
};

describe('auth middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('authMiddleware resolves user via authService and sets req.user shape', async () => {
        const req = createReq();
        const res = createRes();
        const next = jest.fn();

        container.resolve.mockReturnValue({
            getUserFromAuthToken: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'user@example.com',
                full_name: 'John Doe',
                organization_id: 'org-1',
                organization_name: 'Org',
                roles: ['admin'],
                roleData: [{ organization_id: 'org-1' }]
            })
        });

        await authMiddleware(req, res, next);

        expect(req.user).toEqual({
            id: 'user-1',
            email: 'user@example.com',
            fullName: 'John Doe',
            organization: 'Org',
            organization_id: 'org-1',
            role: 'admin',
            roles: ['admin'],
            organizations: ['org-1'],
            roleData: [{ organization_id: 'org-1' }]
        });
        expect(next).toHaveBeenCalledWith();
    });

    it('returns 401 when auth token is missing', async () => {
        const req = createReq({ cookies: {} });
        const res = createRes();
        const next = jest.fn();

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when authService reports invalid token', async () => {
        const req = createReq();
        const res = createRes();
        const next = jest.fn();

        const err = new Error('Invalid token');
        err.code = 'UNAUTHORIZED';

        container.resolve.mockReturnValue({
            getUserFromAuthToken: jest.fn().mockRejectedValue(err)
        });

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('requireAuth enforces role checks with super_admin bypass', async () => {
        const req = createReq({
            user: null
        });
        const res = createRes();
        const next = jest.fn();

        container.resolve.mockReturnValue({
            getUserFromAuthToken: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'user@example.com',
                full_name: 'John Doe',
                organization_id: 'org-1',
                organization_name: 'Org',
                roles: ['super_admin'],
                roleData: [{ organization_id: 'org-1' }]
            })
        });

        const middleware = requireAuth(['admin']);
        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });
});
