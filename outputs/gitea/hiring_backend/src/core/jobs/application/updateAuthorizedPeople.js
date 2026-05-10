module.exports = ({
    jobsStorePort,
    jobsOutboxPort,
    internalUserProvisioningPort,
    jobPermissionPort
}) => async (jobId, authorizedPeople = [], actorUserId = null) => {
    const normalizedPeople = Array.isArray(authorizedPeople) ? authorizedPeople : [];

    return jobsStorePort.withTransaction(async (client) => {
        const job = await jobsStorePort.getJobById(jobId, {
            client,
            actorUserId,
            minAccess: 'write'
        });
        if (!job) {
            const ApplicationError = require('@core/shared/errors/ApplicationError');
            const { ErrorCode } = require('@core/shared/errors/ApplicationError');
            throw new ApplicationError('Nabídka práce nebyla nalezena', { code: ErrorCode.NOT_FOUND });
        }

        const userIds = [];
        for (const person of normalizedPeople) {
            const ensuredUser = await internalUserProvisioningPort.ensureLocalUser(person, { client });
            const membership = await jobsStorePort.ensureAuthorizedPersonMembership({
                client,
                userId: ensuredUser.user.id,
                organizationId: job.organization_id,
                assignedBy: actorUserId
            });
            if (membership?.needsRoleSync) {
                await jobsOutboxPort.enqueueUserRoleSync({
                    client,
                    user: { id: ensuredUser.user.id, organization_id: job.organization_id }
                });
            }
            if (membership?.needsMembershipSync) {
                await jobsOutboxPort.enqueueMembershipSync({ client, assignment: membership });
            }
            userIds.push(ensuredUser.user.id);
        }

        await jobPermissionPort.replaceDirectJobAssignments(jobId, userIds, { client });
        return jobPermissionPort.getDirectJobAssignments(jobId, { client });
    });
};
