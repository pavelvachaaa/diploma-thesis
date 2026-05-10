const createAuthService = require('../../src/core/auth/application');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const buildMocks = () => ({
    authUserStorePort: {
        findByEmailAndProvider: jest.fn(),
        getUserRoles: jest.fn(),
        findById: jest.fn(),
        updateUserPassword: jest.fn(),
        getUserWithRoles: jest.fn(),
        createOAuthUser: jest.fn(),
        updateUserFromOAuth: jest.fn()
    },
    authPasswordHasherPort: {
        compare: jest.fn(),
        hash: jest.fn()
    },
    authTokenPort: {
        signToken: jest.fn(() => 'signed-token'),
        verifyToken: jest.fn()
    },
    seatLocationOrganizationLookupPort: {
        getOrganizationBySeatLocation: jest.fn()
    },
    authIdentityProviderPort: {
        decodeIdTokenClaims: jest.fn(() => null),
        exchangeAuthorizationCode: jest.fn(),
        fetchUcpUserInfo: jest.fn(),
        verifyCiscoToken: jest.fn()
    },
    authAuditPort: {
        emitAuthEvent: jest.fn()
    },
    authMembershipSyncPort: {
        queueMembershipSync: jest.fn()
    },
    authUnitOfWorkPort: {
        runInTransaction: jest.fn(async (work) => work({}))
    },
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn()
    }
});

