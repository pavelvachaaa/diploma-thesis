const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/cv/cvPublishOutbox.proxy');

describe('CvPublishOutboxPort runtime proxy', () => {
    it('delegates publish intent enqueue operations', async () => {
        const cvPublishOutboxAdapter = {
            enqueue: jest.fn().mockResolvedValue({ id: 'outbox-1' })
        };
        const port = createProxy({ cvPublishOutboxAdapter });
        const options = { client: { query: jest.fn() }, idempotencyKey: 'dedupe-1' };

        const result = await port.enqueue({ aggregateId: 'app-1', payload: { attachment_id: 'att-1' } }, options);

        expect(result).toEqual({ id: 'outbox-1' });
        expect(cvPublishOutboxAdapter.enqueue).toHaveBeenCalledWith(
            { aggregateId: 'app-1', payload: { attachment_id: 'att-1' } },
            { client: expect.any(Object), idempotencyKey: 'dedupe-1' }
        );
    });
});
