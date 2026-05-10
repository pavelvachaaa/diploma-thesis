/**
 * @typedef {Object} QualificationAuditPort
 * @property {(event: Object) => Promise<void>|void} recordLookup
 */

module.exports = Object.freeze({
    portName: 'QualificationAuditPort',
    methods: Object.freeze([
        'recordLookup'
    ])
});
