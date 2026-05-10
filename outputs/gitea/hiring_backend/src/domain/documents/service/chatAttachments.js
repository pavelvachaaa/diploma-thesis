module.exports = ({ documentsRepository, fileGateway, logger }) => {
    const getChatAttachmentForDownload = async (attachmentId) => {
        return documentsRepository.getChatAttachmentForDownload(attachmentId);
    };

    const storeChatAttachment = async (messageId, fileData) => {
        const fileRecord = await fileGateway.createFileRecord({
            bucket: fileData.bucket,
            objectKey: fileData.key,
            mimeType: fileData.mimetype,
            sizeBytes: fileData.size,
            originalFilename: fileData.originalName,
            checksumSha256: fileData.checksum_sha256 || null,
            sourceModule: 'chat',
            metadata: {
                messageId
            }
        });

        const result = await documentsRepository.insertChatAttachment(messageId, {
            fileId: fileRecord.id
        });

        logger.info('Chat attachment stored successfully', {
            messageId,
            originalName: fileData.originalName,
            key: fileData.key,
            size: fileData.size
        });

        return result;
    };

    return {
        getChatAttachmentForDownload,
        storeChatAttachment
    };
};
