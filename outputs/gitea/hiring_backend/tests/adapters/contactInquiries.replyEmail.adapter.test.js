const createReplyEmailAdapter = require('../../src/adapters/out/integration/contactInquiries/replyEmail');

describe('contactInquiries replyEmail adapter', () => {
    it('delegates to emailSenderPort with resolved sender name and contact inquiry audit metadata', async () => {
        const emailSenderPort = {
            sendCustomEmail: jest.fn().mockResolvedValue({ success: true, sentTo: 'john@example.com' })
        };
        const adapter = createReplyEmailAdapter({ emailSenderPort });

        const result = await adapter.sendReplyEmail({
            to: 'john@example.com',
            subject: 'Re',
            message: 'Hello',
            recipientName: 'John',
            senderUser: { name: 'Admin', surname: 'User' }
        });

        expect(result).toEqual({ success: true, sentTo: 'john@example.com' });
        expect(emailSenderPort.sendCustomEmail).toHaveBeenCalledWith({
            to: 'john@example.com',
            subject: 'Re',
            message: 'Hello',
            recipientName: 'John',
            senderName: 'Admin User',
            auditAction: 'email.custom.contact_inquiry',
            aggregateType: 'contact_inquiry'
        });
    });

    it('falls back to KZCR Administration when senderUser has no name', async () => {
        const emailSenderPort = {
            sendCustomEmail: jest.fn().mockResolvedValue({ success: true })
        };
        const adapter = createReplyEmailAdapter({ emailSenderPort });

        await adapter.sendReplyEmail({
            to: 'john@example.com',
            subject: 'Re',
            message: 'Hello',
            senderUser: null
        });

        expect(emailSenderPort.sendCustomEmail).toHaveBeenCalledWith(
            expect.objectContaining({ senderName: 'KZCR Administration' })
        );
    });
});
