const createContactInquiryAuditProxy = require('../../../../../src/shared/contracts/runtime/proxies/contactInquiries/contactInquiryAudit.proxy');

describe('contactInquiryAudit runtime proxy', () => {
    it('delegates audit recording calls to the raw integration adapter', async () => {
        const contactInquiryAuditAdapter = {
            recordInquirySubmitted: jest.fn().mockResolvedValue(null),
            recordInquiryReplied: jest.fn().mockResolvedValue(null)
        };
        const proxy = createContactInquiryAuditProxy({ contactInquiryAuditAdapter });

        await proxy.recordInquirySubmitted({ action: 'contact_inquiry.submit' });
        await proxy.recordInquiryReplied({ action: 'contact_inquiry.reply' });

        expect(contactInquiryAuditAdapter.recordInquirySubmitted).toHaveBeenCalledWith({
            action: 'contact_inquiry.submit'
        });
        expect(contactInquiryAuditAdapter.recordInquiryReplied).toHaveBeenCalledWith({
            action: 'contact_inquiry.reply'
        });
    });
});
