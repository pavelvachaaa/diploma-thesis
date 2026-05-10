const createContactInquiryReplyEmailProxy = require('../../../../../src/shared/contracts/runtime/proxies/contactInquiries/contactInquiryReplyEmail.proxy');

describe('contactInquiryReplyEmail runtime proxy', () => {
    it('delegates reply email sending to the raw integration adapter', async () => {
        const contactInquiryReplyEmailAdapter = {
            sendReplyEmail: jest.fn().mockResolvedValue({
                success: true,
                sentTo: 'john@example.com'
            })
        };
        const proxy = createContactInquiryReplyEmailProxy({ contactInquiryReplyEmailAdapter });

        const result = await proxy.sendReplyEmail({
            to: 'john@example.com',
            subject: 'Re',
            message: 'Hello',
            recipientName: 'John',
            senderName: 'Admin'
        });

        expect(result).toEqual({
            success: true,
            sentTo: 'john@example.com'
        });
        expect(contactInquiryReplyEmailAdapter.sendReplyEmail).toHaveBeenCalledWith({
            to: 'john@example.com',
            subject: 'Re',
            message: 'Hello',
            recipientName: 'John',
            senderName: 'Admin'
        });
    });
});
