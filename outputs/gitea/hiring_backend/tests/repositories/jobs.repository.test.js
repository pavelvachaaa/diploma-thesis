const createRepository = require('../../src/adapters/out/persistence/jobs');

const UUID_A = '11111111-1111-4111-8111-111111111111';

const createLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn()
});

describe('jobs repository seat location filtering', () => {
    let db;
    let repository;

    beforeEach(() => {
        db = {
            query: jest.fn()
        };
        repository = createRepository({
            db,
            logger: createLogger()
        });
    });

    it('uses organization seat_location filter when location is provided', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await repository.getJobs({
            page: 0,
            filters: {
                location: 'ul'
            }
        });

        const [firstQueryText, firstQueryParams] = db.query.mock.calls[0];
        expect(firstQueryText).toContain('o.seat_location = $1');
        expect(firstQueryParams[0]).toBe('UL');
    });

    it('keeps organization UUID filter precedence over seat_location filter', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

        await repository.getJobs({
            page: 0,
            filters: {
                org: UUID_A,
                location: 'UL'
            }
        });

        const [firstQueryText, firstQueryParams] = db.query.mock.calls[0];
        expect(firstQueryText).toContain('jp.organization_id = $1');
        expect(firstQueryText).not.toContain('o.seat_location = $1');
        expect(firstQueryParams[0]).toBe(UUID_A);
    });

    it('defaults admin job listing to created_at ordering', async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: '1' }] })
            .mockResolvedValueOnce({
                rows: [{
                    id: UUID_A,
                    title: 'Backend Developer'
                }]
            })
            .mockResolvedValueOnce({ rows: [] });

        await repository.getJobsAdmin({
            actorUserId: UUID_A,
            page: 0,
            filters: {}
        });

        const [listQueryText] = db.query.mock.calls[1];
        expect(listQueryText).toContain('ORDER BY jp.created_at DESC, jp.id DESC');
        expect(listQueryText).not.toContain('ORDER BY jp.publish_date DESC NULLS LAST');
    });

    it('allows updating only sections with empty item arrays', async () => {
        const txClient = {
            query: jest.fn(async (sql) => {
                if (sql.startsWith('SELECT * FROM job_postings WHERE id = $1')) {
                    return {
                        rows: [{
                            id: UUID_A,
                            title: 'Nurse',
                            organization_id: UUID_A
                        }]
                    };
                }

                if (sql.startsWith('SELECT name FROM job_posting_section_types')) {
                    return {
                        rows: [
                            { name: 'duties' },
                            { name: 'requirements' },
                            { name: 'benefits' }
                        ]
                    };
                }

                return { rows: [] };
            })
        };
        const transactionManager = {
            runInTransaction: jest.fn(async (callback) => callback(txClient))
        };
        db.query.mockResolvedValue({ rows: [] });
        repository = createRepository({
            db,
            logger: createLogger(),
            transactionManager
        });

        const saved = await repository.saveJob(UUID_A, {
            sections: {
                duties: [],
                requirements: [],
                benefits: []
            }
        });

        expect(saved).toEqual(expect.objectContaining({
            id: UUID_A,
            sections: {}
        }));
        expect(txClient.query).not.toHaveBeenCalledWith(
            expect.stringContaining('UPDATE job_postings SET  WHERE'),
            expect.any(Array)
        );
        expect(txClient.query).toHaveBeenCalledWith(
            'DELETE FROM job_posting_section_items WHERE job_posting_id = $1 AND section_type_name = $2',
            [UUID_A, 'duties']
        );
        expect(txClient.query).toHaveBeenCalledWith(
            'DELETE FROM job_posting_section_items WHERE job_posting_id = $1 AND section_type_name = $2',
            [UUID_A, 'requirements']
        );
        expect(txClient.query).toHaveBeenCalledWith(
            'DELETE FROM job_posting_section_items WHERE job_posting_id = $1 AND section_type_name = $2',
            [UUID_A, 'benefits']
        );
    });
});
