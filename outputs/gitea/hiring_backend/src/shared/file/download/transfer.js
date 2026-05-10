module.exports = ({
    logger,
    storageService,
    detectBucketFromKey,
    resolveOriginalName,
    buildContentDispositionHeader,
    emitSeaweedReadAudit,
    resolveErrorStatusCode
}) => {
    const applyResponseSecurityHeaders = (res) => {
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
    };

    const sendFile = async ({ mode, res, fileInfo, user = null, context = 'file', eventAudit = {} }) => {
        if (!fileInfo.file_path) {
            emitSeaweedReadAudit({
                mode,
                fileInfo,
                context,
                status: 'failure',
                statusCode: 404,
                error: new Error('Missing file_path'),
                eventAudit
            });

            return res.status(404).json({ message: 'File not found on server' });
        }

        if (user) {
            logger.info(`File ${mode} requested`, {
                userId: user.id,
                filePath: fileInfo.file_path,
                context
            });
        }

        applyResponseSecurityHeaders(res);

        try {
            const bucket = fileInfo.bucket || detectBucketFromKey(fileInfo.file_path);
            const response = await storageService.download(bucket, fileInfo.file_path);
            const fileName = resolveOriginalName(fileInfo);
            const contentType = fileInfo.mime_type || response.ContentType || 'application/octet-stream';
            const contentLength = response.ContentLength || null;
            const disposition = mode === 'stream' ? 'inline' : 'attachment';

            res.setHeader('Content-Disposition', buildContentDispositionHeader(fileName, disposition));
            res.setHeader('Content-Type', contentType);
            if (contentLength) {
                res.setHeader('Content-Length', contentLength);
            }

            emitSeaweedReadAudit({
                mode,
                fileInfo,
                context,
                bucket,
                status: 'success',
                statusCode: 200,
                eventAudit: {
                    ...eventAudit,
                    metadata: {
                        ...(eventAudit.metadata || {}),
                        contentType,
                        contentLength
                    }
                }
            });

            response.Body.pipe(res);
        } catch (error) {
            logger.error(`S3 ${mode} failed`, {
                context,
                error: error.message,
                file_path: fileInfo.file_path || null,
                user_id: user?.id || null
            });

            emitSeaweedReadAudit({
                mode,
                fileInfo,
                context,
                bucket: fileInfo.bucket || detectBucketFromKey(fileInfo.file_path),
                status: 'failure',
                statusCode: resolveErrorStatusCode(error),
                error,
                eventAudit
            });

            if (!res.headersSent) {
                return res.status(500).json({ message: `Error ${mode}ing file` });
            }
        }

        return undefined;
    };

    return {
        downloadFile: (res, fileInfo, user = null, context = 'file', eventAudit = {}) =>
            sendFile({ mode: 'download', res, fileInfo, user, context, eventAudit }),
        streamFile: (res, fileInfo, user = null, context = 'file', eventAudit = {}) =>
            sendFile({ mode: 'stream', res, fileInfo, user, context, eventAudit })
    };
};
