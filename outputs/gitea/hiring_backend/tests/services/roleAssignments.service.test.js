const createRoleAssignmentsApplication = require('../../src/core/roleAssignments/application');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    txClient: {
        query: jest.fn()
    },
    roleAssignmentsStorePort: {
        getUserRole: jest.fn().mockResolvedValue({
            user_id: 'user-2',
            role_name: 'hr',
            role_description: 'HR'
        }),
        updateUserRole: jest.fn().mockResolvedValue({
            user_id: 'user-2',
            role_name: 'authorized_person',
            organization_id: 'org-1'
        }),
        getUserOrganizationMemberships: jest.fn().mockResolvedValue([]),
        createOrganizationMembership: jest.fn().mockResolvedValue({ id: 'membership-1' }),
        updateOrganizationMembershipExpiration: jest.fn().mockResolvedValue({ id: 'membership-1' }),
        deleteOrganizationMembership: jest.fn().mockResolvedValue({ id: 'membership-1' }),
        getOrganizationMembershipById: jest.fn().mockResolvedValue({
            id: 'membership-1',
            user_id: 'user-2',
            organization_id: 'org-1',
            role_name: 'hr'
        })
    },
    roleAssignmentsRebacOutboxPort: {
        enqueueMembershipSync: jest.fn(),
        enqueueMembershipDelete: jest.fn(),
        enqueueUserRoleSync: jest.fn()
    },
    roleAssignmentsUnitOfWorkPort: {
        runInTransaction: jest.fn()
    },
    logger: createMockLogger()
});

const createApplication = (deps) => {
    deps.roleAssignmentsUnitOfWorkPort.runInTransaction.mockImplementation((work) => work(deps.txClient));
    return createRoleAssignmentsApplication(deps);
};

describe('roleAssignments.application', () => {
    it('allows admin users to read organization memberships', async () => {
        const deps = createDependencies();
        deps.roleAssignmentsStorePort.getUserOrganizationMemberships.mockResolvedValueOnce([{ id: 'membership-1' }]);
        const application = createApplication(deps);

        const result = await application.getUserOrganizationMemberships('user-2', {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        });

        expect(deps.roleAssignmentsStorePort.getUserOrganizationMemberships).toHaveBeenCalledWith('user-2');
        expect(result).toEqual([{ id: 'membership-1' }]);
    });

    it('rejects createOrganizationMembership when admin targets foreign organization', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await expect(application.createOrganizationMembership({
            userId: 'user-2',
            organizationId: 'org-2',
            expiresAt: null,
            notes: null
        }, {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        })).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });

        expect(deps.roleAssignmentsStorePort.createOrganizationMembership).not.toHaveBeenCalled();
    });

    it('allows super admin to update foreign organization memberships', async () => {
        const deps = createDependencies();
        deps.roleAssignmentsStorePort.getOrganizationMembershipById.mockResolvedValueOnce({
            id: 'membership-1',
            user_id: 'user-2',
            organization_id: 'org-2',
            role_name: 'hr'
        });
        deps.roleAssignmentsStorePort.updateOrganizationMembershipExpiration.mockResolvedValueOnce({
            id: 'membership-1',
            user_id: 'user-2',
            organization_id: 'org-2'
        });
        const application = createApplication(deps);

        await application.updateOrganizationMembershipExpiration(
            'membership-1',
            '2030-01-01T00:00:00.000Z',
            {
                id: 'super-1',
                roles: ['super_admin'],
                organizations: []
            }
        );

        expect(deps.roleAssignmentsUnitOfWorkPort.runInTransaction).toHaveBeenCalledWith(
            expect.any(Function),
            { label: 'roleAssignments.updateOrganizationMembershipExpiration' }
        );
        expect(deps.roleAssignmentsStorePort.updateOrganizationMembershipExpiration).toHaveBeenCalledWith(
            'membership-1',
            '2030-01-01T00:00:00.000Z',
            'super-1',
            { client: deps.txClient }
        );
        expect(deps.roleAssignmentsRebacOutboxPort.enqueueMembershipSync).toHaveBeenCalledWith(
            {
                id: 'membership-1',
                user_id: 'user-2',
                organization_id: 'org-2'
            },
            { client: deps.txClient }
        );
    });

    it('rejects updating a super admin role by regular admin', async () => {
        const deps = createDependencies();
        deps.roleAssignmentsStorePort.getUserRole.mockResolvedValueOnce({
            user_id: 'user-2',
            role_name: 'super_admin',
            role_description: 'Super Admin'
        });
        const application = createApplication(deps);

        await expect(application.updateUserRole({
            userId: 'user-2',
            role: 'admin'
        }, {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        })).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });

        expect(deps.roleAssignmentsStorePort.updateUserRole).not.toHaveBeenCalled();
    });

    it('rejects invalid role assignments with a validation error', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await expect(application.updateUserRole({
            userId: 'user-2',
            role: 'owner'
        }, {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        })).rejects.toMatchObject({ code: ErrorCode.VALIDATION_ERROR });

        expect(deps.roleAssignmentsStorePort.updateUserRole).not.toHaveBeenCalled();
    });

    it('rejects expired organization membership dates with a validation error', async () => {
        const deps = createDependencies();
        const application = createApplication(deps);

        await expect(application.createOrganizationMembership({
            userId: 'user-2',
            organizationId: 'org-1',
            expiresAt: '2000-01-01T00:00:00.000Z',
            notes: null
        }, {
            id: 'admin-1',
            roles: ['admin'],
            organizations: ['org-1']
        })).rejects.toMatchObject({ code: ErrorCode.VALIDATION_ERROR });

        expect(deps.roleAssignmentsStorePort.createOrganizationMembership).not.toHaveBeenCalled();
    });
});
