const { createMockDb } = require('../helpers');
const createRepository = require('../../src/adapters/out/persistence/contactInquiries');

describe('contactInquiries repository', () => {
    it('uses search and unanswered filters in list query', async () => {
        const db = createMockDb();
        const repository = createRepository({ db });

        db.query
            .mockResolvedValueOnce({ rows: [{ total: '1' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'ci-1' }] });

        const result = await repository.getAllInquiries({
            page: 2,
            limit: 5,
            search: 'John',
            status: 'unanswered',
        });

        expect(db.query).toHaveBeenCalledTimes(2);
        expect(db.query.mock.calls[0][0]).toContain('FROM contact_inquiries ci');
        expect(db.query.mock.calls[0][0]).toContain('ci.last_replied_at IS NULL');
        expect(db.query.mock.calls[0][1]).toEqual(['%John%']);
        expect(db.query.mock.calls[1][0]).toContain('ORDER BY ci.submitted_at DESC');
        expect(db.query.mock.calls[1][0]).toContain('ci.last_replied_at IS NULL');
        expect(db.query.mock.calls[1][1]).toEqual(['%John%', 5, 5]);
        expect(result.pagination).toEqual({
            page: 2,
            limit: 5,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: true,
        });
    });

    it('uses answered filter in list queries', async () => {
        const db = createMockDb();
        const repository = createRepository({ db });

        db.query
            .mockResolvedValueOnce({ rows: [{ total: '1' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'ci-1' }] });

        await repository.getAllInquiries({
            page: 1,
            limit: 10,
            search: 'John',
            status: 'answered',
        });

        expect(db.query.mock.calls[0][0]).toContain('ci.last_replied_at IS NOT NULL');
        expect(db.query.mock.calls[0][1]).toEqual(['%John%']);
        expect(db.query.mock.calls[1][0]).toContain('ci.last_replied_at IS NOT NULL');
        expect(db.query.mock.calls[1][1]).toEqual(['%John%', 10, 0]);
    });

    it('joins users when loading inquiry detail', async () => {
        const db = createMockDb();
        const repository = createRepository({ db });

        db.query.mockResolvedValueOnce({ rows: [{ id: 'ci-1', last_replied_by_name: 'Admin' }] });

        const inquiry = await repository.getInquiryById('ci-1');

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('LEFT JOIN users u ON u.id = ci.last_replied_by_user_id'),
            ['ci-1']
        );
        expect(inquiry).toEqual({ id: 'ci-1', last_replied_by_name: 'Admin' });
    });
});
