const {
    buildNormalizedTypeSet,
    createOutboxStrategy
} = require('./shared');

module.exports = ({ rebacService, eventTypes }) => {
    const dispatchUserRoleSync = async (event) => {
        const userId = event?.payload?.userId || event?.aggregate_id || null;
        if (!userId) {
            throw new Error('userId is required for rebac.user_role.sync');
        }

        await rebacService.syncUserRolePermissions(userId);

        return {
            rebacAction: 'user_role.sync',
            userId
        };
    };

    const dispatchMembershipSync = async (event) => {
        const membershipId = event?.payload?.membershipId || event?.aggregate_id || null;
        if (!membershipId) {
            throw new Error('membershipId is required for rebac.membership.sync');
        }

        await rebacService.syncMembershipPermissions(membershipId);

        return {
            rebacAction: 'membership.sync',
            membershipId
        };
    };

    const dispatchMembershipDelete = async (event) => {
        const membershipId = event?.payload?.membershipId || event?.aggregate_id || null;
        if (!membershipId) {
            throw new Error('membershipId is required for rebac.membership.delete');
        }

        await rebacService.deleteMembershipPermissions(membershipId);

        return {
            rebacAction: 'membership.delete',
            membershipId
        };
    };

    const dispatchJobPostingSync = async (event) => {
        const jobPostingId = event?.payload?.jobPostingId || event?.aggregate_id || null;
        if (!jobPostingId) {
            throw new Error('jobPostingId is required for rebac.job_posting.sync');
        }

        await rebacService.syncJobPostingPermissions(jobPostingId);

        return {
            rebacAction: 'job_posting.sync',
            jobPostingId
        };
    };

    const dispatchOrganizationSync = async (event) => {
        const organizationId = event?.payload?.organizationId || event?.aggregate_id || null;
        if (!organizationId) {
            throw new Error('organizationId is required for rebac.organization.sync');
        }

        await rebacService.syncOrganizationPermissions(organizationId);

        return {
            rebacAction: 'organization.sync',
            organizationId
        };
    };

    return [
        createOutboxStrategy({
            key: 'rebacUserRoleSync',
            eventTypes: buildNormalizedTypeSet(eventTypes?.REBAC_USER_ROLE_SYNC, [
                'rebac.user_role.sync.v1',
                'rebac.user_role.sync'
            ]),
            prefixes: ['rebac.user_role.sync'],
            dispatch: dispatchUserRoleSync
        }),
        createOutboxStrategy({
            key: 'rebacMembershipSync',
            eventTypes: buildNormalizedTypeSet(eventTypes?.REBAC_MEMBERSHIP_SYNC, [
                'rebac.membership.sync.v1',
                'rebac.membership.sync'
            ]),
            prefixes: ['rebac.membership.sync'],
            dispatch: dispatchMembershipSync
        }),
        createOutboxStrategy({
            key: 'rebacMembershipDelete',
            eventTypes: buildNormalizedTypeSet(eventTypes?.REBAC_MEMBERSHIP_DELETE, [
                'rebac.membership.delete.v1',
                'rebac.membership.delete'
            ]),
            prefixes: ['rebac.membership.delete'],
            dispatch: dispatchMembershipDelete
        }),
        createOutboxStrategy({
            key: 'rebacJobPostingSync',
            eventTypes: buildNormalizedTypeSet(eventTypes?.REBAC_JOB_POSTING_SYNC, [
                'rebac.job_posting.sync.v1',
                'rebac.job_posting.sync'
            ]),
            prefixes: ['rebac.job_posting.sync'],
            dispatch: dispatchJobPostingSync
        }),
        createOutboxStrategy({
            key: 'rebacOrganizationSync',
            eventTypes: buildNormalizedTypeSet(eventTypes?.REBAC_ORGANIZATION_SYNC, [
                'rebac.organization.sync.v1',
                'rebac.organization.sync'
            ]),
            prefixes: ['rebac.organization.sync'],
            dispatch: dispatchOrganizationSync
        })
    ];
};
