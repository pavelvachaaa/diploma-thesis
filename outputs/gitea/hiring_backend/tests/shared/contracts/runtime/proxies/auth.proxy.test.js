const createAuthUserStoreProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/authUserStore.proxy');
const createAuthTokenProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/authToken.proxy');
const createAuthPasswordHasherProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/authPasswordHasher.proxy');
const createAuthIdentityProviderProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/authIdentityProvider.proxy');
const createAuthAuditProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/authAudit.proxy');
const createAuthMembershipSyncProxy = require('../../../../../src/shared/contracts/runtime/proxies/auth/authMembershipSync.proxy');

describe('auth runtime proxies', () => {
    it('authUserStore proxy delegates store calls and preserves transaction client options', async () => {
        const client = { query: jest.fn() };
        const authUserStoreAdapter = {
            findByEmailAndProvider: jest.fn().mockResolvedValue({ id: 'user-1' }),
            findByEmail: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'user-2' }),
            getUserRoleRecord: jest.fn().mockResolvedValue({ role_name: 'hr' }),
            getUserRolesWithOrganizations: jest.fn().mockResolvedValue([]),
            getActiveUserRoles: jest.fn().mockResolvedValue(['hr']),
            getUserRoles: jest.fn().mockResolvedValue(['hr']),
            createOAuthUser: jest.fn().mockResolvedValue({ user: { id: 'user-3' }, membership: null }),
            updateUserFromOAuth: jest.fn().mockResolvedValue({ id: 'user-1' }),
            findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
            updateUserPassword: jest.fn().mockResolvedValue({ id: 'user-1' }),
            getUserWithRoles: jest.fn().mockResolvedValue({ id: 'user-1' })
        };
        const proxy = createAuthUserStoreProxy({ authUserStoreAdapter });

        await expect(proxy.findByEmailAndProvider('user@example.com')).resolves.toEqual({ id: 'user-1' });
        await proxy.createOAuthUser({ email: 'user@example.com' }, { client });

        expect(authUserStoreAdapter.findByEmailAndProvider).toHaveBeenCalledWith('user@example.com', {});
        expect(authUserStoreAdapter.createOAuthUser).toHaveBeenCalledWith(
            { email: 'user@example.com' },
            { client }
        );
    });

    it('authToken proxy delegates token operations', async () => {
        const authTokenAdapter = {
            signToken: jest.fn(() => 'jwt-token'),
            verifyToken: jest.fn(() => ({ sub: 'user-1' }))
        };
        const proxy = createAuthTokenProxy({ authTokenAdapter });

        await expect(proxy.signToken({ id: 'user-1' })).resolves.toBe('jwt-token');
        await expect(proxy.verifyToken('jwt-token')).resolves.toEqual({ sub: 'user-1' });
    });

    it('authPasswordHasher proxy delegates hashing operations', async () => {
        const authPasswordHasherAdapter = {
            compare: jest.fn().mockResolvedValue(true),
            hash: jest.fn().mockResolvedValue('hashed-password')
        };
        const proxy = createAuthPasswordHasherProxy({ authPasswordHasherAdapter });

        await expect(proxy.compare('plain', 'hashed')).resolves.toBe(true);
        await expect(proxy.hash('plain')).resolves.toBe('hashed-password');
    });

    it('authIdentityProvider proxy delegates OAuth provider operations', async () => {
        const authIdentityProviderAdapter = {
            decodeIdTokenClaims: jest.fn(() => ({ email: 'user@example.com' })),
            exchangeAuthorizationCode: jest.fn().mockResolvedValue({ idToken: 'id-token' }),
            fetchUcpUserInfo: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
            verifyCiscoToken: jest.fn().mockResolvedValue({ email: 'user@example.com' })
        };
        const proxy = createAuthIdentityProviderProxy({ authIdentityProviderAdapter });

        await expect(proxy.decodeIdTokenClaims('header.payload.signature')).resolves.toEqual({ email: 'user@example.com' });
        await expect(proxy.exchangeAuthorizationCode({ code: 'code' })).resolves.toEqual({ idToken: 'id-token' });
        await expect(proxy.fetchUcpUserInfo({ idToken: 'id-token' })).resolves.toEqual({ email: 'user@example.com' });
        await expect(proxy.verifyCiscoToken({ token: 'cisco-token' })).resolves.toEqual({ email: 'user@example.com' });
    });

    it('authAudit proxy delegates domain audit events', async () => {
        const authAuditAdapter = {
            emitAuthEvent: jest.fn()
        };
        const proxy = createAuthAuditProxy({ authAuditAdapter });

        await proxy.emitAuthEvent({ type: 'Auth.LogoutRecorded', userId: 'user-1' });

        expect(authAuditAdapter.emitAuthEvent).toHaveBeenCalledWith({
            type: 'Auth.LogoutRecorded',
            userId: 'user-1'
        });
    });

    it('authMembershipSync proxy delegates membership sync payloads', async () => {
        const client = { query: jest.fn() };
        const authMembershipSyncAdapter = {
            queueMembershipSync: jest.fn().mockResolvedValue({ id: 'outbox-1' })
        };
        const proxy = createAuthMembershipSyncProxy({ authMembershipSyncAdapter });

        await expect(proxy.queueMembershipSync(
            { membership: { id: 'membership-1' } },
            { client }
        )).resolves.toEqual({ id: 'outbox-1' });

        expect(authMembershipSyncAdapter.queueMembershipSync).toHaveBeenCalledWith(
            { membership: { id: 'membership-1' } },
            { client }
        );
    });
});
