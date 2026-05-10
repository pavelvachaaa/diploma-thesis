const HttpError = require('@shared/errors/HttpError');

module.exports = ({
    applicantsRepository,
    statusRepository,
    jobsRepository,
    runWriteWithOutbox,
    queueApplicationReceivedEmail,
    queueRoleNotification,
    emitAudit,
    createSnapshot,
    APPLICANT_AUDIT_FIELDS
}) => {
    const createApplicant = async (applicantData, options = {}) => {
        const applicantWithStatus = {
            ...applicantData,
            current_status: 'submitted'
        };

        const { writeResult } = await runWriteWithOutbox({
            label: 'applicants.createApplicant',
            write: async ({ client }) => {
                const createdApplicant = await applicantsRepository.createApplicant(applicantWithStatus, {
                    client,
                    actorUserId: options.actorUserId || null,
                    minAccess: options.minAccess
                });

                if (!createdApplicant) {
                    throw new HttpError('Applicant not found or access denied', 404);
                }

                await statusRepository.createStatusHistory({
                    applicant_id: createdApplicant.id,
                    status_name: 'submitted',
                    changed_by: null,
                    notes: 'Přihláška byla automaticky odeslána'
                }, { client });

                const job = await jobsRepository.getJobById(createdApplicant.job_posting_id, { client });

                return {
                    applicant: createdApplicant,
                    job
                };
            },
            enqueue: async ({ client, writeResult: result }) => {
                await queueRoleNotification({
                    client,
                    dedupeKey: `notification.applicant.created.${result.applicant.id}`,
                    aggregateId: result.applicant.id,
                    organizationId: result.applicant.organization_id,
                    type: 'job.application_received',
                    title: 'Nová přihláška',
                    body: `${result.applicant.name} ${result.applicant.surname} se přihlásil/a na pracovní pozici`,
                    data: {
                        applicantId: result.applicant.id
                    },
                    roleName: 'HR'
                });

                if (result.job) {
                    await queueApplicationReceivedEmail({
                        client,
                        applicant: result.applicant,
                        job: result.job
                    });
                }
            }
        });
        const { applicant } = writeResult;

        emitAudit({
            category: 'applicant',
            action: 'applicant.create',
            status: 'success',
            resourceType: 'applicant',
            resourceId: applicant.id,
            organizationId: applicant.organization_id || null,
            beforeState: null,
            afterState: createSnapshot(applicant, APPLICANT_AUDIT_FIELDS),
            metadata: {
                initialStatus: 'submitted',
                jobPostingId: applicant.job_posting_id || null
            }
        });

        return applicant;
    };

    return {
        createApplicant
    };
};
