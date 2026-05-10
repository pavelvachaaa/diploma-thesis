const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/auth/controller');

const buildMocks = () => ({
    authService: {
        handleLocalLogin: jest.fn(),
        handleCiscoOAuth: jest.fn(),
        getCurrentUser: jest.fn(),
        exchangeOAuthToken: jest.fn(),
        handleOAuthLogin: jest.fn(),
        changeUserPassword: jest.fn(),
        recordLogout: jest.fn(),
    }
});

const createCookieRes = () => {
    const res = createMockRes();
    res.cookie = jest.fn();
    res.clearCookie = jest.fn();
    return res;
};

describe('auth controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createCookieRes();
        next = jest.fn();
    });

    it('login sets auth cookie and returns legacy payload shape', async () => {
        mocks.authService.handleLocalLogin.mockResolvedValue({
            token: 'jwt-token',
            user: {
                id: 'user-1',
                email: 'user@example.com',
                name: 'John',
                surname: 'Doe',
                organization_name: 'Org'
            },
            roles: ['admin'],
            redirect: '/admin/dashboard'
        });

        const req = createMockReq({
            body: { email: 'user@example.com', password: 'secret' }
        });

        await controller.login(req, res, next);

        expect(mocks.authService.handleLocalLogin).toHaveBeenCalledWith(req.body);
        expect(res.cookie).toHaveBeenCalledWith(
            'auth_token',
            'jwt-token',
            expect.objectContaining({ httpOnly: true })
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: {
                userId: 'user-1',
                email: 'user@example.com',
                fullName: 'John Doe',
                organization: 'Org',
                role: 'admin',
                roles: ['admin']
            },
            redirect: '/admin/dashboard'
        });
    });

    it('exchangeOAuthToken returns token payload from service', async () => {
        mocks.authService.exchangeOAuthToken.mockResolvedValue({
            idToken: 'id-token',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600
        });

        const req = createMockReq({
            body: {
                code: 'code',
                codeVerifier: 'verifier',
                redirectUri: 'https://onboarding.kzcr.eu/oauth/callback'
            }
        });

        await controller.exchangeOAuthToken(req, res, next);

        expect(mocks.authService.exchangeOAuthToken).toHaveBeenCalledWith({
            code: 'code',
            codeVerifier: 'verifier',
            redirectUri: 'https://onboarding.kzcr.eu/oauth/callback'
        });
        expect(res.json).toHaveBeenCalledWith({
            idToken: 'id-token',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600
        });
    });

    it('ucpLogin keeps legacy response shape and sets auth/id/access cookies', async () => {
        mocks.authService.handleOAuthLogin.mockResolvedValue({
            token: 'jwt-token',
            user: {
                id: 'user-1',
                email: 'user@example.com',
                name: 'John',
                surname: 'Doe',
                organization_name: 'Org'
            },
            roles: ['hr'],
            redirect: '/admin/dashboard',
            fallbackUsed: false,
            ucpError: null
        });

        const req = createMockReq({
            body: {
                idToken: 'id-token',
                accessToken: 'access-token'
            }
        });

        await controller.ucpLogin(req, res, next);

        expect(mocks.authService.handleOAuthLogin).toHaveBeenCalledWith('id-token', 'access-token');
        expect(res.cookie).toHaveBeenCalledTimes(3);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            user: {
                userId: 'user-1',
                email: 'user@example.com',
                fullName: 'John Doe',
                organization: 'Org',
                role: 'hr',
                roles: ['hr']
            },
            redirect: '/admin/dashboard',
            fallbackUsed: false,
            ucpError: null
        });
    });

    it('passes raw password change input through to auth service', async () => {
        const req = createMockReq({
            user: { id: 'user-1' },
            body: {
                currentPassword: '',
                newPassword: 'short'
            }
        });

        await controller.changePassword(req, res, next);

        expect(mocks.authService.changeUserPassword).toHaveBeenCalledWith('user-1', '', 'short');
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: 'Heslo bylo úspěšně změněno'
        });
    });
});
