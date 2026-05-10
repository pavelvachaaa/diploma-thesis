module.exports = ({ sideEffectOutboxService }) => {
    if (!sideEffectOutboxService?.enqueueRoleNotification) {
        throw new Error('sideEffectOutboxService.enqueueRoleNotification dependency is required');
    }

    const queueUserDocumentUploadedRoleNotification = async ({
        client,
        organizationId,
        userId,
        documentId,
        filename,
        userDocumentId,
        fileKey
    }) => {
        if (!organizationId) {
            return null;
        }

        return sideEffectOutboxService.enqueueRoleNotification({
            type: 'document.uploaded',
            organizationId,
            title: 'Nahraný dokument',
            body: `Zaměstnanec nahrál dokument „${filename}"`,
            data: {
                userId,
                documentId,
                filename,
                userDocumentId,
                documentType: 'user-document'
            },
            actionUrl: `/admin/employees/${userId}/documents`,
            roleName: 'HR'
        }, {
            client,
            aggregateType: 'user_document',
            aggregateId: userDocumentId,
            organizationId,
            idempotencyKey: `document.uploaded.user_document.${userId}.${documentId}.${fileKey}`
        });
    };

    return {
        queueUserDocumentUploadedRoleNotification
    };
};
