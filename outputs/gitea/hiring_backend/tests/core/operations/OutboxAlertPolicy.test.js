const OutboxAlertPolicy = require('../../../src/core/operations/domain/OutboxAlertPolicy');

describe('OutboxAlertPolicy', () => {
    it('evaluates breach flags without reading environment in core', () => {
        const flags = OutboxAlertPolicy.evaluate({
            summary: [{ status: 'dead', count: 3 }],
            operability: {
                oldestPendingAgeSec: 11,
                oldestProcessingAgeSec: 5
            }
        }, {
            oldestPendingSec: 10,
            oldestProcessingSec: 10,
            deadCount: 2
        });

        expect(flags).toEqual(expect.objectContaining({
            oldest_pending: expect.objectContaining({ breached: true }),
            oldest_processing: expect.objectContaining({ breached: false }),
            dead_total: expect.objectContaining({ breached: true, value: 3 })
        }));
    });
});
