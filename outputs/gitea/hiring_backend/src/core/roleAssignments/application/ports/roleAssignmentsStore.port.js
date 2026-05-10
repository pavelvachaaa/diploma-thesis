module.exports = Object.freeze({
    portName: 'RoleAssignmentsStorePort',
    methods: Object.freeze([
        'getUserRole',
        'updateUserRole',
        'getUserOrganizationMemberships',
        'createOrganizationMembership',
        'updateOrganizationMembershipExpiration',
        'deleteOrganizationMembership',
        'getOrganizationMembershipById'
    ])
});
