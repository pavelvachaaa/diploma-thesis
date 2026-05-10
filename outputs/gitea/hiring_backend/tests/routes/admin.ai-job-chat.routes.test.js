const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

const { ADMIN_HR_AUTHORIZED_PERSON_ROLES } = require('../../src/shared/auth/roles');

jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const createAiJobChatRoutes = require('../../src/adapters/in/http/ai/admin.routes');

describe('admin ai job chat routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the existing admin/hr/authorized-person guard', () => {
        const noop = jest.fn();
        const router = createAiJobChatRoutes({
            aiJobChatHttpController: {
                streamChat: noop,
                extractJob: noop,
                refineText: noop
            }
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_HR_AUTHORIZED_PERSON_ROLES);
    });
});
