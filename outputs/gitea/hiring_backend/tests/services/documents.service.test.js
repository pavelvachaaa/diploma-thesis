const { createMockLogger, createMockDb } = require('../helpers');

const createService = require('../../src/domain/documents/service');

const buildMocks = () => ({
    db: createMockDb(),
    logger: createMockLogger(),
    sideEffectOutboxService: {
        enqueue: jest.fn(),
        enqueueRoleNotification: jest.fn(),
    },
    fileGateway: {
        createFileRecord: jest.fn(async () => ({ id: 'file-uuid-1' }))
    },
    documentsRepository: {
        getApplicantOrganizationId: jest.fn().mockResolvedValue('org-uuid-1'),
        insertApplicantAttachment: jest.fn(),
        getApplicantJobInfo: jest.fn().mockResolvedValue({}),
        getApplicantAttachmentForDownload: jest.fn(),
        getApplicantAttachments: jest.fn()
    },
    documentsEvents: {
        enqueueApplicantDocumentUploaded: jest.fn().mockResolvedValue({})
    },
    cvIntentPort: {
        isCvMimeType: jest.fn((mimeType) => mimeType === 'application/pdf'),
        queueApplicantAttachmentPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-1' })
    }
});

describe('documents.service', () => {
    let mocks;
    let service;

    beforeEach(() => {
        mocks = buildMocks();
        service = createService(mocks);
    });

    describe('storeApplicantAttachment', () => {
        const applicantId = 'applicant-uuid-1';
        const fileData = {
            filename: 'cv.pdf',
            originalName: 'my_cv.pdf',
            mimetype: 'application/pdf',
            size: 50000,
            key: 'applicant-attachments/attachment-uuid-123.pdf',
            bucket: 'attachments',
            checksum_sha256: 'deadbeef'
        };

        const insertedRow = {
            id: 'att-uuid-1',
            applicant_id: applicantId,
            file_id: 'file-uuid-1',
            original_filename: 'my_cv.pdf',
            mime_type: 'application/pdf',
            file_size: 50000,
            file_path: 'applicant-attachments/attachment-uuid-123.pdf',
        };

        beforeEach(() => {
            mocks.sideEffectOutboxService.enqueueRoleNotification.mockResolvedValue({});
        });

        it('stores attachment in transaction and returns created row', async () => {
            mocks.documentsRepository.insertApplicantAttachment.mockResolvedValue(insertedRow);
            mocks.documentsRepository.getApplicantJobInfo.mockResolvedValue({
                title: 'Nurse',
                description: 'Nursing position',
                organization_id: 'org-uuid-1',
                job_posting_id: 'job-uuid-1',
            });

            const result = await service.storeApplicantAttachment(applicantId, fileData);

            expect(result).toEqual(insertedRow);
            expect(mocks.documentsRepository.getApplicantOrganizationId).toHaveBeenCalledWith(
                applicantId,
                { client: mocks.db._mockClient }
            );
            expect(mocks.fileGateway.createFileRecord).toHaveBeenCalledWith(expect.objectContaining({
                bucket: 'attachments',
                objectKey: fileData.key,
                checksumSha256: 'deadbeef'
            }), { client: mocks.db._mockClient });
            expect(mocks.documentsRepository.insertApplicantAttachment).toHaveBeenCalledWith({
                applicantId,
                fileId: 'file-uuid-1'
            }, { client: mocks.db._mockClient });
            expect(mocks.documentsEvents.enqueueApplicantDocumentUploaded).toHaveBeenCalledWith({
                client: mocks.db._mockClient,
                organizationId: 'org-uuid-1',
                applicantId,
                originalName: fileData.originalName,
                attachmentId: insertedRow.id
            });
            expect(mocks.db._mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mocks.db._mockClient.query).toHaveBeenLastCalledWith('COMMIT');
            expect(mocks.db._mockClient.release).toHaveBeenCalled();
        });

        it('uses injected transactionManager when provided (no db.getClient fallback)', async () => {
            mocks.documentsRepository.insertApplicantAttachment.mockResolvedValue(insertedRow);
            mocks.documentsRepository.getApplicantJobInfo.mockResolvedValue({
                title: 'Nurse',
                description: 'Nursing position',
                organization_id: 'org-uuid-1',
                job_posting_id: 'job-uuid-1',
            });

            const txClient = { query: jest.fn(), release: jest.fn() };
            const transactionManager = {
                runInTransaction: jest.fn(async (callback, options) => {
                    expect(options).toEqual(expect.objectContaining({
                        label: 'documents.storeApplicantAttachment'
                    }));
                    return callback(txClient);
                })
            };
            const serviceWithTxManager = createService({
                ...mocks,
                transactionManager
            });

            const result = await serviceWithTxManager.storeApplicantAttachment(applicantId, fileData);

            expect(result).toEqual(insertedRow);
            expect(transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
            expect(mocks.db.getClient).not.toHaveBeenCalled();
            expect(mocks.documentsRepository.getApplicantOrganizationId).toHaveBeenCalledWith(
                applicantId,
                { client: txClient }
            );
        });

        it('delegates CV side effects to cvIntentPort for CV files', async () => {
            mocks.documentsRepository.insertApplicantAttachment.mockResolvedValue(insertedRow);
            mocks.documentsRepository.getApplicantJobInfo.mockResolvedValue({
                title: 'Nurse',
                description: 'Nursing position',
                organization_id: 'org-uuid-1',
                job_posting_id: 'job-uuid-1',
            });

            await service.storeApplicantAttachment(applicantId, fileData);

            expect(mocks.cvIntentPort.queueApplicantAttachmentPublishIntent).toHaveBeenCalledWith(
                {
                    attachment: insertedRow,
                    applicantId,
                    organizationId: 'org-uuid-1',
                    fileData,
                    jobInfo: {
                        title: 'Nurse',
                        description: 'Nursing position',
                        organization_id: 'org-uuid-1',
                        job_posting_id: 'job-uuid-1',
                    }
                },
                {
                    client: mocks.db._mockClient
                }
            );
        });

        it('rolls back and queues cleanup when CV publish enqueue fails', async () => {
            mocks.documentsRepository.insertApplicantAttachment.mockResolvedValue(insertedRow);
            mocks.documentsRepository.getApplicantJobInfo.mockResolvedValue({
                title: 'Nurse',
                description: 'Nursing position',
                organization_id: 'org-uuid-1',
                job_posting_id: 'job-uuid-1',
            });

            mocks.cvIntentPort.queueApplicantAttachmentPublishIntent.mockRejectedValueOnce(new Error('outbox down'));
            mocks.sideEffectOutboxService.enqueueFileGcDelete = jest.fn().mockResolvedValue({ id: 'gc-1' });

            await expect(service.storeApplicantAttachment(applicantId, fileData)).rejects.toThrow('outbox down');

            expect(mocks.db._mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mocks.sideEffectOutboxService.enqueueFileGcDelete).toHaveBeenCalledWith(
                expect.objectContaining({
                    bucket: 'attachments',
                    objectKey: fileData.key
                }),
                expect.any(Object)
            );
        });
    });

    describe('detectBucketFromKey', () => {
        it('should detect attachments bucket from applicant-attachments prefix', () => {
            expect(service.detectBucketFromKey('applicant-attachments/file.pdf')).toBe('attachments');
        });

        it('should detect chat-files bucket from chat-attachments prefix', () => {
            expect(service.detectBucketFromKey('chat-attachments/file.pdf')).toBe('chat-files');
        });

        it('should detect documents bucket from user-documents prefix', () => {
            expect(service.detectBucketFromKey('user-documents/file.pdf')).toBe('documents');
        });

        it('should detect templates bucket from onboarding-templates prefix', () => {
            expect(service.detectBucketFromKey('onboarding-templates/file.pdf')).toBe('templates');
        });

        it('should detect cv-uploads bucket from job-seekers prefix', () => {
            expect(service.detectBucketFromKey('job-seekers/file.pdf')).toBe('cv-uploads');
        });

        it('should default to attachments for unknown prefix', () => {
            expect(service.detectBucketFromKey('unknown/file.pdf')).toBe('attachments');
        });

        it('should default to attachments for null key', () => {
            expect(service.detectBucketFromKey(null)).toBe('attachments');
        });
    });

    describe('getApplicantAttachmentForDownload', () => {
        it('should return file info when attachment exists', async () => {
            const row = {
                file_path: 'applicant-attachments/file.pdf',
                original_name: 'cv.pdf',
                mime_type: 'application/pdf',
                uploaded_at: '2024-01-01',
            };
            mocks.documentsRepository.getApplicantAttachmentForDownload.mockResolvedValue(row);

            const result = await service.getApplicantAttachmentForDownload('att-1');

            expect(result).toEqual(row);
            expect(mocks.documentsRepository.getApplicantAttachmentForDownload).toHaveBeenCalledWith('att-1');
        });

        it('should throw when attachment not found', async () => {
            mocks.documentsRepository.getApplicantAttachmentForDownload.mockRejectedValue(new Error('Attachment not found'));

            await expect(
                service.getApplicantAttachmentForDownload('att-1')
            ).rejects.toThrow('Attachment not found');
        });
    });
});
