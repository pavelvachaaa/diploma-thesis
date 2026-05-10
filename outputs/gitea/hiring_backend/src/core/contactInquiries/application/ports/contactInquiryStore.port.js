/**
 * @typedef {Object} ContactInquiryStorePort
 * @property {(data: Object, options?: Object) => Promise<Object|null>} createInquiry
 * @property {(filters?: Object, options?: Object) => Promise<{ data: Object[], pagination: Object }>} getAllInquiries
 * @property {(id: string, options?: Object) => Promise<Object|null>} getInquiryById
 * @property {(id: string, replyMeta: Object, options?: Object) => Promise<Object|null>} markInquiryReplied
 */

module.exports = Object.freeze({
    portName: 'ContactInquiryStorePort',
    methods: Object.freeze([
        'createInquiry',
        'getAllInquiries',
        'getInquiryById',
        'markInquiryReplied'
    ])
});
