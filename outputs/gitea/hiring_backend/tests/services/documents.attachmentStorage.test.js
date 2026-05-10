const createAttachmentStorage = require('../../src/domain/documents/service/attachmentStorage');

describe('documents attachmentStorage leaf', () => {
    it('creates file record and applicant attachment inside provided transaction context', async () => {
        const leaf = createAttachmentStorage({
            documentsRepository: {
                getApplicantOrganizationId: jest.fn().mockResolvedValue('org-1'),
                insertApplicantAttachment: jest.fn().mockResolvedValue({ id: 'att-1', file_id: 'file-1' })
            },
            fileGateway: {
                createFileRecord: jest.fn().mockResolvedValue({ id: 'file-1' })
            },
            detectBucketFromKey: jest.fn(() => 'attachments')
        });

        const result = await leaf.storeAttachmentRecord({
            applicantId: 'applicant-1',
            fileData: {
                key: 'applicant-attachments/cv.pdf',
                mimetype: 'application/pdf',
                size: 1024,
                originalName: 'cv.pdf'
            }
        }, {
            client: { query: jest.fn() }
        });

        expect(result).toEqual({
            attachment: { id: 'att-1', file_id: 'file-1' },
            organizationId: 'org-1'
        });
    });
});
