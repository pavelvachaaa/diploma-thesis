const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const { jobDuplicated } = require('../domain/events');

module.exports = ({
    jobsStorePort,
    jobsAuditPort,
    jobsOutboxPort,
    jobPermissionPort
}) => async (id, userId) => {
    const originalJob = await jobsStorePort.getJobDetailAdmin(id, {
        actorUserId: userId,
        minAccess: 'read'
    });
    if (!originalJob) {
        throw new ApplicationError('Nabídka práce nebyla nalezena', { code: ErrorCode.NOT_FOUND });
    }

    const duplicatedJobData = {
        title: `${originalJob.title} (kopie)`,
        description: originalJob.description,
        short_description: originalJob.short_description,
        job_role_id: originalJob.job_role_id,
        organization_id: originalJob.organization_id,
        status: 'draft',
        salary_min: originalJob.salary_min,
        salary_max: originalJob.salary_max,
        contract_type_code: originalJob.contract_type_code,
        department: originalJob.department,
        is_department_accredited: originalJob.is_department_accredited,
        publish_date: null,
        expire_date: null,
        contact_email: originalJob.contact_email,
        contact_phone: originalJob.contact_phone,
        cv_required: originalJob.cv_required,
        sections: originalJob.sections || {}
    };
    if (userId) {
        duplicatedJobData.created_by = userId;
    }

    const newJob = await jobsStorePort.saveJob(null, duplicatedJobData, {
        onBeforeCommit: async ({ client, job }) => {
            await jobPermissionPort.syncJobPostingPermissions(job.id, { client });
            await jobsOutboxPort.enqueueJobSync({ client, jobId: job.id, organizationId: job.organization_id });
        }
    });

    jobsAuditPort.recordJobDuplicated({ originalJob, newJob, userId });

    return newJob;
};
