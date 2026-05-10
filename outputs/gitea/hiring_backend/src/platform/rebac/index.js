const createTxRunner = require('@platform/transaction/createTxRunner');
const {
    MEMBERSHIP_RULE_PREFIX,
    USER_ROLE_RULE_PREFIX,
    DIRECT_JOB_ASSIGNMENT_RULE
} = require('./constants');
const {
    dedupeIds,
    getMembershipRule,
    getUserRoleRule
} = require('./rules');
const createMembershipSync = require('./membershipSync');
const createResourceSync = require('./resourceSync');
const createAccess = require('./access');
const createReconciler = require('./reconciler');

module.exports = ({ db, logger, transactionManager }) => {
    const { runInTransaction } = createTxRunner({
        db,
        transactionManager,
        logger,
        defaultLabel: 'rebac'
    });
    const membershipSync = createMembershipSync({
        db,
        runInTransaction,
        getMembershipRule,
        getUserRoleRule
    });
    const resourceSync = createResourceSync({
        db,
        runInTransaction,
        dedupeIds
    });
    const access = createAccess({ db });
    const reconciler = createReconciler({
        logger,
        cleanupExpiredMembershipPermissions: membershipSync.cleanupExpiredMembershipPermissions,
        repairMembershipPermissions: membershipSync.repairMembershipPermissions
    });

    return {
        MEMBERSHIP_RULE_PREFIX,
        USER_ROLE_RULE_PREFIX,
        DIRECT_JOB_ASSIGNMENT_RULE,
        getMembershipRule,
        getUserRoleRule,
        syncMembershipPermissions: membershipSync.syncMembershipPermissions,
        syncUserRolePermissions: membershipSync.syncUserRolePermissions,
        deleteMembershipPermissions: membershipSync.deleteMembershipPermissions,
        syncJobPostingPermissions: resourceSync.syncJobPostingPermissions,
        syncOrganizationPermissions: resourceSync.syncOrganizationPermissions,
        replaceDirectJobAssignments: resourceSync.replaceDirectJobAssignments,
        ensureMembershipCreateAccess: access.ensureMembershipCreateAccess,
        getDirectJobAssignments: resourceSync.getDirectJobAssignments,
        cleanupExpiredMembershipPermissions: membershipSync.cleanupExpiredMembershipPermissions,
        repairMembershipPermissions: membershipSync.repairMembershipPermissions,
        start: reconciler.start,
        stop: reconciler.stop
    };
};
