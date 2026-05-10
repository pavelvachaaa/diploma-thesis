const mockAuthMiddleware = jest.fn((_req, _res, next) => next());
const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

const {
    SUPER_ADMIN_ONLY_ROLES
} = require('../../src/shared/auth/roles');
const { ADMIN_CAPABILITIES, getAdminCapabilityRoles } = require('../../src/shared/auth/adminCapabilities');

jest.mock('@middlewares/auth.middleware', () => ({
    authMiddleware: (...args) => mockAuthMiddleware(...args),
    requireAuth: (...args) => mockRequireAuth(...args)
}));

jest.mock('@middlewares/resourceAccessAudit.middleware', () => jest.fn(() => (_req, _res, next) => next()));

const createOrganizationsRoutes = require('../../src/adapters/in/http/organizations/admin.routes');

const buildController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getAll: noop,
        getById: noop,
        create: noop,
        update: noop,
        uploadContactPhoto: noop,
        deleteContactPhoto: noop,
        delete: noop
    };
};

describe('admin organizations routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows admin-shell roles to fetch organization lookups but keeps mutations super-admin only', () => {
        const router = createOrganizationsRoutes({
            organizationsHttpController: buildController(),
            fileHandler: {
                createUploadMiddleware: jest.fn(() => (_req, _res, next) => next())
            }
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(
            getAdminCapabilityRoles(ADMIN_CAPABILITIES.ORGANIZATIONS_LOOKUP)
        );
        expect(mockRequireAuth).toHaveBeenCalledWith(SUPER_ADMIN_ONLY_ROLES);
    });
});
