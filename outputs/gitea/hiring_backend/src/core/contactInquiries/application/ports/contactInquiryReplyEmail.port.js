/**
 * @typedef {Object} ContactInquiryReplyEmailPort
 * @property {(payload: {
 *   to: string,
 *   subject: string,
 *   message: string,
 *   recipientName?: string|null,
 *   senderUser?: Object|null
 * }) => Promise<Object>} sendReplyEmail
 */

module.exports = Object.freeze({
    portName: 'ContactInquiryReplyEmailPort',
    methods: Object.freeze([
        'sendReplyEmail'
    ])
});
