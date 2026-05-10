const createService = require('../../src/platform/outbox');
const { createMockLogger } = require('../helpers');

const mockWriteAuditEvent = jest.fn().mockResolvedValue();

const createDependencies = () => ({
    sideEffectOutboxRepository: {
        enqueue: jest.fn(),
        requeueStaleProcessing: jest.fn().mockResolvedValue(0),
        claimPendingBatch: jest.fn().mockResolvedValue([]),
        markSent: jest.fn(),
        markFailed: jest.fn(),
        inspectSummary: jest.fn().mockResolvedValue({
            summary: [{ status: 'dead', event_type: 'email.raw.v1', count: 2 }],
            deadReasons: [{ event_type: 'email.raw.v1', reason: 'SMTP timeout', count: 2 }]
        }),
        listEvents: jest.fn().mockResolvedValue({
            data: [{ id: 'outbox-1', status: 'dead' }],
            pagination: { page: 0, limit: 50, total: 1, totalPages: 1 }
        }),
        previewReplayDead: jest.fn().mockResolvedValue([
            { id: 'outbox-1', event_type: 'email.raw.v1', status: 'dead' }
        ]),
        replayDead: jest.fn().mockResolvedValue({
            matchedCount: 1,
            replayedCount: 1,
            events: [{ id: 'outbox-1', event_type: 'email.raw.v1', status: 'pending' }]
        })
    },
    mailer: {
        sendWelcomeEmail: jest.fn(),
        sendEmail: jest.fn()
    },
    notificationService: {
        notifyRoleInOrg: jest.fn(),
        notifyUser: jest.fn()
    },
    rabbitmqService: {
        publishCVEventConfirmed: jest.fn(),
        publishJobSeekerCVEventConfirmed: jest.fn(),
        publishJobEmbeddingRequestConfirmed: jest.fn()
    },
    storageService: {
        download: jest.fn()
    },
    logger: createMockLogger(),
    audit: {
        writeAuditEvent: (...args) => mockWriteAuditEvent(...args)
    }
});

describe('side_effect_outbox operations', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
        process.env.SIDE_EFFECT_OUTBOX_ENABLED = 'true';
        process.env.SIDE_EFFECT_OUTBOX_WORKER_ENABLED = 'true';
        process.env.SIDE_EFFECT_OUTBOX_ENCRYPTION_KEY = '160e12c653449fcde9fc11752b5e97ddc9aafea30bd48bc2770dd4f157e685bd';
        process.env.OUTBOX_REPLAY_MAX_EXECUTE = '100';
        mockWriteAuditEvent.mockClear();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns filtered inspection summary', async () => {
        const deps = createDependencies();
        const service = createService(deps);

        const result = await service.inspectSummary({
            status: 'dead',
            eventType: 'email.raw.v1'
        });

        expect(deps.sideEffectOutboxRepository.inspectSummary).toHaveBeenCalledWith({
            status: 'dead',
            eventType: 'email.raw.v1'
        });
        expect(result.summary).toHaveLength(1);
    });

    it('previews replay without mutating rows', async () => {
        const deps = createDependencies();
        const service = createService(deps);

        const result = await service.previewReplayDead({
            eventType: 'email.raw.v1',
            limit: 10
        }, {
            actorUserId: 'super-1',
            source: 'admin-api'
        });

        expect(result.mode).toBe('preview');
        expect(result.matchedCount).toBe(1);
        expect(result.replayedCount).toBe(0);
        expect(deps.sideEffectOutboxRepository.replayDead).not.toHaveBeenCalled();
        expect(mockWriteAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
            action: 'side_effect.outbox.replay',
            status: 'success',
            metadata: expect.objectContaining({
                mode: 'preview'
            })
        }));
    });

    it('replays dead rows when execute is requested', async () => {
        const deps = createDependencies();
        const service = createService(deps);

        const result = await service.replayDead({
            ids: ['outbox-1']
        }, {
            actorUserId: 'super-1',
            source: 'admin-api'
        });

        expect(result.mode).toBe('execute');
        expect(result.matchedCount).toBe(1);
        expect(result.replayedCount).toBe(1);
        expect(deps.sideEffectOutboxRepository.replayDead).toHaveBeenCalledWith({
            ids: ['outbox-1'],
            eventType: null,
            limit: undefined
        });
    });

    it('enforces replay execute safety limit', async () => {
        const deps = createDependencies();
        const service = createService(deps);
        process.env.OUTBOX_REPLAY_MAX_EXECUTE = '2';

        await expect(service.replayDead({
            ids: ['1', '2', '3']
        }, {
            actorUserId: 'super-1',
            source: 'admin-api'
        })).rejects.toThrow('Replay execute ids limit exceeded');

        expect(deps.sideEffectOutboxRepository.replayDead).not.toHaveBeenCalled();
    });
});
