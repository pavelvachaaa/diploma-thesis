/**
 * Inbound facade — other modules call this port to send emails.
 * through explicit *Port tokens, not direct *Service injection.
 *
 * @typedef {Object} EmailSenderAccessPort
 * @property {(payload: Object) => Promise<Object>} sendWelcomeEmail
 * @property {(payload: Object) => Promise<Object>} sendNotificationEmail
 * @property {(payload: Object) => Promise<Object>} sendCustomEmail
 * @property {(payload: Object) => Promise<Object>} sendApplicantEmail
 * @property {(payload: Object) => Promise<Object>} sendInterviewInvitation
 * @property {(payload: Object) => Promise<Object>} sendApplicationReceivedEmail
 * @property {(payload: Object) => Promise<Object>} sendApplicationUnderReviewEmail
 * @property {(payload: Object) => Promise<Object>} sendRejectionEmail
 * @property {(email: string) => Promise<Object>} sendTestEmail
 * @property {() => Promise<Object>} getHealthStatus
 */

module.exports = Object.freeze({
    portName: 'EmailSenderAccessPort',
    methods: Object.freeze([
        'sendWelcomeEmail',
        'sendNotificationEmail',
        'sendCustomEmail',
        'sendApplicantEmail',
        'sendInterviewInvitation',
        'sendApplicationReceivedEmail',
        'sendApplicationUnderReviewEmail',
        'sendRejectionEmail',
        'sendTestEmail',
        'getHealthStatus'
    ])
});
