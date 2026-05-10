const createRoleAssignmentsApplication = require('../../src/core/roleAssignments/application');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    roleAssignmentsStorePort: {},
    roleAssignmentsRebacOutboxPort: {},
    roleAssignmentsUnitOfWorkPort: {
        runInTransaction: jest.fn()
    },
    logger: createMockLogger()
});

describe('roleAssignments.application API contract', () => {
    it('exposes expected roleAssignments application API surface', () => {
        const application = createRoleAssignmentsApplication(createDependencies());

        expect(Object.keys(application).sort()).toEqual([
            'ROLE_LABELS',
            'createOrganizationMembership',
            'deleteOrganizationMembership',
            'getUserOrganizationMemberships',
            'getUserRole',
            'updateOrganizationMembershipExpiration',
            'updateUserRole'
        ]);
    });
});
