const createOutboxApplication = require('../../src/core/operations/application/outbox');

describe('operations outbox application', () => {
    it('includes breach flags in summary response', async () => {
        const operationsOutboxGatewayPort = {
            inspectSummary: jest.fn().mockResolvedValue({
                summary: [{ status: 'dead', event_type: 'email.raw.v1', count: 2 }],
                operability: {
                    oldestPendingAgeSec: 11,
                    oldestProcessingAgeSec: 9
                }
            }),
            listEvents: jest.fn(),
            previewReplayDead: jest.fn(),
            replayDead: jest.fn()
        };
        const operationsOutboxAlertConfigPort = {
            getAlertThresholds: jest.fn().mockResolvedValue({
                oldestPendingSec: 10,
                oldestProcessingSec: 10,
                deadCount: 1
            })
        };

        const application = createOutboxApplication({
            operationsOutboxGatewayPort,
            operationsOutboxAlertConfigPort
        });
        const result = await application.getSummary({});

        expect(result.breachFlags).toEqual(expect.objectContaining({
            oldest_pending: expect.objectContaining({ breached: true }),
            oldest_processing: expect.objectContaining({ breached: false }),
            dead_total: expect.objectContaining({ breached: true, value: 2 })
        }));
    });
});
