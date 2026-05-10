const createContactInquiryStoreProxy = require('../../../../../src/shared/contracts/runtime/proxies/contactInquiries/contactInquiryStore.proxy');

describe('contactInquiryStore runtime proxy', () => {
    it('delegates persistence reads and writes through the adapter contract', async () => {
        const contactInquiryStoreAdapter = {
            createInquiry: jest.fn().mockResolvedValue({ id: 'ci-1', email: 'john@example.com' }),
            getAllInquiries: jest.fn().mockResolvedValue({
                data: [{ id: 'ci-1' }],
                pagination: { page: 1, limit: 10, total: 1 }
            }),
            getInquiryById: jest.fn().mockResolvedValue({ id: 'ci-1', email: 'john@example.com' }),
            markInquiryReplied: jest.fn().mockResolvedValue({ id: 'ci-1', status: 'answered' })
        };
        const proxy = createContactInquiryStoreProxy({ contactInquiryStoreAdapter });

        await proxy.createInquiry({ email: 'john@example.com' }, { client: { query: jest.fn() } });
        await proxy.getAllInquiries({ search: 'john' }, { client: { query: jest.fn() } });
        await proxy.getInquiryById('ci-1', { client: { query: jest.fn() } });
        await proxy.markInquiryReplied('ci-1', { replySubject: 'Re' }, { client: { query: jest.fn() } });

        expect(contactInquiryStoreAdapter.createInquiry).toHaveBeenCalledWith(
            { email: 'john@example.com' },
            { client: { query: expect.any(Function) } }
        );
        expect(contactInquiryStoreAdapter.getAllInquiries).toHaveBeenCalledWith(
            { search: 'john' },
            { client: { query: expect.any(Function) } }
        );
        expect(contactInquiryStoreAdapter.getInquiryById).toHaveBeenCalledWith(
            'ci-1',
            { client: { query: expect.any(Function) } }
        );
        expect(contactInquiryStoreAdapter.markInquiryReplied).toHaveBeenCalledWith(
            'ci-1',
            { replySubject: 'Re' },
            { client: { query: expect.any(Function) } }
        );
    });

    it('preserves date fields returned from the adapter', async () => {
        const submittedAt = new Date('2026-04-07T08:18:06.533Z');
        const lastRepliedAt = new Date('2026-04-07T08:19:04.996Z');
        const contactInquiryStoreAdapter = {
            createInquiry: jest.fn(),
            getAllInquiries: jest.fn().mockResolvedValue({
                data: [{
                    id: 'ci-1',
                    submitted_at: submittedAt,
                    last_replied_at: lastRepliedAt
                }],
                pagination: { page: 1, limit: 10, total: 1 }
            }),
            getInquiryById: jest.fn().mockResolvedValue({
                id: 'ci-1',
                submitted_at: submittedAt,
                last_replied_at: lastRepliedAt
            }),
            markInquiryReplied: jest.fn()
        };
        const proxy = createContactInquiryStoreProxy({ contactInquiryStoreAdapter });

        const listResult = await proxy.getAllInquiries();
        const detailResult = await proxy.getInquiryById('ci-1');

        expect(Object.prototype.toString.call(listResult.data[0].submitted_at)).toBe('[object Date]');
        expect(listResult.data[0].submitted_at.toISOString()).toBe('2026-04-07T08:18:06.533Z');
        expect(Object.prototype.toString.call(listResult.data[0].last_replied_at)).toBe('[object Date]');
        expect(listResult.data[0].last_replied_at.toISOString()).toBe('2026-04-07T08:19:04.996Z');
        expect(Object.prototype.toString.call(detailResult.submitted_at)).toBe('[object Date]');
        expect(detailResult.submitted_at.toISOString()).toBe('2026-04-07T08:18:06.533Z');
        expect(Object.prototype.toString.call(detailResult.last_replied_at)).toBe('[object Date]');
        expect(detailResult.last_replied_at.toISOString()).toBe('2026-04-07T08:19:04.996Z');
    });
});
