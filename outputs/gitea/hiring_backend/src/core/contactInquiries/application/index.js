const createSubmitInquiry = require('./submitInquiry');
const createGetAllInquiries = require('./getAllInquiries');
const createGetInquiryById = require('./getInquiryById');
const createSendReply = require('./sendReply');

module.exports = ({
    contactInquiryStorePort,
    contactInquiryReplyEmailPort,
    contactInquiryAuditPort
}) => {
    const submitInquiry = createSubmitInquiry({
        contactInquiryStorePort,
        contactInquiryAuditPort
    });
    const getAllInquiries = createGetAllInquiries({
        contactInquiryStorePort
    });
    const getInquiryById = createGetInquiryById({
        contactInquiryStorePort
    });
    const sendReply = createSendReply({
        contactInquiryStorePort,
        contactInquiryReplyEmailPort,
        contactInquiryAuditPort
    });

    return {
        submitInquiry,
        getAllInquiries,
        getInquiryById,
        sendReply
    };
};
