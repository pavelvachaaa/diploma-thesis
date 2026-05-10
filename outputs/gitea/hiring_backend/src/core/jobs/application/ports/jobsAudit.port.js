module.exports = Object.freeze({
    portName: 'JobsAuditPort',
    methods: Object.freeze([
        'recordJobCreated',
        'recordJobUpdated',
        'recordJobDeleted',
        'recordJobDuplicated'
    ])
});
