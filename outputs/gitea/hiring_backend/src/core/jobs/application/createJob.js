const { jobCreated } = require('../domain/events');

const JOB_SECTION_TYPES = ['duties', 'requirements', 'benefits'];

const syncSectionItemsCatalog = async (sections, client, sectionItemsStorePort) => {
    if (!sections || typeof sections !== 'object') return;
    for (const sectionType of JOB_SECTION_TYPES) {
        if (!Array.isArray(sections[sectionType])) continue;
        await sectionItemsStorePort.ensureCatalogItems(sectionType, sections[sectionType], { client });
    }
};

module.exports = ({
    jobsStorePort,
    jobsAuditPort,
    jobsOutboxPort,
    membershipAccessPort,
    sectionItemsStorePort,
    jobPermissionPort
}) => async (payload, requestUser = null) => {
    const normalizedRequestUser = typeof requestUser === 'string'
        ? { id: requestUser, roleData: [] }
        : requestUser;

    await membershipAccessPort.ensureMembershipCreateAccess({
        actorUserId: normalizedRequestUser?.id || null,
        organizationId: payload.organization_id,
        allowedRoles: ['hr', 'admin']
    });

    const createPayload = { ...payload };
    if (normalizedRequestUser?.id) {
        createPayload.created_by = normalizedRequestUser.id;
    }

    const createdJob = await jobsStorePort.saveJob(null, createPayload, {
        onBeforeCommit: async ({ client, job }) => {
            await syncSectionItemsCatalog(createPayload.sections, client, sectionItemsStorePort);
            await jobPermissionPort.syncJobPostingPermissions(job.id, { client });
            await jobsOutboxPort.enqueueJobSync({ client, jobId: job.id, organizationId: job.organization_id });
        }
    });

    jobsAuditPort.recordJobCreated({
        createdJob,
        payload: createPayload,
        userId: normalizedRequestUser?.id || null
    });

    return createdJob;
};
