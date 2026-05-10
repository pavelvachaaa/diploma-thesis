/**
 * @typedef {Object} ContactInquiryAuditPort
 * @property {(event: Object) => Promise<void|null>} recordInquirySubmitted
 * @property {(event: Object) => Promise<void|null>} recordInquiryReplied
 */

module.exports = Object.freeze({
    portName: 'ContactInquiryAuditPort',
    methods: Object.freeze([
        'recordInquirySubmitted',
        'recordInquiryReplied'
    ])
});
