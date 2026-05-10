const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');

module.exports = ({
    onboardingDocumentsRepository,
    sideEffectOutboxService,
    fileGateway,
    detectBucketFromKey,
    membershipAccessPort
}) => {
    const getAll = async (options) => onboardingDocumentsRepository.getAll(options);
    const getById = async (id, options = {}) => onboardingDocumentsRepository.getById(id, options);
    const getByOrganization = async (organizationId, options = {}) =>
        onboardingDocumentsRepository.getByOrganization(organizationId, options);

    const create = async (data, options = {}) => {
        if (!data.applies_to_all_organizations) {
            await membershipAccessPort.ensureMembershipCreateAccess({
                actorUserId: options.actorUserId || null,
                organizationId: data.organization_id,
                allowedRoles: ['hr', 'admin']
            });
        } else {
            await membershipAccessPort.ensureMembershipCreateAccess({
                actorUserId: options.actorUserId || null,
                organizationId: data.organization_id,
                allowedRoles: ['admin']
            });
        }

        if (!data?.file_path) {
            return onboardingDocumentsRepository.create(data, options);
        }

        try {
            const templateFile = await fileGateway.createFileRecord({
                bucket: data.bucket || detectBucketFromKey(data.file_path, 'templates'),
                objectKey: data.file_path,
                mimeType: data.mime_type || null,
                sizeBytes: data.file_size || null,
                originalFilename: data.file_name || null,
                checksumSha256: data.checksum_sha256 || null,
                organizationId: data.organization_id || null,
                sourceModule: 'onboarding_templates',
                metadata: {
                    context: 'onboarding_document_template'
                }
            });

            const normalizedData = {
                ...data,
                template_file_id: templateFile.id
            };

            delete normalizedData.file_name;
            delete normalizedData.file_path;
            delete normalizedData.mime_type;
            delete normalizedData.file_size;

            return onboardingDocumentsRepository.create(normalizedData, options);
        } catch (error) {
            if (data?.file_path) {
                await enqueueFileGcDelete({
                    sideEffectOutboxService,
                    bucket: data.bucket || detectBucketFromKey(data.file_path, 'templates'),
                    objectKey: data.file_path,
                    organizationId: data.organization_id || null,
                    reason: 'transaction_rollback_cleanup',
                    sourceModule: 'onboardingDocuments.create'
                });
            }
            throw error;
        }
    };

    const update = async (id, data, options = {}) => {
        if (!data?.file_path) {
            return onboardingDocumentsRepository.update(id, data, options);
        }

        const current = await onboardingDocumentsRepository.getById(id, {
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || 'write'
        });
        if (!current) {
            return null;
        }

        try {
            const templateFile = await fileGateway.createFileRecord({
                bucket: data.bucket || detectBucketFromKey(data.file_path, 'templates'),
                objectKey: data.file_path,
                mimeType: data.mime_type || null,
                sizeBytes: data.file_size || null,
                originalFilename: data.file_name || null,
                checksumSha256: data.checksum_sha256 || null,
                organizationId: current.organization_id || data.organization_id || null,
                sourceModule: 'onboarding_templates',
                metadata: {
                    context: 'onboarding_document_template'
                }
            });

            const normalizedData = {
                ...data,
                template_file_id: templateFile.id
            };
            delete normalizedData.file_name;
            delete normalizedData.file_path;
            delete normalizedData.mime_type;
            delete normalizedData.file_size;

            const updated = await onboardingDocumentsRepository.update(id, normalizedData, options);
            if (!updated) {
                return null;
            }

            if (current.template_file_id && current.template_file_id !== templateFile.id) {
                const retained = await fileGateway.markRetained(current.template_file_id, {
                    metadata: {
                        replaced_by_document_id: id
                    }
                });

                if (retained) {
                    await enqueueFileGcDelete({
                        sideEffectOutboxService,
                        fileId: retained.id,
                        organizationId: current.organization_id || null,
                        availableAt: retained.retention_until,
                        reason: 'retention_gc',
                        sourceModule: 'onboardingDocuments.updateTemplate'
                    });
                }
            }

            return updated;
        } catch (error) {
            if (data?.file_path) {
                await enqueueFileGcDelete({
                    sideEffectOutboxService,
                    bucket: data.bucket || detectBucketFromKey(data.file_path, 'templates'),
                    objectKey: data.file_path,
                    organizationId: current.organization_id || data.organization_id || null,
                    reason: 'transaction_rollback_cleanup',
                    sourceModule: 'onboardingDocuments.updateTemplate'
                });
            }
            throw error;
        }
    };

    const deleteOne = async (id, options = {}) => {
        return onboardingDocumentsRepository.withTransaction(async (client) => {
            const row = await onboardingDocumentsRepository.delete(id, {
                ...options,
                client
            });
            if (!row) {
                return null;
            }

            if (row.template_file_id) {
                const retained = await fileGateway.markRetained(row.template_file_id, {
                    client,
                    metadata: {
                        removed_by_document_id: id
                    }
                });

                if (retained) {
                    await enqueueFileGcDelete({
                        sideEffectOutboxService,
                        fileId: retained.id,
                        organizationId: row.organization_id || null,
                        availableAt: retained.retention_until,
                        reason: 'retention_gc',
                        sourceModule: 'onboardingDocuments.delete'
                    }, { client });
                }
            }

            return row;
        });
    };

    return {
        getAll,
        getById,
        getByOrganization,
        create,
        update,
        delete: deleteOne
    };
};