describe('auth service', () => {
    const originalJwtSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        jest.clearAllMocks();
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalJwtSecret;
    });

    it('handles local login success and returns token + redirect', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);

        mocks.authUserStorePort.findByEmailAndProvider.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            password_hash: 'stored-hash',
            name: 'John',
            surname: 'Doe',
            organization_id: 'org-1',
            organization_name: 'Org'
        });
        mocks.authPasswordHasherPort.compare.mockResolvedValue(true);
        mocks.authUserStorePort.getUserRoles.mockResolvedValue(['admin']);

        const result = await service.handleLocalLogin({
            email: 'User@Example.COM',
            password: 'secret'
        });

        expect(mocks.authUserStorePort.findByEmailAndProvider).toHaveBeenCalledWith('user@example.com');
        expect(mocks.authPasswordHasherPort.compare).toHaveBeenCalledWith('secret', 'stored-hash');
        expect(result.token).toBe('signed-token');
        expect(result.roles).toEqual(['admin']);
        expect(result.redirect).toBe('/admin/dashboard');
        expect(mocks.authAuditPort.emitAuthEvent).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Auth.LocalLoginSucceeded'
        }));
    });

    it('fails local login for invalid credentials with ApplicationError code', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);

        mocks.authUserStorePort.findByEmailAndProvider.mockResolvedValue(null);

        await expect(service.handleLocalLogin({
            email: 'missing@example.com',
            password: 'x'
        })).rejects.toMatchObject({
            name: 'ApplicationError',
            code: ErrorCode.UNAUTHORIZED
        });

        await expect(service.handleLocalLogin({ email: '', password: '' })).rejects.toBeInstanceOf(ApplicationError);
        await expect(service.handleLocalLogin({ email: '', password: '' })).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR
        });

        expect(mocks.authAuditPort.emitAuthEvent).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Auth.LocalLoginFailed'
        }));
    });

    it('exchanges OAuth token through platform adapter', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);

        mocks.authIdentityProviderPort.exchangeAuthorizationCode.mockResolvedValue({
            idToken: 'id-token',
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 3600
        });

        const result = await service.exchangeOAuthToken({
            code: 'code',
            codeVerifier: 'verifier',
            redirectUri: 'https://onboarding.kzcr.eu/oauth/callback'
        });

        expect(result.idToken).toBe('id-token');
        expect(mocks.authAuditPort.emitAuthEvent).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Auth.OAuthTokenExchangeSucceeded'
        }));
    });

    it('handles OAuth UCP login with fallback token data when UCP call fails', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);

        const fakeIdToken = 'header.payload.signature';

        mocks.authIdentityProviderPort.decodeIdTokenClaims.mockReturnValue({
            email: 'User@Example.COM',
            given_name: 'John',
            family_name: 'Doe'
        });
        mocks.authIdentityProviderPort.fetchUcpUserInfo.mockRejectedValue(new Error('UCP down'));
        mocks.seatLocationOrganizationLookupPort.getOrganizationBySeatLocation.mockResolvedValue(null);
        mocks.authUserStorePort.findByEmailAndProvider.mockResolvedValue(null);
        mocks.authUserStorePort.createOAuthUser.mockResolvedValue({
            user: {
                id: 'user-1',
                email: 'user@example.com',
                name: 'John',
                surname: 'Doe',
                organization_id: null
            },
            membership: null
        });
        mocks.authUserStorePort.getUserRoles.mockResolvedValue(['user']);

        const result = await service.handleOAuthLogin(fakeIdToken, 'access-token');

        expect(mocks.authUserStorePort.findByEmailAndProvider).toHaveBeenCalledWith('user@example.com');
        expect(mocks.authUserStorePort.createOAuthUser).toHaveBeenCalledWith(expect.objectContaining({
            email: 'user@example.com'
        }), expect.any(Object));
        expect(result.user.id).toBe('user-1');
        expect(result.fallbackUsed).toBe(true);
        expect(result.redirect).toBe('/employee/dashboard');
        expect(mocks.authAuditPort.emitAuthEvent).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Auth.UcpLoginSucceeded'
        }));
    });

    it('handles Cisco OAuth login with strict token verification via adapter', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);

        mocks.authIdentityProviderPort.verifyCiscoToken.mockResolvedValue({
            sub: 'sub-1',
            iss: 'https://issuer.example.com',
            email: 'User@Example.COM',
            given_name: 'John',
            family_name: 'Doe'
        });
        mocks.authUserStorePort.findByEmailAndProvider.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            name: 'John',
            surname: 'Doe',
            organization_id: null
        });
        mocks.authUserStorePort.updateUserFromOAuth.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            name: 'John',
            surname: 'Doe',
            organization_id: null
        });
        mocks.authUserStorePort.getUserRoles.mockResolvedValue(['hr']);

        const result = await service.handleCiscoOAuth('token-value');

        expect(result.token).toBe('signed-token');
        expect(result.redirect).toBe('/admin/dashboard');
        expect(mocks.authUserStorePort.findByEmailAndProvider).toHaveBeenCalledWith('user@example.com');
        expect(mocks.authIdentityProviderPort.verifyCiscoToken).toHaveBeenCalledWith({
            token: 'token-value'
        });
    });

    it('fails Cisco OAuth when adapter verification fails', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);

        const error = new Error('Invalid Cisco token');
        error.status = 401;
        mocks.authIdentityProviderPort.verifyCiscoToken.mockRejectedValue(error);

        await expect(service.handleCiscoOAuth('bad-token')).rejects.toThrow('Invalid Cisco token');
        expect(mocks.authAuditPort.emitAuthEvent).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Auth.CiscoLoginFailed'
        }));
    });

    it('changes password when current password is valid', async () => {
        const mocks = buildMocks();
        const service = createAuthService(mocks);
        mocks.authUserStorePort.findById.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            organization_id: 'org-1',
            password_hash: 'current-hash'
        });
        mocks.authPasswordHasherPort.compare.mockResolvedValue(true);
        mocks.authPasswordHasherPort.hash.mockResolvedValue('new-hash');
        mocks.authUserStorePort.updateUserPassword.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com'
        });

        await service.changeUserPassword('user-1', 'current-secret', 'new-secret-123');

        expect(mocks.authUserStorePort.updateUserPassword).toHaveBeenCalledWith(
            'user-1',
            'new-hash'
        );
        expect(mocks.authAuditPort.emitAuthEvent).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Auth.PasswordChangeSucceeded'
        }));
    });
});
