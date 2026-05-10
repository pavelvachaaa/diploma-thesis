const {
    UPLOAD_CONTEXTS,
    CONTEXT_BUCKETS,
    getBucketForContext,
    getFileType,
    formatFileSize,
    validateContext,
    getUploadConfig,
    getExtensionFromMimeType
} = require('./uploadConfig');
const createUploadMiddlewareBuilders = require('./uploadMiddlewareBuilders');

module.exports = ({ logger, storageService }) => {
    const {
        createUploadMiddleware,
        createMultipleUploadMiddleware,
        createFieldsUploadMiddleware
    } = createUploadMiddlewareBuilders({
        logger,
        storageService,
        getUploadConfig,
        getBucketForContext,
        getExtensionFromMimeType
    });

    return {
        UPLOAD_CONTEXTS,
        CONTEXT_BUCKETS,
        createUploadMiddleware,
        createMultipleUploadMiddleware,
        createFieldsUploadMiddleware,
        getBucketForContext,
        getFileType,
        formatFileSize,
        validateContext,
        getUploadConfig,
        getExtensionFromMimeType
    };
};
