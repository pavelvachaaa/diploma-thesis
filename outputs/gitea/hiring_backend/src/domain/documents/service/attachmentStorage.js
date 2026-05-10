module.exports = ({
    documentsRepository,
    fileGateway,
    detectBucketFromKey
}) => {
    const storeAttachmentRecord = async ({ applicantId, fileData }, { client }) => {
        const organizationId = await documentsRepository.getApplicantOrganizationId(applicantId, { client });

        const fileRecord = await fileGateway.createFileRecord({
            bucket: fileData.bucket || detectBucketFromKey(fileData.key),
            objectKey: fileData.key,
            mimeType: fileData.mimetype,
            sizeBytes: fileData.size,
            originalFilename: fileData.originalName,
            checksumSha256: fileData.checksum_sha256 || null,
            organizationId,
            sourceModule: 'applicants',
            metadata: {
                applicantId
            }
        }, { client });

        const attachment = await documentsRepository.insertApplicantAttachment({
            applicantId,
            fileId: fileRecord.id
        }, { client });

        return {
            attachment,
            organizationId
        };
    };

    return {
        storeAttachmentRecord
    };
};
