const ContactInquiry = require('@core/contactInquiries/domain/ContactInquiry');
const ContactInquiryEvents = require('@core/contactInquiries/domain/events');

module.exports = ({ contactInquiryStorePort, contactInquiryAuditPort }) => {
    return async (data = {}) => {
        const draft = ContactInquiry.create(data);

        const inquiry = await contactInquiryStorePort.createInquiry({
            name: draft.name,
            email: draft.email,
            phone: draft.phone,
            message: draft.message,
            gdpr_consent: true
        });

        await contactInquiryAuditPort.recordInquirySubmitted(
            ContactInquiryEvents.inquirySubmitted({
                inquiryId: inquiry.id,
                email: draft.email,
                hasPhone: Boolean(draft.phone),
                messageLength: draft.message.length
            })
        );

        return inquiry;
    };
};
