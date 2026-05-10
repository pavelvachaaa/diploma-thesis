const createApplication = require('../../src/core/contactInquiries/application');

describe('contactInquiries application', () => {
    const createDeps = () => {
        const contactInquiryStorePort = {
            createInquiry: jest.fn(async (payload) => ({ id: 'ci-1', ...payload, submitted_at: '2026-03-19T11:00:00.000Z' })),
            getAllInquiries: jest.fn(async () => ({ data: [], pagination: {} })),
            getInquiryById: jest.fn(),
            markInquiryReplied: jest.fn(async () => ({ id: 'ci-1' })),
        };

        const contactInquiryReplyEmailPort = {
            sendReplyEmail: jest.fn(async () => ({ success: true, sentTo: 'john@example.com' })),
        };

        const contactInquiryAuditPort = {
            recordInquirySubmitted: jest.fn(async () => null),
            recordInquiryReplied: jest.fn(async () => null),
        };

        return {
            application: createApplication({
                contactInquiryStorePort,
                contactInquiryReplyEmailPort,
                contactInquiryAuditPort
            }),
            contactInquiryStorePort,
            contactInquiryReplyEmailPort,
            contactInquiryAuditPort,
        };
    };

    it('normalizes and stores submitted inquiry', async () => {
        const { application, contactInquiryStorePort, contactInquiryAuditPort } = createDeps();

        await application.submitInquiry({
            name: '  John Doe  ',
            email: '  john@example.com  ',
            phone: '   ',
            message: '  Hello world  ',
            gdprConsent: true,
        });

        expect(contactInquiryStorePort.createInquiry).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'john@example.com',
            phone: null,
            message: 'Hello world',
            gdpr_consent: true,
        });
        expect(contactInquiryAuditPort.recordInquirySubmitted).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'ContactInquiry.Submitted',
                inquiryId: 'ci-1',
                email: 'john@example.com',
                hasPhone: false,
                messageLength: 11,
            })
        );
    });

    it('rejects invalid email on submit', async () => {
        const { application, contactInquiryStorePort } = createDeps();

        await expect(application.submitInquiry({
            name: 'John Doe',
            email: 'invalid',
            message: 'Hello',
            gdprConsent: true,
        })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: 'Valid email address is required' });

        expect(contactInquiryStorePort.createInquiry).not.toHaveBeenCalled();
    });

    it('normalizes status filter for listing', async () => {
        const { application, contactInquiryStorePort } = createDeps();

        await application.getAllInquiries({ page: 1, limit: 10, search: ' John ', status: 'other' });

        expect(contactInquiryStorePort.getAllInquiries).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            search: 'John',
            status: 'all',
        });
    });

    it('sends reply and stores reply metadata', async () => {
        const {
            application,
            contactInquiryStorePort,
            contactInquiryReplyEmailPort,
            contactInquiryAuditPort
        } = createDeps();

        contactInquiryStorePort.getInquiryById
            .mockResolvedValueOnce({ id: 'ci-1', name: 'John Doe', email: 'john@example.com' });

        contactInquiryStorePort.markInquiryReplied
            .mockResolvedValueOnce({ id: 'ci-1', status: 'answered', last_reply_subject: 'Re: dotaz', last_reply_message: 'Dobrý den' });

        const result = await application.sendReply('ci-1', {
            subject: '  Re: dotaz  ',
            message: '  Dobrý den  ',
            senderUser: { id: 'admin-1', name: 'Admin', surname: 'User' },
        });

        expect(contactInquiryReplyEmailPort.sendReplyEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'john@example.com',
            subject: 'Re: dotaz',
            message: 'Dobrý den',
            recipientName: 'John Doe',
            senderUser: { id: 'admin-1', name: 'Admin', surname: 'User' },
        }));
        expect(contactInquiryStorePort.markInquiryReplied).toHaveBeenCalledWith(
            'ci-1',
            expect.objectContaining({
                repliedByUserId: 'admin-1',
                replySubject: 'Re: dotaz',
                replyMessage: 'Dobrý den',
            })
        );
        expect(contactInquiryAuditPort.recordInquiryReplied).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'ContactInquiry.Replied',
                inquiryId: 'ci-1',
                actorUserId: 'admin-1',
                actorEmail: null,
                inquiryEmail: 'john@example.com',
                isFirstReply: true,
                subject: 'Re: dotaz',
                replyLength: 9,
            })
        );
        expect(result).toEqual({ id: 'ci-1', status: 'answered', last_reply_subject: 'Re: dotaz', last_reply_message: 'Dobrý den' });
    });

    it('returns 404 when replying to missing inquiry', async () => {
        const { application, contactInquiryStorePort, contactInquiryReplyEmailPort } = createDeps();
        contactInquiryStorePort.getInquiryById.mockResolvedValue(null);

        await expect(application.sendReply('missing', {
            subject: 'Re',
            message: 'Hello',
            senderUser: { id: 'admin-1' },
        })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Contact inquiry not found' });

        expect(contactInquiryReplyEmailPort.sendReplyEmail).not.toHaveBeenCalled();
        expect(contactInquiryStorePort.markInquiryReplied).not.toHaveBeenCalled();
    });

    it('does not persist reply metadata when email sending fails', async () => {
        const { application, contactInquiryStorePort, contactInquiryReplyEmailPort } = createDeps();
        contactInquiryStorePort.getInquiryById.mockResolvedValue({ id: 'ci-1', name: 'John Doe', email: 'john@example.com' });
        contactInquiryReplyEmailPort.sendReplyEmail.mockResolvedValue({ success: false, error: 'smtp timeout' });

        await expect(application.sendReply('ci-1', {
            subject: 'Re',
            message: 'Hello',
            senderUser: { id: 'admin-1' },
        })).rejects.toMatchObject({ code: 'INTERNAL_ERROR', message: 'smtp timeout' });

        expect(contactInquiryStorePort.markInquiryReplied).not.toHaveBeenCalled();
    });
});
