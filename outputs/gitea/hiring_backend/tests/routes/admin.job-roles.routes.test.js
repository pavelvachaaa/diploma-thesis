const mockAuthMiddleware = jest.fn((_req, _res, next) => next());
const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

const {
    ADMIN_ONLY_ROLES
} = require('../../src/shared/auth/roles');
const { ADMIN_CAPABILITIES, getAdminCapabilityRoles } = require('../../src/shared/auth/adminCapabilities');

jest.mock('@middlewares/auth.middleware', () => ({
    authMiddleware: (...args) => mockAuthMiddleware(...args),
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const createJobRolesRoutes = require('../../src/adapters/in/http/catalog/jobRoles.admin.routes');

const buildNoopController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getAll: noop,
        getAllClassifications: noop,
        getById: noop,
        getByOrganization: noop,
        create: noop,
        update: noop,
        delete: noop
    };
};

const buildSectionItemsController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getByJobRole: noop,
        addToJobRole: noop,
        replaceJobRoleSectionItems: noop,
        updateJobRoleItem: noop,
        removeFromJobRole: noop
    };
};

describe('admin job roles routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps read-only lookups available to the right admin roles while preserving admin-only CRUD', () => {
        const router = createJobRolesRoutes({
            jobRolesHttpController: buildNoopController(),
            sectionItemsHttpController: buildSectionItemsController()
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(
            getAdminCapabilityRoles(ADMIN_CAPABILITIES.JOB_ROLE_CLASSIFICATIONS_LOOKUP)
        );
        expect(mockRequireAuth).toHaveBeenCalledWith(
            getAdminCapabilityRoles(ADMIN_CAPABILITIES.JOB_ROLE_SECTION_ITEMS_LOOKUP)
        );
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_ONLY_ROLES);
    });
});
