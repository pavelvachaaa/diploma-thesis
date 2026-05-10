const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ contactInquiriesApplication }) => {
    const submitPublicInquiry = handle(async (req, res) => {
        const inquiry = await contactInquiriesApplication.submitInquiry({
            name: req.body?.name,
            email: req.body?.email,
            phone: req.body?.phone || null,
            message: req.body?.message,
            gdprConsent: req.body?.gdprConsent
        });

        return sendResult(res, {
            message: 'Contact inquiry submitted successfully',
            inquiry: {
                id: inquiry.id,
                name: inquiry.name,
                email: inquiry.email,
                submitted_at: inquiry.submitted_at
            }
        }, 201);
    });

    const getAllContactInquiriesAdmin = handle(async (req, res) => {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        const result = await contactInquiriesApplication.getAllInquiries({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search,
            status
        });

        return sendResult(res, result);
    });

    const getContactInquiryByIdAdmin = handle(async (req, res) => {
        const inquiry = await contactInquiriesApplication.getInquiryById(req.params.id);
        if (!inquiry) {
            return sendResult(res, { message: 'Contact inquiry not found' }, 404);
        }

        return sendResult(res, inquiry);
    });

    const sendReplyAdmin = handle(async (req, res) => {
        const inquiry = await contactInquiriesApplication.sendReply(req.params.id, {
            subject: req.body?.subject,
            message: req.body?.message,
            senderUser: req.user || null
        });

        return sendResult(res, {
            success: true,
            message: 'Email byl úspěšně odeslán',
            inquiry
        });
    });

    return {
        submitPublicInquiry,
        getAllContactInquiriesAdmin,
        getContactInquiryByIdAdmin,
        sendReplyAdmin
    };
};
