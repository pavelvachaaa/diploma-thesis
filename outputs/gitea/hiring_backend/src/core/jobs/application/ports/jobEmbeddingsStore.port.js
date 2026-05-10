module.exports = Object.freeze({
    portName: 'JobEmbeddingsStorePort',
    methods: Object.freeze([
        'getByJobId',
        'getByJobIdWithEmbedding',
        'getValidCachedEmbedding',
        'createOrUpdatePending',
        'updateStatusProcessing',
        'saveCompletedResult',
        'saveFailedResult',
        'deleteByJobId',
        'generateContentHash'
    ])
});
