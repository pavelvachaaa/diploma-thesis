const createService = require('../../src/platform/outbox');
const { createMockLogger } = require('../helpers');

const mockWriteAuditEvent = jest.fn().mockResolvedValue();

const buildMocks = () => ({
    sideEffectOutboxRepository: {
        enqueue: jest.fn(async (event) => ({
            id: 'outbox-1',
            event_type: event.eventType,
            aggregate_id: event.aggregateId,
            aggregate_type: event.aggregateType,
            organization_id: event.organizationId,
            payload: event.payload,
            attempts: 1,
            max_attempts: event.maxAttempts || 8
        })),
        requeueStaleProcessing: jest.fn().mockResolvedValue(0),
        claimPendingBatch: jest.fn().mockResolvedValue([]),
        markSent: jest.fn().mockResolvedValue({ id: 'outbox-1', status: 'sent' }),
        markFailed: jest.fn().mockResolvedValue({ id: 'outbox-1', status: 'pending' })
    },
    mailer: {
        sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'welcome-msg-1' }),
        sendEmail: jest.fn().mockResolvedValue({ messageId: 'raw-msg-1' })
    },
    notificationService: {
        notifyRoleInOrg: jest.fn().mockResolvedValue([]),
        notifyUser: jest.fn().mockResolvedValue({ id: 'notification-1' })
    },
    rabbitmqService: {
        publishCVEventConfirmed: jest.fn().mockResolvedValue(true),
        publishJobSeekerCVEventConfirmed: jest.fn().mockResolvedValue(true),
        publishJobEmbeddingRequestConfirmed: jest.fn().mockResolvedValue(true)
    },
    storageService: {
        download: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined)
    },
    fileGateway: {
        getById: jest.fn().mockResolvedValue({
            id: 'file-1',
            bucket: 'documents',
            object_key: 'documents/doc-1.pdf'
        }),
        markDeleted: jest.fn().mockResolvedValue({ id: 'file-1', status: 'deleted' }),
        markDeleteFailed: jest.fn().mockResolvedValue({ id: 'file-1', status: 'delete_failed' })
    },
    rebacService: {
        syncUserRolePermissions: jest.fn().mockResolvedValue(undefined),
        syncMembershipPermissions: jest.fn().mockResolvedValue(undefined),
        deleteMembershipPermissions: jest.fn().mockResolvedValue(undefined),
        syncJobPostingPermissions: jest.fn().mockResolvedValue(undefined),
        syncOrganizationPermissions: jest.fn().mockResolvedValue(undefined)
    },
    logger: createMockLogger(),
    audit: {
        writeAuditEvent: (...args) => mockWriteAuditEvent(...args)
    }
});

const queueClaimedEvents = (repository, events = []) => {
    const queue = [...events];
    repository.claimPendingBatch.mockImplementation(async () => {
        if (queue.length === 0) {
            return [];
        }

        return [queue.shift()];
    });
};

