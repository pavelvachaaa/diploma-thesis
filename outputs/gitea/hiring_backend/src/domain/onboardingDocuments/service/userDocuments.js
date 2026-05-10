const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');

module.exports = ({
    onboardingDocumentsRepository,
    onboardingDocumentsEvents,
    sideEffectOutboxService,
    fileGateway,
    detectBucketFromKey,
    logger
}) => {
    const getUserDocuments = async (userId) => onboardingDocumentsRepository.getUserDocuments(userId);
    const getUserDocumentById = async (userId, userDocumentId) =>
        onboardingDocumentsRepository.getUserDocumentById(userId, userDocumentId);
    const getUserDocumentForDownload = async (userId, userDocumentId) =>
        onboardingDocumentsRepository.getUserDocumentForDownload(userId, userDocumentId);
    const getEmployeeDocumentForDownload = async (employeeId, documentId, options = {}) =>
        onboardingDocumentsRepository.getEmployeeDocumentForDownload(employeeId, documentId, options);
    const getOnboardingTemplateForDownload = async (templateId, options = {}) =>
        onboardingDocumentsRepository.getOnboardingTemplateForDownload(templateId, options);
    const getOnboardingTemplateByFilename = async (templateFile) =>
        onboardingDocumentsRepository.getOnboardingTemplateByFilename(templateFile);

    const storeUserDocument = async (userId, documentId, fileData, options = {}) => {
        try {
            const transactionalResult = await onboardingDocumentsRepository.withTransaction(async (client) => {
                const organizationId = await onboardingDocumentsRepository.getUserOrganization(userId, { client });
                const fileRecord = await fileGateway.createFileRecord({
                    bucket: fileData.bucket || detectBucketFromKey(fileData.key, 'documents'),
                    objectKey: fileData.key,
                    mimeType: fileData.mimetype,
                    sizeBytes: fileData.size,
                    originalFilename: fileData.originalName,
                    checksumSha256: fileData.checksum_sha256 || null,
                    organizationId,
                    uploadedBy: userId,
                    sourceModule: 'user_documents',
                    metadata: {
                        userId,
                        documentId
                    }
                }, { client });

                const { document, oldFileId } = await onboardingDocumentsRepository.upsertUserDocument(
                    userId,
                    documentId,
                    {
                        fileId: fileRecord.id
                    },
                    { client }
                );

                await onboardingDocumentsEvents.queueUserDocumentUploadedRoleNotification({
                    client,
                    organizationId,
                    userId,
                    documentId,
                    filename: fileData.originalName,
                    userDocumentId: document.id,
                    fileKey: fileData.key
                });

                if (oldFileId && oldFileId !== fileRecord.id) {
                    const retained = await fileGateway.markRetained(oldFileId, {
                        client,
                        metadata: {
                            replaced_by_user_document_id: document.id
                        }
                    });

                    if (retained) {
                        await enqueueFileGcDelete({
                            sideEffectOutboxService,
                            fileId: retained.id,
                            organizationId,
                            availableAt: retained.retention_until,
                            reason: 'retention_gc',
                            sourceModule: 'onboardingDocuments.storeUserDocument'
                        }, { client });
                    }
                }

                return {
                    document,
                    oldFileId: oldFileId || null,
                    organizationId
                };
            });

            logger.info('User document stored successfully with outbox intent', {
                userId,
                documentId,
                filename: fileData.filename,
                originalName: fileData.originalName,
                key: fileData.key,
                size: fileData.size
            });

            return transactionalResult.document;
        } catch (error) {
            if (fileData.key) {
                try {
                    await enqueueFileGcDelete({
                        sideEffectOutboxService,
                        bucket: fileData.bucket || detectBucketFromKey(fileData.key, 'documents'),
                        objectKey: fileData.key,
                        reason: 'transaction_rollback_cleanup',
                        sourceModule: 'onboardingDocuments.storeUserDocument'
                    });
                    logger.info('Queued rollback cleanup for uploaded user document after transactional failure', {
                        key: fileData.key
                    });
                } catch (cleanupError) {
                    logger.error('Failed to queue rollback cleanup for uploaded user document', {
                        key: fileData.key,
                        error: cleanupError.message
                    });
                }
            }

            throw error;
        }
    };

    const updateUserDocumentStatus = async (userDocumentId, statusData, options = {}) => {
        const updated = await onboardingDocumentsRepository.updateUserDocumentStatus(userDocumentId, statusData, options);
        logger.info('User document status updated', {
            userDocumentId,
            status: statusData.status,
            reviewedBy: statusData.reviewed_by
        });
        return updated;
    };

    const deleteUserDocument = async (userId, userDocumentId) => {
        const { document, fileId, organizationId } = await onboardingDocumentsRepository.withTransaction(async (client) => {
            const deleted = await onboardingDocumentsRepository.deleteUserDocument(userId, userDocumentId, { client });
            const resolvedOrganizationId = await onboardingDocumentsRepository.getUserOrganization(userId, { client });

            if (deleted.fileId) {
                const retained = await fileGateway.markRetained(deleted.fileId, {
                    client,
                    metadata: {
                        removed_by_user_document_id: userDocumentId
                    }
                });

                if (retained) {
                    await enqueueFileGcDelete({
                        sideEffectOutboxService,
                        fileId: retained.id,
                        organizationId: resolvedOrganizationId,
                        availableAt: retained.retention_until,
                        reason: 'retention_gc',
                        sourceModule: 'onboardingDocuments.deleteUserDocument'
                    }, { client });
                }
            }

            return {
                document: deleted.document,
                fileId: deleted.fileId,
                organizationId: resolvedOrganizationId
            };
        });

        logger.info('User document deleted successfully', {
            userId,
            userDocumentId,
            fileId: fileId || null,
            organizationId: organizationId || null
        });

        return document;
    };

    return {
        getUserDocuments,
        getUserDocumentById,
        getUserDocumentForDownload,
        getEmployeeDocumentForDownload,
        getOnboardingTemplateForDownload,
        getOnboardingTemplateByFilename,
        storeUserDocument,
        updateUserDocumentStatus,
        deleteUserDocument
    };
};
