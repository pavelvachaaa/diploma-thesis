module.exports = ({
    jobSeekersStorePort,
    jobSeekersFilePort,
    jobSeekersFileGcPort,
    logger
}) => async (id, options = {}) => (
    jobSeekersStorePort.withTransaction(async (client) => {
        const deleteMetadata = await jobSeekersStorePort.getDeleteMetadata(id, {
            client,
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || null
        });
        if (!deleteMetadata) {
            return null;
        }

        const deleted = await jobSeekersStorePort.deleteJobSeeker(id, {
            client,
            actorUserId: options.actorUserId || null,
            minAccess: options.minAccess || null
        });
        if (!deleted) {
            return null;
        }

        const primaryOrganizationId = Array.isArray(deleteMetadata.organization_ids)
            ? (deleteMetadata.organization_ids[0] || null)
            : null;

        const fileIds = [
            deleteMetadata.cv_file_id,
            ...(Array.isArray(deleteMetadata.attachment_file_ids) ? deleteMetadata.attachment_file_ids : [])
        ].filter(Boolean);

        for (const fileId of [...new Set(fileIds)]) {
            const retained = await jobSeekersFilePort.markRetained(fileId, {
                client,
                metadata: {
                    removed_by: 'job_seekers.delete'
                }
            });

            if (retained) {
                await jobSeekersFileGcPort.enqueueDelete({
                    fileId: retained.id,
                    organizationId: primaryOrganizationId,
                    availableAt: retained.retention_until,
                    reason: 'retention_gc',
                    sourceModule: 'jobSeekers.delete'
                }, { client });
            }
        }

        logger?.info?.('Job seeker deleted', {
            jobSeekerId: id,
            organizationId: primaryOrganizationId,
            cleanedFileCount: fileIds.length
        });

        return {
            ...deleted,
            organization_ids: deleteMetadata.organization_ids,
            attachment_file_ids: deleteMetadata.attachment_file_ids
        };
    })
);
