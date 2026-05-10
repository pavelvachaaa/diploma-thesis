const {
    resolveResourceType,
    resolveResourceId
} = require('./keyResolution');

const resolveErrorStatusCode = (error) => {
    const statusFromSdk = error?.$metadata?.httpStatusCode;
    if (statusFromSdk === 404) return 404;
    if (error?.name === 'NoSuchKey' || error?.Code === 'NoSuchKey' || error?.code === 'NoSuchKey') {
        return 404;
    }
    return 500;
};

module.exports = ({ audit }) => {
    const emitSeaweedReadAudit = ({
        mode,
        fileInfo,
        context,
        bucket = null,
        status = 'success',
        statusCode = 200,
        error = null,
        eventAudit = {}
    }) => {
        const safeFileInfo = fileInfo || {};
        const resourceType = resolveResourceType(context, safeFileInfo.file_path, eventAudit);
        const resourceId = resolveResourceId(safeFileInfo, eventAudit);

        const metadata = {
            mode,
            context,
            bucket: bucket || null,
            filePath: safeFileInfo.file_path || null,
            fileName: safeFileInfo.original_name || safeFileInfo.original_filename || null,
            mimeType: safeFileInfo.mime_type || null,
            fileSize: safeFileInfo.file_size || null,
            ...(eventAudit.metadata || {})
        };

        void audit.writeAuditEvent({
            category: eventAudit.category || 'document',
            action: eventAudit.action || 'document.read',
            status,
            resourceType,
            resourceId,
            organizationId: eventAudit.organizationId || safeFileInfo.organization_id || null,
            target: safeFileInfo.file_path || null,
            statusCode,
            metadata,
            errorMessage: error ? error.message : null,
            captureState: false
        });
    };

    return {
        emitSeaweedReadAudit,
        resolveErrorStatusCode
    };
};
