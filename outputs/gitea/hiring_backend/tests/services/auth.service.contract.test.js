const createAuthService = require('../../src/core/auth/application');

const createDependencies = () => ({
    authUserStorePort: {},
    authTokenPort: {},
    authPasswordHasherPort: {},
    seatLocationOrganizationLookupPort: {
        getOrganizationBySeatLocation: jest.fn()
    },
    authIdentityProviderPort: {
        decodeIdTokenClaims: jest.fn(),
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
        runInTransaction: jest.fn()
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

describe('auth.service API contract', () => {
    it('exposes expected auth service API surface', () => {
        const service = createAuthService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'changeUserPassword',
            'exchangeOAuthToken',
            'extractTokenData',
            'getCurrentUser',
            'getUserFromAuthToken',
            'handleCiscoOAuth',
            'handleLocalLogin',
            'handleOAuthLogin',
            'recordLogout'
        ]);
    });
});
