module.exports = Object.freeze({
    portName: 'RoleAssignmentsRebacOutboxPort',
    methods: Object.freeze([
        'enqueueMembershipSync',
        'enqueueMembershipDelete',
        'enqueueUserRoleSync'
    ])
});
