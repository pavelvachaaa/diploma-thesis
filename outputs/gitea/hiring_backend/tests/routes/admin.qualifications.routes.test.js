jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: jest.fn(() => (_req, _res, next) => next())
}));

const { requireAuth } = require('@middlewares/auth.middleware');
const { ADMIN_HR_AUTHORIZED_PERSON_ROLES } = require('../../src/shared/auth/roles');
const createQualificationsRoutes = require('../../src/adapters/in/http/qualification/admin.routes');

describe('admin qualifications routes', () => {
    it('requires admin/hr/authorized_person roles for qualification lookup routes', () => {
        const controller = {
            lookup: jest.fn()
        };

        createQualificationsRoutes({ qualificationHttpController: controller });

        expect(requireAuth).toHaveBeenCalledWith(ADMIN_HR_AUTHORIZED_PERSON_ROLES);
    });
});
