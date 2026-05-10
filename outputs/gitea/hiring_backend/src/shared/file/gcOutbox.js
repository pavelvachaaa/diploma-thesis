const toIsoOrNull = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const enqueueFileGcDelete = async ({
    sideEffectOutboxService,
    fileId = null,
    bucket = null,
    objectKey = null,
    organizationId = null,
    requestId = null,
    availableAt = null,
    reason = 'retention_gc',
    sourceModule = 'files',
    maxAttempts,
    idempotencyKey = null
}, options = {}) => {
    if (!sideEffectOutboxService?.enqueue) {
        throw new Error('sideEffectOutboxService.enqueue dependency is required to enqueue file GC events');
    }

    const dedupe = idempotencyKey
        || (fileId
            ? `file.gc.delete.${fileId}.${toIsoOrNull(availableAt) || 'immediate'}`
            : `file.gc.delete.object.${bucket}.${objectKey}`);

    if (typeof sideEffectOutboxService.enqueueFileGcDelete === 'function') {
        return sideEffectOutboxService.enqueueFileGcDelete({
            fileId,
            bucket,
            objectKey,
            organizationId,
            reason,
            sourceModule
        }, {
            ...options,
            requestId,
            availableAt,
            maxAttempts,
            idempotencyKey: dedupe
        });
    }

    return sideEffectOutboxService.enqueue({
        eventType: sideEffectOutboxService.EVENT_TYPES?.FILE_GC_DELETE || 'file.gc.delete.v1',
        aggregateType: 'file',
        aggregateId: fileId,
        organizationId,
        requestId,
        maxAttempts,
        payload: {
            fileId,
            bucket,
            objectKey,
            reason,
            sourceModule
        }
    }, {
        ...options,
        idempotencyKey: dedupe,
        availableAt
    });
};

module.exports = {
    enqueueFileGcDelete
};
