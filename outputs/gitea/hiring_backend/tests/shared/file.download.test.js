const createFileDownload = require('../../src/shared/file/download');

const createMockRes = () => {
    const res = {
        headersSent: false,
        set: jest.fn(),
        setHeader: jest.fn(),
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    return res;
};

describe('shared/file/download', () => {
    let mockStorageDownload;
    let mockWriteAuditEvent;
    let mockLogger;
    let fileDownload;

    beforeEach(() => {
        mockStorageDownload = jest.fn();
        mockWriteAuditEvent = jest.fn().mockResolvedValue();
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn()
        };

        fileDownload = createFileDownload({
            logger: mockLogger,
            storageService: { download: mockStorageDownload },
            audit: { writeAuditEvent: mockWriteAuditEvent }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('emits success audit event when downloading file from Seaweed', async () => {
        const res = createMockRes();
        const pipe = jest.fn();

        mockStorageDownload.mockResolvedValue({
            Body: { pipe },
            ContentType: 'application/pdf',
            ContentLength: 1234
        });

        await fileDownload.downloadFile(
            res,
            {
                file_path: 'user-documents/doc-1.pdf',
                original_name: 'doc-1.pdf',
                mime_type: 'application/pdf',
                file_size: 987
            },
            { id: 'user-1', email: 'user@example.com' },
            'user-document',
            { resourceId: 'doc-1' }
        );

        expect(mockStorageDownload).toHaveBeenCalledWith('documents', 'user-documents/doc-1.pdf');
        expect(pipe).toHaveBeenCalledWith(res);
        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            category: 'document',
            action: 'document.read',
            status: 'success',
            resourceType: 'user-document',
            resourceId: 'doc-1',
            statusCode: 200,
            metadata: expect.objectContaining({
                mode: 'download',
                context: 'user-document',
                bucket: 'documents',
                filePath: 'user-documents/doc-1.pdf',
                fileName: 'doc-1.pdf',
                mimeType: 'application/pdf',
                contentType: 'application/pdf',
                contentLength: 1234
            })
        }));
    });

    it('emits failure audit event when file path is missing', async () => {
        const res = createMockRes();

        await fileDownload.streamFile(
            res,
            {},
            { id: 'user-1', email: 'user@example.com' },
            'user-document',
            { resourceId: 'doc-1' }
        );

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'File not found on server' });
        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failure',
            resourceType: 'user-document',
            resourceId: 'doc-1',
            statusCode: 404,
            errorMessage: 'Missing file_path',
            metadata: expect.objectContaining({
                mode: 'stream',
                context: 'user-document'
            })
        }));
    });

    it('emits failure audit event when Seaweed download throws', async () => {
        const res = createMockRes();
        mockStorageDownload.mockRejectedValue(new Error('seaweed unavailable'));

        await fileDownload.downloadFile(
            res,
            {
                file_path: 'chat-attachments/file.txt',
                original_name: 'file.txt',
                mime_type: 'text/plain'
            },
            { id: 'user-1', email: 'user@example.com' },
            'chat-attachment',
            { resourceId: 'att-1' }
        );

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Error downloading file' });
        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failure',
            resourceType: 'chat-attachment',
            resourceId: 'att-1',
            statusCode: 500,
            errorMessage: 'seaweed unavailable',
            metadata: expect.objectContaining({
                mode: 'download',
                context: 'chat-attachment',
                bucket: 'chat-files'
            })
        }));
    });

    it('sets RFC-compliant Content-Disposition for filenames with spaces and diacritics', async () => {
        const res = createMockRes();
        const pipe = jest.fn();

        mockStorageDownload.mockResolvedValue({
            Body: { pipe },
            ContentType: 'application/pdf',
            ContentLength: 1234
        });

        await fileDownload.downloadFile(
            res,
            {
                file_path: 'user-documents/doc-utf8.pdf',
                original_name: 'Žluťoučký kůň 2026 životopis.pdf',
                mime_type: 'application/pdf'
            },
            { id: 'user-1', email: 'user@example.com' },
            'user-document',
            { resourceId: 'doc-utf8' }
        );

        const contentDispositionCall = res.setHeader.mock.calls.find(([headerName]) => headerName === 'Content-Disposition');
        expect(contentDispositionCall).toBeDefined();
        expect(contentDispositionCall[1]).toContain('filename="Zlutoucky kun 2026 zivotopis.pdf"');
        expect(contentDispositionCall[1]).toContain("filename*=UTF-8''%C5%BDlu%C5%A5ou%C4%8Dk%C3%BD%20k%C5%AF%C5%88%202026%20%C5%BEivotopis.pdf");
    });

    it('normalizes legacy mojibake filename before building Content-Disposition', async () => {
        const res = createMockRes();
        const pipe = jest.fn();

        mockStorageDownload.mockResolvedValue({
            Body: { pipe },
            ContentType: 'application/pdf',
            ContentLength: 120
        });

        await fileDownload.downloadFile(
            res,
            {
                file_path: 'user-documents/doc-legacy.pdf',
                original_name: 'p. VÃ¡cha.pdf',
                mime_type: 'application/pdf'
            },
            { id: 'user-1', email: 'user@example.com' },
            'user-document',
            { resourceId: 'doc-legacy' }
        );

        const contentDispositionCall = res.setHeader.mock.calls.find(([headerName]) => headerName === 'Content-Disposition');
        expect(contentDispositionCall).toBeDefined();
        expect(contentDispositionCall[1]).toContain('filename="p. Vacha.pdf"');
        expect(contentDispositionCall[1]).toContain("filename*=UTF-8''p.%20V%C3%A1cha.pdf");
    });

    it('uses inline Content-Disposition when streaming a file', async () => {
        const res = createMockRes();
        const pipe = jest.fn();

        mockStorageDownload.mockResolvedValue({
            Body: { pipe },
            ContentType: 'image/jpeg',
            ContentLength: 512
        });

        await fileDownload.streamFile(
            res,
            {
                file_path: 'organization-contact-photos/avatar.jpg',
                original_name: 'avatar.jpg',
                mime_type: 'image/jpeg'
            },
            null,
            'organization-contact-photo',
            { resourceId: 'org-1' }
        );

        const contentDispositionCall = res.setHeader.mock.calls.find(([headerName]) => headerName === 'Content-Disposition');
        expect(contentDispositionCall).toBeDefined();
        expect(contentDispositionCall[1]).toContain('inline;');
    });
});
