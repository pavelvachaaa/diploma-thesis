const {
    buildNormalizedTypeSet,
    createOutboxStrategy
} = require('./shared');

module.exports = ({
    storageService,
    fileGateway,
    createPermanentHandlerError,
    eventTypes
}) => {
    const isStorageNotFoundError = (error) => {
        const code = String(error?.code || '').toLowerCase();
        const name = String(error?.name || '').toLowerCase();
        const message = String(error?.message || '').toLowerCase();
        return code === 'nosuchkey'
            || code === 'notfound'
            || code === '404'
            || name.includes('nosuchkey')
            || message.includes('not found');
    };

    const dispatchFileGcDelete = async (event) => {
        if (!storageService?.delete) {
            throw createPermanentHandlerError('storageService.delete dependency is required for file GC events');
        }

        const payload = event.payload || {};
        const resolvedFile = payload.fileId && fileGateway?.getById
            ? await fileGateway.getById(payload.fileId)
            : null;

        const bucket = payload.bucket || resolvedFile?.bucket || null;
        const objectKey = payload.objectKey || resolvedFile?.object_key || null;

        if (!bucket || !objectKey) {
            throw createPermanentHandlerError('File GC payload is missing bucket/objectKey and could not be resolved');
        }

        try {
            await storageService.delete(bucket, objectKey);
        } catch (error) {
            if (!isStorageNotFoundError(error)) {
                if (payload.fileId && fileGateway?.markDeleteFailed) {
                    await fileGateway.markDeleteFailed(payload.fileId, error);
                }
                throw error;
            }
        }

        if (payload.fileId && fileGateway?.markDeleted) {
            await fileGateway.markDeleted(payload.fileId, {
                metadata: {
                    gc_deleted_at: new Date().toISOString(),
                    gc_outbox_id: event.id,
                    gc_reason: payload.reason || null
                }
            });
        }

        return {
            delivery: 'file.gc.delete',
            bucket,
            objectKey
        };
    };

    return [
        createOutboxStrategy({
            key: 'fileGcDelete',
            eventTypes: buildNormalizedTypeSet(eventTypes?.FILE_GC_DELETE, [
                'file.gc.delete.v1',
                'file.gc.delete'
            ]),
            prefixes: ['file.gc.delete'],
            dispatch: dispatchFileGcDelete
        })
    ];
};
