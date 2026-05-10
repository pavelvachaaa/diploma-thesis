const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const ContactInquiryEvents = require('@core/contactInquiries/domain/events');

const normalizeText = (v) => (typeof v === 'string' ? v.trim() : '');

module.exports = ({
    contactInquiryStorePort,
    contactInquiryReplyEmailPort,
    contactInquiryAuditPort
}) => {
    return async (id, { subject, message, senderUser } = {}) => {
        const normalizedSubject = normalizeText(subject);
        const normalizedMessage = normalizeText(message);

        if (!normalizedSubject) {
            throw new ApplicationError('Subject is required', { code: ErrorCode.VALIDATION_ERROR });
        }
        if (!normalizedMessage) {
            throw new ApplicationError('Message is required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const inquiry = await contactInquiryStorePort.getInquiryById(id);
        if (!inquiry) {
            throw new ApplicationError('Contact inquiry not found', { code: ErrorCode.NOT_FOUND });
        }

        const emailResult = await contactInquiryReplyEmailPort.sendReplyEmail({
            to: inquiry.email,
            subject: normalizedSubject,
            message: normalizedMessage,
            recipientName: inquiry.name,
            senderUser: senderUser || null
        });

        if (!emailResult?.success) {
            throw new ApplicationError(emailResult?.error || 'Unknown email dispatch error', {
                code: ErrorCode.INTERNAL_ERROR
            });
        }

        const updatedInquiry = await contactInquiryStorePort.markInquiryReplied(id, {
            repliedAt: new Date().toISOString(),
            repliedByUserId: senderUser?.id || null,
            replySubject: normalizedSubject,
            replyMessage: normalizedMessage
        });

        await contactInquiryAuditPort.recordInquiryReplied(
            ContactInquiryEvents.inquiryReplied({
                inquiryId: id,
                actorUserId: senderUser?.id || null,
                actorEmail: senderUser?.email || null,
                inquiryEmail: inquiry.email,
                isFirstReply: !inquiry.last_replied_at,
                subject: normalizedSubject,
                replyLength: normalizedMessage.length
            })
        );

        return updatedInquiry;
    };
};
