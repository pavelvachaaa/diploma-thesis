const HttpError = require('@shared/errors/HttpError');

module.exports = ({
    applicantsRepository,
    statusRepository,
    jobsRepository,
    runWriteWithOutbox,
    statusOutbox,
    auditSupport,
    STATUS_LABELS_CS
}) => {
    const updateApplicantStatus = async (applicantId, statusName, changedBy = null, notes = null, options = {}) => {
        const { writeResult } = await runWriteWithOutbox({
            label: 'applicants.updateApplicantStatus',
            write: async ({ client }) => {
                const before = await applicantsRepository.getApplicantById(applicantId, {
                    client,
                    actorUserId: options.actorUserId || null,
                    minAccess: options.minAccess || 'write'
                });
                const status = await statusRepository.getStatusByName(statusName, { client });

                if (!before) {
                    throw new HttpError('Applicant not found or access denied', 404);
                }

                if (!status) {
                    throw new Error(`Status '${statusName}' not found`);
                }

                const updated = await applicantsRepository.updateApplicantStatus(applicantId, statusName, {
                    client,
                    actorUserId: options.actorUserId || null,
                    minAccess: options.minAccess || 'write'
                });
                const createdStatusHistory = await statusRepository.createStatusHistory({
                    applicant_id: applicantId,
                    status_name: statusName,
                    changed_by: changedBy,
                    notes
                }, { client });

                let refreshedApplicant = null;
                let job = null;
                if (statusName === 'under_review' || statusName === 'rejected') {
                    refreshedApplicant = await applicantsRepository.getApplicantById(applicantId, { client });
                    job = await jobsRepository.getJobById(refreshedApplicant?.job_posting_id, { client });
                }

                return {
                    beforeApplicant: before,
                    updatedApplicant: updated,
                    statusHistory: createdStatusHistory,
                    refreshedApplicant,
                    job
                };
            },
            enqueue: async ({ client, writeResult: result }) => {
                await statusOutbox.queueRoleNotification({
                    client,
                    dedupeKey: `notification.applicant.status.${result.statusHistory.id || `${applicantId}.${statusName}`}`,
                    aggregateId: applicantId,
                    organizationId: result.updatedApplicant.organization_id,
                    type: 'applicant.status_changed',
                    title: 'Změna stavu uchazeče',
                    body: `Stav uchazeče ${result.updatedApplicant.name} ${result.updatedApplicant.surname} změněn na: ${STATUS_LABELS_CS[statusName] || statusName}`,
                    data: {
                        applicantId
                    },
                    roleName: 'HR'
                });

                if (statusName === 'under_review') {
                    await statusOutbox.queueApplicationUnderReviewEmail({
                        client,
                        applicant: result.refreshedApplicant,
                        job: result.job
                    });
                }

                if (statusName === 'rejected') {
                    await statusOutbox.queueRejectionEmail({
                        client,
                        applicant: result.refreshedApplicant,
                        job: result.job,
                        notes
                    });
                }
            }
        });
        const { beforeApplicant, updatedApplicant, statusHistory } = writeResult;

        const beforeState = auditSupport.createSnapshot(beforeApplicant, auditSupport.APPLICANT_AUDIT_FIELDS);
        const afterState = auditSupport.createSnapshot(updatedApplicant, auditSupport.APPLICANT_AUDIT_FIELDS);

        auditSupport.emitAudit({
            category: 'applicant',
            action: 'applicant.status.update',
            status: 'success',
            resourceType: 'applicant',
            resourceId: applicantId,
            organizationId: updatedApplicant?.organization_id || beforeApplicant?.organization_id || null,
            beforeState,
            afterState,
            metadata: {
                statusHistoryId: statusHistory?.id || null,
                changedBy: changedBy || null,
                notes: notes || null,
                changedFields: auditSupport.getChangedFields(beforeState, afterState)
            }
        });

        return updatedApplicant;
    };

    return {
        updateApplicantStatus
    };
};
