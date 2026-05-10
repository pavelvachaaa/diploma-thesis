const createRoutes = require('../../src/adapters/in/http/contactInquiries/public.routes');

describe('public contact inquiries routes', () => {
    it('builds public submit route without auth dependencies', () => {
        const router = createRoutes({
            contactInquiriesHttpController: {
                submitPublicInquiry: jest.fn(),
            }
        });

        expect(router).toBeDefined();
    });
});
