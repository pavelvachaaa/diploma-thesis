/**
 * Domain Events for the Contact Inquiry bounded context.
 *
 * Each factory returns a plain, frozen object describing what happened
 * in business terms. There are no audit infrastructure fields here
 * (no `category`, `action`, `captureState`, `resourceType`) — those are
 * presentation concerns that belong in the outbound adapter (auditTrail.js).
 */

/**
 * Fired when a member of the public successfully submits a contact inquiry.
 *
 * @param {{ inquiryId: string, email: string, hasPhone: boolean, messageLength: number }} data
 */
const inquirySubmitted = ({ inquiryId, email, hasPhone, messageLength }) =>
    Object.freeze({
        type: 'ContactInquiry.Submitted',
        inquiryId,
        email,
        hasPhone: Boolean(hasPhone),
        messageLength: Number(messageLength)
    });

/**
 * Fired when an admin replies to a contact inquiry.
 *
 * @param {{ inquiryId: string, actorUserId: string|null, actorEmail: string|null, inquiryEmail: string, isFirstReply: boolean, subject: string, replyLength: number }} data
 */
const inquiryReplied = ({ inquiryId, actorUserId, actorEmail, inquiryEmail, isFirstReply, subject, replyLength }) =>
    Object.freeze({
        type: 'ContactInquiry.Replied',
        inquiryId,
        actorUserId: actorUserId || null,
        actorEmail: actorEmail || null,
        inquiryEmail,
        isFirstReply: Boolean(isFirstReply),
        subject,
        replyLength: Number(replyLength)
    });

module.exports = { inquirySubmitted, inquiryReplied };