describe('side_effect_outbox.service', () => {
    let originalEnv;
    let mocks;
    let service;

    beforeEach(() => {
        originalEnv = { ...process.env };
        process.env.SIDE_EFFECT_OUTBOX_ENABLED = 'true';
        process.env.SIDE_EFFECT_OUTBOX_WORKER_ENABLED = 'true';
        process.env.SIDE_EFFECT_OUTBOX_BATCH_SIZE = '20';
        process.env.SIDE_EFFECT_OUTBOX_POLL_INTERVAL_MS = '100';
        process.env.SIDE_EFFECT_OUTBOX_LOCK_TIMEOUT_SEC = '120';
        process.env.SIDE_EFFECT_OUTBOX_RETRY_BASE_MS = '1000';
        process.env.SIDE_EFFECT_OUTBOX_RETRY_MAX_MS = '10000';
        process.env.SIDE_EFFECT_OUTBOX_MAX_ATTEMPTS = '8';
        process.env.SIDE_EFFECT_OUTBOX_INLINE_ATTACHMENT_MAX_BYTES = '262144';
        process.env.SIDE_EFFECT_OUTBOX_ENCRYPTION_KEY = '160e12c653449fcde9fc11752b5e97ddc9aafea30bd48bc2770dd4f157e685bd';

        mocks = buildMocks();
        service = createService(mocks);
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
        mockWriteAuditEvent.mockClear();
    });

    it('enqueues welcome email with encrypted password payload', async () => {
        const result = await service.enqueueWelcomeEmail({
            employee: {
                id: 'emp-1',
                email: 'emp@example.com',
                name: 'Jan',
                surname: 'Novak',
                organization_id: 'org-1'
            },
            plainPassword: 'Secret123!'
        });

        expect(result.id).toBe('outbox-1');
        expect(mocks.sideEffectOutboxRepository.enqueue).toHaveBeenCalledWith(
            expect.objectContaining({
                eventType: 'email.welcome.v1',
                aggregateType: 'employee',
                aggregateId: 'emp-1',
                organizationId: 'org-1',
                idempotencyKey: 'email.welcome.employee.emp-1',
                payload: expect.objectContaining({
                    encryptedPassword: expect.objectContaining({
                        algorithm: 'aes-256-gcm'
                    })
                })
            }),
            expect.objectContaining({
                client: null
            })
        );
    });

    it('processes claimed welcome event and marks it sent', async () => {
        const queued = await service.enqueueWelcomeEmail({
            employee: {
                id: 'emp-1',
                email: 'emp@example.com',
                name: 'Jan',
                surname: 'Novak',
                organization_id: 'org-1'
            },
            plainPassword: 'Secret123!'
        });

        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: queued.id,
            event_type: queued.event_type,
            aggregate_id: queued.aggregate_id,
            aggregate_type: queued.aggregate_type,
            organization_id: queued.organization_id,
            payload: queued.payload,
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.mailer.sendWelcomeEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'emp@example.com',
            password: 'Secret123!'
        }));
        expect(mocks.sideEffectOutboxRepository.markSent).toHaveBeenCalledWith({
            id: queued.id,
            resultMeta: expect.objectContaining({
                providerMessageId: 'welcome-msg-1'
            })
        });
    });

    it('processes normalized raw email event type values', async () => {
        const queued = await service.enqueueRawEmail({
            to: 'candidate@example.com',
            subject: 'Subject',
            text: 'Body',
            attachments: []
        }, {
            aggregateType: 'applicant',
            aggregateId: 'app-1',
            organizationId: 'org-1'
        });

        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: queued.id,
            event_type: ' email.raw.v1\n',
            aggregate_id: queued.aggregate_id,
            aggregate_type: queued.aggregate_type,
            organization_id: queued.organization_id,
            payload: queued.payload,
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'candidate@example.com',
            subject: 'Subject'
        }));
    });

    it('dispatches role notification and marks event sent', async () => {
        const queued = await service.enqueueRoleNotification({
            type: 'job.application_received',
            organizationId: 'org-1',
            title: 'Nová přihláška',
            body: 'Body',
            data: { applicantId: 'app-1' }
        }, {
            aggregateType: 'applicant',
            aggregateId: 'app-1'
        });

        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: queued.id,
            event_type: queued.event_type,
            aggregate_id: queued.aggregate_id,
            aggregate_type: queued.aggregate_type,
            organization_id: queued.organization_id,
            payload: queued.payload,
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.notificationService.notifyRoleInOrg).toHaveBeenCalledWith(expect.objectContaining({
            type: 'job.application_received',
            organizationId: 'org-1',
            title: 'Nová přihláška'
        }));
    });

    it('dispatches user notification and marks event sent', async () => {
        const queued = await service.enqueueUserNotification({
            userId: 'user-1',
            type: 'document.approved',
            title: 'Dokument schválen',
            body: 'Váš dokument byl schválen',
            data: { documentId: 'doc-1' },
            actionUrl: '/employee/onboarding/dashboard'
        }, {
            aggregateType: 'employee-document',
            aggregateId: 'doc-1'
        });

        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: queued.id,
            event_type: queued.event_type,
            aggregate_id: queued.aggregate_id,
            aggregate_type: queued.aggregate_type,
            organization_id: queued.organization_id,
            payload: queued.payload,
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.notificationService.notifyUser).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            type: 'document.approved',
            title: 'Dokument schválen'
        }));
    });

    it('dispatches CV publish using RabbitMQ publisher confirms', async () => {
        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: 'cv-outbox-1',
            event_type: 'cv.publish.applicant.v1',
            aggregate_id: 'app-1',
            aggregate_type: 'applicant',
            organization_id: 'org-1',
            payload: {
                attachment_id: 'att-1',
                applicant_id: 'app-1'
            },
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.rabbitmqService.publishCVEventConfirmed).toHaveBeenCalledWith(expect.objectContaining({
            attachment_id: 'att-1',
            applicant_id: 'app-1'
        }));
    });

    it('dispatches job embedding request using RabbitMQ publisher confirms', async () => {
        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: 'embedding-outbox-1',
            event_type: 'job.embedding.requested.v1',
            aggregate_id: 'job-1',
            aggregate_type: 'job',
            organization_id: 'org-1',
            payload: {
                job_id: 'job-1',
                content_hash: 'hash-1'
            },
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.rabbitmqService.publishJobEmbeddingRequestConfirmed).toHaveBeenCalledWith({
            job_id: 'job-1',
            content_hash: 'hash-1'
        });
    });

    it('dispatches file GC delete and marks the file deleted', async () => {
        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: 'file-gc-1',
            event_type: 'file.gc.delete.v1',
            aggregate_id: 'file-1',
            aggregate_type: 'file',
            organization_id: 'org-1',
            payload: {
                fileId: 'file-1',
                reason: 'retention_gc'
            },
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.fileGateway.getById).toHaveBeenCalledWith('file-1');
        expect(mocks.storageService.delete).toHaveBeenCalledWith('documents', 'documents/doc-1.pdf');
        expect(mocks.fileGateway.markDeleted).toHaveBeenCalledWith('file-1', expect.objectContaining({
            metadata: expect.objectContaining({
                gc_outbox_id: 'file-gc-1',
                gc_reason: 'retention_gc'
            })
        }));
    });

    it('dispatches rebac membership sync and marks the event sent', async () => {
        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: 'rebac-membership-1',
            event_type: 'rebac.membership.sync.v1',
            aggregate_id: 'membership-1',
            aggregate_type: 'organization_membership',
            organization_id: 'org-1',
            payload: {
                membershipId: 'membership-1'
            },
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.sent).toBe(1);
        expect(mocks.rebacService.syncMembershipPermissions).toHaveBeenCalledWith('membership-1');
        expect(mocks.sideEffectOutboxRepository.markSent).toHaveBeenCalledWith({
            id: 'rebac-membership-1',
            resultMeta: expect.objectContaining({
                rebacAction: 'membership.sync',
                membershipId: 'membership-1',
                outcome: 'sent'
            })
        });
    });

    it('moves unsupported events to dead and emits dead-letter audit', async () => {
        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: 'unsupported-1',
            event_type: 'unsupported.event.v1',
            aggregate_id: 'app-1',
            aggregate_type: 'applicant',
            organization_id: 'org-1',
            payload: {},
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.dead).toBe(1);
        expect(mocks.sideEffectOutboxRepository.markFailed).toHaveBeenCalledWith(expect.objectContaining({
            id: 'unsupported-1',
            moveToDead: true,
            nextAvailableAt: null,
            resultMeta: expect.objectContaining({
                outcome: 'dead',
                classification: 'permanent',
                errorCode: 'SIDE_EFFECT_OUTBOX_UNSUPPORTED_EVENT'
            })
        }));
        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            category: 'side_effect',
            action: 'side_effect.outbox.dead'
        }));
    });

    it('normalizes transient failure error code and schedules retry', async () => {
        mocks.mailer.sendEmail.mockRejectedValueOnce(new Error('smtp timeout'));
        queueClaimedEvents(mocks.sideEffectOutboxRepository, [{
            id: 'raw-retry-1',
            event_type: 'email.raw.v1',
            aggregate_id: 'app-1',
            aggregate_type: 'applicant',
            organization_id: 'org-1',
            payload: {
                to: 'candidate@example.com',
                subject: 'Subject',
                text: 'Body',
                html: '',
                attachments: [],
                icalEvent: null,
                audit: {}
            },
            attempts: 1,
            max_attempts: 8
        }]);

        const stats = await service.processPendingBatch();

        expect(stats.failed).toBe(1);
        expect(mocks.sideEffectOutboxRepository.markFailed).toHaveBeenCalledWith(expect.objectContaining({
            id: 'raw-retry-1',
            moveToDead: false,
            resultMeta: expect.objectContaining({
                outcome: 'retry',
                classification: 'transient',
                errorCode: 'SIDE_EFFECT_OUTBOX_DISPATCH_FAILED'
            })
        }));
    });

    it('starts worker without waiting for the first batch to finish', async () => {
        mocks.sideEffectOutboxRepository.requeueStaleProcessing.mockImplementation(
            () => new Promise(() => {})
        );

        await expect(service.start()).resolves.toBe(true);

        await service.stop();
    });
});
