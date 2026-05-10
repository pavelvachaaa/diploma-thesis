const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const createRoutes = require('../../src/adapters/in/http/contactInquiries/admin.routes');

describe('admin contact inquiries routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('protects all routes with admin/hr auth', () => {
        const noop = jest.fn((_req, _res, next) => next && next());

        const router = createRoutes({
            contactInquiriesHttpController: {
                getAllContactInquiriesAdmin: noop,
                getContactInquiryByIdAdmin: noop,
                sendReplyAdmin: noop,
            }
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledTimes(3);
        expect(mockRequireAuth).toHaveBeenNthCalledWith(1, ['admin', 'hr']);
        expect(mockRequireAuth).toHaveBeenNthCalledWith(2, ['admin', 'hr']);
        expect(mockRequireAuth).toHaveBeenNthCalledWith(3, ['admin', 'hr']);
    });
});
