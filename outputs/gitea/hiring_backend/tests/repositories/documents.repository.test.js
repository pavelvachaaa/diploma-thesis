const createDocumentsRepository = require('../../src/domain/documents/repository');

describe('documents repository decomposition regressions', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn()
        };
        repository = createDocumentsRepository({ db });
    });

    it('loads applicant attachment download metadata from download slice', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ file_path: 'attachments/x.pdf', bucket: 'attachments' }] });

        const result = await repository.getApplicantAttachmentForDownload('att-1');

        expect(result).toEqual({ file_path: 'attachments/x.pdf', bucket: 'attachments' });
        expect(db.query.mock.calls[0][0]).toContain('FROM application_attachments aa');
    });

    it('inserts chat attachment through chat slice', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id: 'chat-att-1' }] });

        const result = await repository.insertChatAttachment('message-1', { fileId: 'file-1' });

        expect(result).toEqual({ id: 'chat-att-1' });
        expect(db.query.mock.calls[0][0]).toContain('INSERT INTO direct_message_attachments');
    });

    it('loads file statistics through stats slice', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ count: 1, total_size: 10 }] });

        const result = await repository.getApplicantAttachmentStats();

        expect(result).toEqual({ count: 1, total_size: 10 });
        expect(db.query.mock.calls[0][0]).toContain('FROM application_attachments aa');
    });
});
