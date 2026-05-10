const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const { ADMIN_ONLY_ROLES } = require('../../src/shared/auth/roles');
const createRoutes = require('../../src/adapters/in/http/roleAssignments/admin.routes');

const buildController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getUserRole: noop,
        updateUserRole: noop,
        getUserOrganizationMemberships: noop,
        createOrganizationMembership: noop,
        updateOrganizationMembershipExpiration: noop,
        deleteOrganizationMembership: noop
    };
};

describe('admin role assignments routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('protects all role assignment endpoints with admin-only auth', () => {
        const router = createRoutes({
            roleAssignmentsHttpController: buildController()
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledTimes(6);
        for (const call of mockRequireAuth.mock.calls) {
            expect(call[0]).toBe(ADMIN_ONLY_ROLES);
        }
    });
});
