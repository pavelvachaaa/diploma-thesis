module.exports = ({ sideEffectOutboxService }) => {
    const enqueueApplicantDocumentUploaded = async ({
        client,
        organizationId,
        applicantId,
        originalName,
        attachmentId
    }) => {
        if (!organizationId) {
            return null;
        }

        return sideEffectOutboxService.enqueueRoleNotification({
            type: 'document.uploaded',
            organizationId,
            title: 'Nahraný dokument',
            body: `Uchazeč nahrál přílohu „${originalName}"`,
            data: {
                applicantId,
                filename: originalName,
                attachmentId,
                documentType: 'applicant-attachment'
            },
            actionUrl: `/admin/applicants/${applicantId}`,
            roleName: 'HR'
        }, {
            client,
            aggregateType: 'applicant_attachment',
            aggregateId: attachmentId,
            organizationId,
            idempotencyKey: `document.uploaded.applicant.${attachmentId}`
        });
    };

    return {
        enqueueApplicantDocumentUploaded
    };
};
