const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const { jobUpdated } = require('../domain/events');

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
    sectionItemsStorePort,
    jobPermissionPort
}) => async (id, payload, actorUserId) => {
    const existing = await jobsStorePort.getJobDetailAdmin(id, {
        actorUserId,
        minAccess: 'write'
    });
    if (!existing) {
        throw new ApplicationError('Nabídka práce nebyla nalezena', { code: ErrorCode.NOT_FOUND });
    }
    if (existing.status === 'archived') {
        throw new ApplicationError('Archivovanou nabídku práce nelze upravovat', { code: ErrorCode.UNPROCESSABLE });
    }

    const updatedJob = await jobsStorePort.saveJob(id, payload, {
        actorUserId,
        minAccess: 'write',
        onBeforeCommit: async ({ client, job }) => {
            await syncSectionItemsCatalog(payload.sections, client, sectionItemsStorePort);
            await jobPermissionPort.syncJobPostingPermissions(job.id, { client });
            await jobsOutboxPort.enqueueJobSync({ client, jobId: job.id, organizationId: job.organization_id });
        }
    });
    if (!updatedJob) {
        return null;
    }

    jobsAuditPort.recordJobUpdated({ id, existingJob: existing, updatedJob });

    return updatedJob;
};
