const createService = require('../../src/core/cv/application');
const createPendingAnalysisStore = require('../../src/adapters/out/persistence/cv');
const createPublishOutbox = require('../../src/adapters/out/integration/cv/publishOutbox');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');
const { createMockLogger } = require('../helpers');

const buildMocks = () => ({
    sideEffectOutboxService: {
        EVENT_TYPES: {
            CV_PUBLISH_APPLICANT: 'cv.publish.applicant.v1',
            CV_PUBLISH_JOB_SEEKER: 'cv.publish.job_seeker.v1',
            JOB_EMBEDDING_REQUESTED: 'job.embedding.requested.v1'
        },
        enqueue: jest.fn().mockResolvedValue({ id: 'outbox-1' })
    },
    cvAnalysisRepository: {
        createOrUpdatePending: jest.fn().mockResolvedValue({})
    },
    jobSeekerCvAnalysisRepository: {
        createOrUpdatePending: jest.fn().mockResolvedValue({})
    },
    logger: createMockLogger()
});

describe('cv.service', () => {
    let mocks;
    let service;

    beforeEach(() => {
        mocks = buildMocks();
        service = createService({
            cvPendingAnalysisStorePort: createPendingAnalysisStore(mocks),
            cvPublishOutboxPort: createPublishOutbox(mocks)
        });
    });

    it('queues applicant CV publish intent with deterministic idempotency key', async () => {
        await service.queueApplicantAttachmentPublishIntent({
            attachment: { id: 'att-1' },
            applicantId: 'app-1',
            organizationId: 'org-1',
            fileData: {
                key: 'applicant-attachments/cv.pdf',
                mimetype: 'application/pdf',
                originalName: 'cv.pdf'
            },
            jobInfo: {
                job_posting_id: 'job-1',
                organization_id: 'org-1',
                title: 'Nurse',
                description: 'Shift work'
            }
        }, {
            client: { query: jest.fn() }
        });

        expect(mocks.cvAnalysisRepository.createOrUpdatePending).toHaveBeenCalledWith({
            attachment_id: 'att-1',
            applicant_id: 'app-1',
            organization_id: 'org-1'
        }, {
            client: expect.any(Object)
        });

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'cv.publish.applicant.v1',
                aggregateType: 'applicant',
                aggregateId: 'app-1',
                organizationId: 'org-1',
                payload: expect.objectContaining({
                    attachment_id: 'att-1',
                    applicant_id: 'app-1',
                    s3_key: 'applicant-attachments/cv.pdf'
                })
            }),
            expect.objectContaining({
                client: expect.any(Object),
                idempotencyKey: 'cv.uploaded.attachment.att-1'
            })
        );
    });

    it('does not queue applicant CV publish intent for unsupported mime type', async () => {
        const result = await service.queueApplicantAttachmentPublishIntent({
            attachment: { id: 'att-1' },
            applicantId: 'app-1',
            organizationId: 'org-1',
            fileData: {
                key: 'applicant-attachments/image.png',
                mimetype: 'image/png',
                originalName: 'image.png'
            }
        });

        expect(result).toBeNull();
        expect(mocks.cvAnalysisRepository.createOrUpdatePending).not.toHaveBeenCalled();
        expect(mocks.sideEffectOutboxService.enqueue).not.toHaveBeenCalled();
    });

    it('queues job seeker CV publish intent and pending analysis atomically with client', async () => {
        const client = { query: jest.fn() };

        await service.queueJobSeekerCvPublishIntent({
            jobSeeker: {
                id: 'js-1',
                organization_id: 'org-1',
                cv_file_path: 'job-seekers/cv.pdf',
                cv_mime_type: 'application/pdf',
                cv_original_filename: 'cv.pdf'
            }
        }, { client });

        expect(mocks.jobSeekerCvAnalysisRepository.createOrUpdatePending).toHaveBeenCalledWith({
            job_seeker_id: 'js-1',
            organization_id: 'org-1'
        }, { client });

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'cv.publish.job_seeker.v1',
                aggregateType: 'job_seeker',
                aggregateId: 'js-1',
                payload: expect.objectContaining({
                    job_seeker_id: 'js-1',
                    s3_key: 'job-seekers/cv.pdf'
                })
            }),
            expect.objectContaining({
                client,
                idempotencyKey: 'job_seeker_cv.uploaded.js-1.job-seekers/cv.pdf'
            })
        );
    });

    it('queues job embedding request intent with deterministic idempotency key', async () => {
        await service.queueJobEmbeddingRequestIntent({
            job: {
                id: 'job-1',
                title: 'Nurse',
                description: 'desc',
                sections: {
                    requirements: ['A', 'B'],
                    duties: ['X']
                }
            },
            contentHash: 'hash-123'
        });

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'job.embedding.requested.v1',
                aggregateType: 'job',
                aggregateId: 'job-1',
                payload: {
                    job_id: 'job-1',
                    content_hash: 'hash-123',
                    title: 'Nurse',
                    description: 'desc',
                    requirements: 'A\nB',
                    duties: 'X'
                }
            }),
            expect.objectContaining({
                idempotencyKey: 'job.embedding.requested.job-1.hash-123'
            })
        );
    });

    it('respects a custom idempotencyKey passed via options for job seeker reanalysis', async () => {
        const client = { query: jest.fn() };

        await service.queueJobSeekerCvPublishIntent({
            jobSeeker: {
                id: 'js-2',
                organization_id: 'org-1',
                cv_file_path: 'job-seekers/cv2.pdf',
                cv_mime_type: 'application/pdf',
                cv_original_filename: 'cv2.pdf'
            },
            requestId: 'req-9',
            reanalysis: true
        }, {
            client,
            idempotencyKey: 'custom-key-from-caller'
        });

        expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
                client,
                idempotencyKey: 'custom-key-from-caller'
            })
        );
    });

    it('uses ApplicationError code for invalid applicant CV publish input', async () => {
        await expect(service.queueApplicantAttachmentPublishIntent({
            attachment: {},
            applicantId: 'app-1',
            fileData: {
                key: 'applicant-attachments/cv.pdf',
                mimetype: 'application/pdf'
            }
        })).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'attachment.id and applicantId are required for applicant CV publish enqueue'
        });
    });
});
