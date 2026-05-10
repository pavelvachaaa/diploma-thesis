module.exports = ({
    attachmentsRepository,
    applicantsRepository,
    emitAudit,
    createSnapshot,
    getChangedFields,
    ATTACHMENT_AUDIT_FIELDS
}) => {
    const updateAttachmentStatus = async (attachmentId, statusData, options = {}) => {
        const beforeAttachment = await attachmentsRepository.getById(attachmentId, options);
        const updatedAttachment = await attachmentsRepository.updateStatus(attachmentId, statusData, options);

        if (updatedAttachment) {
            const applicant = await applicantsRepository.getApplicantById(updatedAttachment.applicant_id);
            const beforeState = createSnapshot(beforeAttachment, ATTACHMENT_AUDIT_FIELDS);
            const afterState = createSnapshot(updatedAttachment, ATTACHMENT_AUDIT_FIELDS);

            emitAudit({
                category: 'applicant',
                action: 'applicant.attachment.status.update',
                status: 'success',
                resourceType: 'applicant',
                resourceId: updatedAttachment.applicant_id,
                organizationId: applicant?.organization_id || null,
                beforeState,
                afterState,
                metadata: {
                    attachmentId,
                    changedFields: getChangedFields(beforeState, afterState)
                }
            });
        }

        return updatedAttachment;
    };

    return {
        updateAttachmentStatus
    };
};
