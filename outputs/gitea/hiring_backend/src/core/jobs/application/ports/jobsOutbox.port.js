module.exports = Object.freeze({
    portName: 'JobsOutboxPort',
    methods: Object.freeze([
        'enqueueJobSync',
        'enqueueUserRoleSync',
        'enqueueMembershipSync',
        'enqueueJobEmbeddingRequest'
    ])
});
