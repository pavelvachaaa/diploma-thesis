jest.mock('multer', () => {
    class MockMulterError extends Error {
        constructor(code, message) {
            super(message || code);
            this.code = code;
        }
    }

    const state = {
        singleHandler: (_req, _res, cb) => cb(null),
        arrayHandler: (_req, _res, cb) => cb(null),
        fieldsHandler: (_req, _res, cb) => cb(null)
    };

    const factory = jest.fn(() => ({
        single: jest.fn(() => (req, res, cb) => state.singleHandler(req, res, cb)),
        array: jest.fn(() => (req, res, cb) => state.arrayHandler(req, res, cb)),
        fields: jest.fn(() => (req, res, cb) => state.fieldsHandler(req, res, cb))
    }));

    factory.memoryStorage = jest.fn(() => ({}));
    factory.MulterError = MockMulterError;
    factory.__setHandlers = (handlers = {}) => {
        state.singleHandler = handlers.singleHandler || state.singleHandler;
        state.arrayHandler = handlers.arrayHandler || state.arrayHandler;
        state.fieldsHandler = handlers.fieldsHandler || state.fieldsHandler;
    };
    factory.__resetHandlers = () => {
        state.singleHandler = (_req, _res, cb) => cb(null);
        state.arrayHandler = (_req, _res, cb) => cb(null);
        state.fieldsHandler = (_req, _res, cb) => cb(null);
    };

    return factory;
});

const multer = require('multer');
const createFileUpload = require('../../src/shared/file/upload');

const createMockRes = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    return res;
};

