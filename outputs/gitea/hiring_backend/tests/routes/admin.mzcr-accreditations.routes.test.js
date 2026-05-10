jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: jest.fn(() => (_req, _res, next) => next())
}));

const { requireAuth } = require('@middlewares/auth.middleware');
const { ELEVATED_ADMIN_ROLES } = require('../../src/shared/auth/roles');
const createMzcrAccreditationsRoutes = require('../../src/adapters/in/http/mzcrAccreditations/admin.routes');

describe('admin MZCR accreditations routes', () => {
    it('requires elevated admin roles for readonly accreditation routes', () => {
        const controller = {
            getAll: jest.fn(),
            getMeta: jest.fn()
        };

        createMzcrAccreditationsRoutes({ mzcrAccreditationsHttpController: controller });

        expect(requireAuth).toHaveBeenCalledWith(ELEVATED_ADMIN_ROLES);
        expect(requireAuth).toHaveBeenCalledTimes(2);
    });
});
