const createApplication = require('../../src/core/operations/application/audit');

const buildMocks = () => ({
    operationsAuditStorePort: {
        getEvents: jest.fn(),
        getEmployeeEvents: jest.fn(),
    },
});

describe('operations audit application', () => {
    let mocks;
    let application;

    beforeEach(() => {
        mocks = buildMocks();
        application = createApplication(mocks);
    });

    it('applies organization scoping for non-super-admin users', async () => {
        mocks.operationsAuditStorePort.getEvents.mockResolvedValue({ data: [], total: 0, page: 0, limit: 50 });

        await application.getEvents(
            { page: 0, limit: 20, category: 'email' },
            { id: 'user-1', roles: ['admin'], organizations: ['org-1', 'org-2'] }
        );

        expect(mocks.operationsAuditStorePort.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 0,
                limit: 20,
                category: 'email',
                organizationIds: ['org-1', 'org-2'],
                scopeUserId: 'user-1'
            })
        );
    });

    it('skips organization scoping for super-admin users', async () => {
        mocks.operationsAuditStorePort.getEvents.mockResolvedValue({ data: [], total: 0, page: 0, limit: 50 });

        await application.getEvents(
            { page: 1, limit: 10 },
            { id: 'super-1', roles: ['super_admin'], organizations: ['org-1'] }
        );

        expect(mocks.operationsAuditStorePort.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 1,
                limit: 10,
                organizationIds: null,
                scopeUserId: null
            })
        );
    });

    it('clamps limit to safe bounds', async () => {
        mocks.operationsAuditStorePort.getEvents.mockResolvedValue({ data: [], total: 0, page: 0, limit: 200 });

        await application.getEvents(
            { limit: 5000 },
            { id: 'user-1', roles: ['admin'], organizations: ['org-1'] }
        );

        expect(mocks.operationsAuditStorePort.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                limit: 200
            })
        );
    });

    it('builds employee-scoped audit lookup with the same access scoping rules', async () => {
        mocks.operationsAuditStorePort.getEmployeeEvents.mockResolvedValue({ data: [], total: 0, page: 0, limit: 25 });

        await application.getEmployeeEvents(
            'employee-1',
            { page: 1, limit: 25, status: 'success' },
            { id: 'super-1', roles: ['super_admin'], organizations: ['org-1'] }
        );

        expect(mocks.operationsAuditStorePort.getEmployeeEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                employeeId: 'employee-1',
                page: 1,
                limit: 25,
                status: 'success',
                organizationIds: null,
                scopeUserId: null
            })
        );
    });
});
