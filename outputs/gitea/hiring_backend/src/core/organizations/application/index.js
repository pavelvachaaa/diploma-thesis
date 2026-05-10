const { buildSanitizedOrganizationPayload } = require('@core/organizations/domain/organizationPayload');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const { attachPublicObjectUrl, attachPublicObjectUrls } = require('@shared/file/publicObjectUrl');

const CONTACT_PHOTO_URL_OPTIONS = {
    urlField: 'contact_photo_url',
    bucketField: '_contact_photo_bucket',
    objectKeyField: '_contact_photo_object_key',
    presenceField: 'contact_photo_file_id'
};

const presentOrganization = (organization) => attachPublicObjectUrl(organization, CONTACT_PHOTO_URL_OPTIONS);

const presentOrganizationCollection = (result) => {
    if (!result || typeof result !== 'object') {
        return result;
    }

    return {
        ...result,
        data: attachPublicObjectUrls(result.data, CONTACT_PHOTO_URL_OPTIONS)
    };
};

module.exports = ({
    organizationStorePort,
    organizationFilePort,
    organizationFileGcPort,
    organizationRebacSyncPort,
    organizationUnitOfWorkPort
}) => {
    const requireSuperAdmin = (actorRole) => {
        if (actorRole !== 'super_admin') {
            throw new ApplicationError('Only super administrators can mutate organizations', {
                code: ErrorCode.FORBIDDEN
            });
        }
    };

    const getAll = async (options) => {
        const result = await organizationStorePort.getAll(options);
        return presentOrganizationCollection(result);
    };

    const getById = async (id, options = {}) => {
        const org = await organizationStorePort.getById(id, options);
        return org ? presentOrganization(org) : null;
    };

    const create = async (data, options = {}) => {
        const { actorRole } = options;
        requireSuperAdmin(actorRole);
        const sanitized = buildSanitizedOrganizationPayload(data);

        return organizationUnitOfWorkPort.runInTransaction(async (client) => {
            const organization = await organizationStorePort.create(sanitized, { client });

            await organizationRebacSyncPort.enqueueOrganizationSync(organization, { client });

            return presentOrganization(organization);
        }, { label: 'organizations.create' });
    };

    const update = async (id, data, options = {}) => {
        const { actorRole, ...storeOptions } = options;
        requireSuperAdmin(actorRole);
        const sanitized = buildSanitizedOrganizationPayload(data, { partial: true });
        const updated = await organizationStorePort.update(id, sanitized, storeOptions);
        return updated ? presentOrganization(updated) : null;
    };

    const getContactPhotoFileInfo = async (id, options = {}) => {
        const organization = await organizationStorePort.getById(id, options);
        if (!organization?.contact_photo_file_id) {
            return null;
        }

        return organizationFilePort.resolveForDownload(organization.contact_photo_file_id);
    };

    const uploadContactPhoto = async (organizationId, file, uploadedBy, options = {}) => {
        const { actorRole, ...storeOptions } = options;
        requireSuperAdmin(actorRole);
        const current = await organizationStorePort.getById(organizationId, storeOptions);
        if (!current) {
            return null;
        }

        try {
            return await organizationUnitOfWorkPort.runInTransaction(async (client) => {
                const fileRecord = await organizationFilePort.createFileRecord({
                    bucket: file.bucket,
                    objectKey: file.key,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    originalFilename: file.originalname,
                    checksumSha256: file.checksum_sha256 || null,
                    organizationId,
                    uploadedBy,
                    sourceModule: 'organizations.contactPhoto',
                    metadata: {
                        context: 'organization_contact_photo',
                        organizationId
                    }
                }, { client });

                const updated = await organizationStorePort.updateContactPhoto(organizationId, fileRecord.id, {
                    client,
                    actorUserId: storeOptions.actorUserId || null,
                    minAccess: storeOptions.minAccess || 'admin'
                });
                if (!updated) {
                    return null;
                }

                if (current.contact_photo_file_id && current.contact_photo_file_id !== fileRecord.id) {
                    const retained = await organizationFilePort.markRetained(current.contact_photo_file_id, {
                        client,
                        metadata: {
                            replaced_by_organization_id: organizationId
                        }
                    });

                    if (retained) {
                        await organizationFileGcPort.enqueueFileGcDelete({
                            fileId: retained.id,
                            organizationId,
                            availableAt: retained.retention_until,
                            reason: 'retention_gc',
                            sourceModule: 'organizations.uploadContactPhoto'
                        }, { client });
                    }
                }

                const result = await organizationStorePort.getById(organizationId, {
                    client,
                    actorUserId: storeOptions.actorUserId || null,
                    minAccess: storeOptions.minAccess || 'admin'
                });
                return result ? presentOrganization(result) : null;
            }, { label: 'organizations.uploadContactPhoto' });
        } catch (error) {
            if (file?.bucket && file?.key) {
                await organizationFileGcPort.enqueueFileGcDelete({
                    bucket: file.bucket,
                    objectKey: file.key,
                    organizationId,
                    reason: 'transaction_rollback_cleanup',
                    sourceModule: 'organizations.uploadContactPhoto'
                });
            }

            throw error;
        }
    };

    const deleteContactPhoto = async (organizationId, options = {}) => {
        const { actorRole, ...storeOptions } = options;
        requireSuperAdmin(actorRole);
        return organizationUnitOfWorkPort.runInTransaction(async (client) => {
            const current = await organizationStorePort.getById(organizationId, {
                client,
                actorUserId: storeOptions.actorUserId || null,
                minAccess: storeOptions.minAccess || 'admin'
            });
            if (!current) {
                return null;
            }

            const updated = await organizationStorePort.clearContactPhoto(organizationId, {
                client,
                actorUserId: storeOptions.actorUserId || null,
                minAccess: storeOptions.minAccess || 'admin'
            });
            if (!updated) {
                return null;
            }

            if (current.contact_photo_file_id) {
                const retained = await organizationFilePort.markRetained(current.contact_photo_file_id, {
                    client,
                    metadata: {
                        removed_from: 'organizations.contact_photo_file_id',
                        removed_by_organization_id: organizationId
                    }
                });

                if (retained) {
                    await organizationFileGcPort.enqueueFileGcDelete({
                        fileId: retained.id,
                        organizationId,
                        availableAt: retained.retention_until,
                        reason: 'retention_gc',
                        sourceModule: 'organizations.deleteContactPhoto'
                    }, { client });
                }
            }

            return presentOrganization(updated);
        }, { label: 'organizations.deleteContactPhoto' });
    };

    const deleteOne = async (id, options = {}) => {
        const { actorRole, ...storeOptions } = options;
        requireSuperAdmin(actorRole);
        return organizationUnitOfWorkPort.runInTransaction(async (client) => {
            const current = await organizationStorePort.getById(id, {
                client,
                actorUserId: storeOptions.actorUserId || null,
                minAccess: storeOptions.minAccess || 'admin'
            });
            if (!current) {
                return null;
            }

            const deleted = await organizationStorePort.delete(id, {
                client,
                actorUserId: storeOptions.actorUserId || null,
                minAccess: storeOptions.minAccess || 'admin'
            });
            if (!deleted) {
                return null;
            }

            if (current.contact_photo_file_id) {
                const retained = await organizationFilePort.markRetained(current.contact_photo_file_id, {
                    client,
                    metadata: {
                        removed_from: 'organizations',
                        removed_by_organization_id: id
                    }
                });

                if (retained) {
                    await organizationFileGcPort.enqueueFileGcDelete({
                        fileId: retained.id,
                        organizationId: id,
                        availableAt: retained.retention_until,
                        reason: 'retention_gc',
                        sourceModule: 'organizations.delete'
                    }, { client });
                }
            }

            return deleted;
        }, { label: 'organizations.delete' });
    };

    return {
        getAll,
        getById,
        create,
        update,
        getContactPhotoFileInfo,
        uploadContactPhoto,
        deleteContactPhoto,
        delete: deleteOne
    };
};