describe('shared/file/upload', () => {
    let storageService;
    let logger;
    let fileUpload;

    beforeEach(() => {
        storageService = {
            upload: jest.fn().mockResolvedValue()
        };

        logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn()
        };

        multer.__resetHandlers();
        fileUpload = createFileUpload({ logger, storageService });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const waitForMiddlewareSuccess = (middleware, req, res) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Middleware did not call next in time'));
            }, 1000);

            middleware(req, res, () => {
                clearTimeout(timer);
                resolve();
            });
        });
    };

    it('createUploadMiddleware uploads single file and enriches request file metadata', async () => {
        multer.__setHandlers({
            singleHandler: (req, _res, cb) => {
                req.file = {
                    originalname: 'contract.pdf',
                    mimetype: 'application/pdf',
                    size: 1234,
                    buffer: Buffer.from('pdf-bytes')
                };
                setImmediate(() => cb(null));
            }
        });

        const middleware = fileUpload.createUploadMiddleware('user-documents');
        const req = { params: { id: 'user-1' }, user: { id: 'actor-1' } };
        const res = createMockRes();
        await waitForMiddlewareSuccess(middleware, req, res);
        expect(multer).toHaveBeenCalledWith(expect.objectContaining({
            defParamCharset: 'utf8'
        }));
        expect(storageService.upload).toHaveBeenCalledWith(
            'documents',
            expect.stringMatching(/^user-documents\/document-user-1-.*\.pdf$/),
            expect.any(Buffer),
            expect.objectContaining({
                contentType: 'application/pdf',
                contentLength: 1234
            })
        );
        const uploadMetadata = storageService.upload.mock.calls[0][3];
        expect(uploadMetadata.custom).toEqual({ context: 'user-documents' });
        expect(uploadMetadata.custom.originalName).toBeUndefined();
        expect(req.file.bucket).toBe('documents');
        expect(req.file.key).toContain('user-documents/document-user-1-');
        expect(req.file.uploadContext).toBe('user-documents');
        expect(req.file.buffer).toBeNull();
    });

    it('supports filenames with Czech diacritics and spaces without sending raw filename metadata', async () => {
        multer.__setHandlers({
            singleHandler: (req, _res, cb) => {
                req.file = {
                    originalname: 'Žluťoučký kůň 2026 životopis.pdf',
                    mimetype: 'application/pdf',
                    size: 3456,
                    buffer: Buffer.from('cv-bytes')
                };
                setImmediate(() => cb(null));
            }
        });

        const middleware = fileUpload.createUploadMiddleware('job-seekers');
        const req = { params: { id: 'seeker-1' }, user: { id: 'actor-1' } };
        const res = createMockRes();
        await waitForMiddlewareSuccess(middleware, req, res);

        expect(storageService.upload).toHaveBeenCalledWith(
            'cv-uploads',
            expect.stringMatching(/^job-seekers\/cv-seeker-1-.*\.pdf$/),
            expect.any(Buffer),
            expect.objectContaining({
                contentType: 'application/pdf',
                contentLength: 3456
            })
        );

        const uploadMetadata = storageService.upload.mock.calls[0][3];
        expect(uploadMetadata.custom).toEqual({ context: 'job-seekers' });
        expect(uploadMetadata.custom.originalName).toBeUndefined();
        expect(res.status).not.toHaveBeenCalledWith(500);
        expect(req.file.key).toContain('job-seekers/cv-seeker-1-');
    });

    it('applies immutable public cache headers for organization contact photo uploads', async () => {
        multer.__setHandlers({
            singleHandler: (req, _res, cb) => {
                req.file = {
                    originalname: 'photo.png',
                    mimetype: 'image/png',
                    size: 2048,
                    buffer: Buffer.from('png-bytes')
                };
                setImmediate(() => cb(null));
            }
        });

        const middleware = fileUpload.createUploadMiddleware('organization-contact-photos');
        const req = { params: { id: 'org-1' }, user: { id: 'actor-1' } };
        const res = createMockRes();
        await waitForMiddlewareSuccess(middleware, req, res);

        expect(storageService.upload).toHaveBeenCalledWith(
            'public-organization-photos',
            expect.stringMatching(/^organization-contact-photos\/organization-contact-photo-org-1-.*\.png$/),
            expect.any(Buffer),
            expect.objectContaining({
                contentType: 'image/png',
                contentLength: 2048,
                cacheControl: 'public, max-age=31536000, immutable'
            })
        );
    });

    it('normalizes mojibake filename encoding from latin1-decoded UTF-8 to proper UTF-8', async () => {
        multer.__setHandlers({
            singleHandler: (req, _res, cb) => {
                req.file = {
                    originalname: 'p. VÃ¡cha.pdf',
                    mimetype: 'application/pdf',
                    size: 3456,
                    buffer: Buffer.from('cv-bytes')
                };
                setImmediate(() => cb(null));
            }
        });

        const middleware = fileUpload.createUploadMiddleware('job-seekers');
        const req = { params: { id: 'seeker-2' }, user: { id: 'actor-1' } };
        const res = createMockRes();
        await waitForMiddlewareSuccess(middleware, req, res);

        expect(req.file.originalname).toBe('p. Vácha.pdf');
        expect(storageService.upload).toHaveBeenCalledWith(
            'cv-uploads',
            expect.stringMatching(/^job-seekers\/cv-seeker-2-.*\.pdf$/),
            expect.any(Buffer),
            expect.objectContaining({
                contentType: 'application/pdf',
                contentLength: 3456,
                custom: { context: 'job-seekers' }
            })
        );
    });

    it('createMultipleUploadMiddleware returns 400 on LIMIT_FILE_COUNT', async () => {
        multer.__setHandlers({
            arrayHandler: (_req, _res, cb) => cb(new multer.MulterError('LIMIT_FILE_COUNT', 'too many files'))
        });

        const middleware = fileUpload.createMultipleUploadMiddleware('chat-attachments', 'files', 3);
        const req = { params: { id: 'thread-1' } };
        const res = createMockRes();
        const next = jest.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Příliš mnoho souborů. Maximální počet: 3'
        });
    });

    it('createFieldsUploadMiddleware uploads files for each field and returns keyed req.files map', async () => {
        multer.__setHandlers({
            fieldsHandler: (req, _res, cb) => {
                req.files = {
                    cv: [{
                        fieldname: 'cv',
                        originalname: 'cv.docx',
                        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        size: 2000,
                        buffer: Buffer.from('cv')
                    }],
                    attachments: [{
                        fieldname: 'attachments',
                        originalname: 'cover.png',
                        mimetype: 'image/png',
                        size: 1000,
                        buffer: Buffer.from('img')
                    }]
                };
                setImmediate(() => cb(null));
            }
        });

        const middleware = fileUpload.createFieldsUploadMiddleware('job-seekers', [
            { name: 'cv', maxCount: 1 },
            { name: 'attachments', maxCount: 4 }
        ], {
            fieldAllowedTypes: {
                cv: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                attachments: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'image/jpeg',
                    'image/png',
                    'image/jpg'
                ]
            }
        });

        const req = { params: { id: 'seeker-1' }, user: { id: 'actor-2' } };
        const res = createMockRes();
        await waitForMiddlewareSuccess(middleware, req, res);
        expect(multer).toHaveBeenCalledWith(expect.objectContaining({
            defParamCharset: 'utf8'
        }));
        expect(storageService.upload).toHaveBeenCalledTimes(2);
        expect(req.files.cv).toHaveLength(1);
        expect(req.files.attachments).toHaveLength(1);
        expect(req.files.cv[0].bucket).toBe('cv-uploads');
        expect(req.files.attachments[0].bucket).toBe('cv-uploads');
    });

    it('createFieldsUploadMiddleware requires at least one field definition', () => {
        expect(() => fileUpload.createFieldsUploadMiddleware('job-seekers', [])).toThrow(
            'createFieldsUploadMiddleware requires at least one field definition'
        );
    });
});
