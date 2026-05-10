const mockAuthMiddleware = jest.fn((_req, _res, next) => next());
const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

const { ADMIN_ONLY_ROLES } = require('../../src/shared/auth/roles');
const { ADMIN_CAPABILITIES, getAdminCapabilityRoles } = require('../../src/shared/auth/adminCapabilities');

jest.mock('@middlewares/auth.middleware', () => ({
    authMiddleware: (...args) => mockAuthMiddleware(...args),
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const createSectionItemsRoutes = require('../../src/adapters/in/http/sectionItems/admin.routes');

const buildController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getAllSectionTypes: noop,
        getBySectionType: noop,
        getById: noop,
        getAll: noop,
        create: noop,
        update: noop,
        delete: noop,
        updateOrderIndices: noop
    };
};

describe('admin section items routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('exposes lookup endpoints through the centralized capability map while keeping CRUD admin-only', () => {
        const router = createSectionItemsRoutes({
            sectionItemsHttpController: buildController()
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(
            getAdminCapabilityRoles(ADMIN_CAPABILITIES.SECTION_ITEMS_LOOKUP)
        );
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_ONLY_ROLES);
    });
});
