const createApplicantsRepository = require('../../src/domain/applicants/repository/applicants.repository');
const createAttachmentsRepository = require('../../src/domain/applicants/repository/attachments.repository');
const createNotesRepository = require('../../src/domain/applicants/repository/notes.repository');
const createStatusRepository = require('../../src/domain/applicants/repository/status.repository');

describe('applicants repositories ReBAC SQL regressions', () => {
    let db;

    beforeEach(() => {
        db = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };
    });

    it('creates applicants through INSERT ... SELECT with job posting guard and matching expressions', async () => {
        const repository = createApplicantsRepository({ db });

        await repository.createApplicant({
            name: 'Jan',
            surname: 'Novak',
            email: 'jan@example.com',
            phone: '+420123456789',
            address: 'Main 1',
            city: 'Prague',
            zip: '11000',
            education: 'University',
            field: 'IT',
            experience: '5 years',
            last_employer: 'ACME',
            last_position: 'Engineer',
            gdpr_consent: true,
            current_status: 'submitted',
            job_posting_id: '11111111-1111-4111-8111-111111111111',
            organization_id: null
        }, {
            actorUserId: '22222222-2222-4222-8222-222222222222',
            minAccess: 'write'
        });

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('INSERT INTO applicants');
        expect(sql).toContain('SELECT');
        expect(sql).toContain('$15, COALESCE($16, jp.organization_id), NOW()');
        expect(sql).toContain('FROM job_postings jp');
        expect(sql).toContain('WHERE jp.id = $15 AND EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '11111111-1111-4111-8111-111111111111',
            null,
            '22222222-2222-4222-8222-222222222222',
            'job_posting',
            'write'
        ]));
    });

    it('loads job applicants with the selected executor when actor-based ACL is enabled', async () => {
        const repository = createApplicantsRepository({ db });
        const client = {
            query: jest.fn().mockResolvedValue({ rows: [] })
        };

        await repository.getApplicantsByJobId(
            '33333333-3333-4333-8333-333333333333',
            {
                client,
                actorUserId: '44444444-4444-4444-8444-444444444444',
                minAccess: 'read'
            }
        );

        expect(client.query).toHaveBeenCalledTimes(1);
        expect(db.query).not.toHaveBeenCalled();

        const [sql, params] = client.query.mock.calls[0];
        expect(sql).toContain('JOIN job_postings_with_status jp ON a.job_posting_id = jp.id');
        expect(sql).toContain('SELECT DISTINCT resource_id');
        expect(sql).toContain(') rp_job_acl ON rp_job_acl.resource_id = jp.id');
        expect(params).toEqual(expect.arrayContaining([
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
            'job_posting',
            'read'
        ]));
    });

    it('builds applicant status history ACL as a correlated EXISTS predicate', async () => {
        const repository = createStatusRepository({ db });

        await repository.getStatusHistoryByApplicantId(
            '55555555-5555-4555-8555-555555555555',
            {
                actorUserId: '66666666-6666-4666-8666-666666666666',
                minAccess: 'read'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('WHERE ash.applicant_id = $1');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).toContain('WHERE a.id = ash.applicant_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE a.id = $1 EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '55555555-5555-4555-8555-555555555555',
            '66666666-6666-4666-8666-666666666666',
            'job_posting',
            'read'
        ]));
    });

    it('creates applicant notes with an INSERT ... SELECT guarded by correlated EXISTS', async () => {
        const repository = createNotesRepository({ db });
        db.query
            .mockResolvedValueOnce({ rows: [{ id: '77777777-7777-4777-8777-777777777777' }] })
            .mockResolvedValueOnce({ rows: [] });

        await repository.createNote({
            applicant_id: '88888888-8888-4888-8888-888888888888',
            author_id: '99999999-9999-4999-8999-999999999999',
            note: 'Test note'
        }, {
            actorUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            minAccess: 'write'
        });

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('INSERT INTO applicant_notes');
        expect(sql).toContain('WHERE a.id = $1');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE a.id = $1\n                    EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '88888888-8888-4888-8888-888888888888',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'job_posting',
            'write'
        ]));
    });

    it('updates applicant notes with correlated ACL EXISTS tied to the target row alias', async () => {
        const repository = createNotesRepository({ db });
        db.query.mockResolvedValue({ rows: [] });

        await repository.updateNote(
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            'Updated note',
            {
                actorUserId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE applicant_notes an');
        expect(sql).toContain('WHERE a.id = an.applicant_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE a.id = an.applicant_id\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            'job_posting',
            'write'
        ]));
    });

    it('deletes applicant notes with correlated ACL EXISTS tied to the target row alias', async () => {
        const repository = createNotesRepository({ db });
        db.query.mockResolvedValue({ rows: [] });

        await repository.deleteNote(
            'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            {
                actorUserId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('DELETE FROM applicant_notes an');
        expect(sql).toContain('WHERE a.id = an.applicant_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE a.id = an.applicant_id\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            'job_posting',
            'write'
        ]));
    });

    it('updates attachment status with correlated ACL EXISTS tied to the attachment alias', async () => {
        const repository = createAttachmentsRepository({ db });
        db.query.mockResolvedValue({ rows: [] });

        await repository.updateStatus(
            'ffffffff-ffff-4fff-8fff-ffffffffffff',
            {
                status: 'approved',
                reviewed_by: '10101010-1010-4010-8010-101010101010',
                review_notes: 'Looks good'
            },
            {
                actorUserId: '11111111-2222-4333-8444-555555555555',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('UPDATE application_attachments aa');
        expect(sql).toContain('WHERE a.id = aa.applicant_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE a.id = aa.applicant_id\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            'ffffffff-ffff-4fff-8fff-ffffffffffff',
            '11111111-2222-4333-8444-555555555555',
            'job_posting',
            'write'
        ]));
    });

    it('deletes attachments with correlated ACL EXISTS tied to the attachment alias', async () => {
        const repository = createAttachmentsRepository({ db });
        db.query.mockResolvedValue({ rows: [] });

        await repository.delete(
            '12121212-1212-4212-8212-121212121212',
            {
                actorUserId: '13131313-1313-4313-8313-131313131313',
                minAccess: 'write'
            }
        );

        const [sql, params] = db.query.mock.calls[0];
        expect(sql).toContain('DELETE FROM application_attachments aa');
        expect(sql).toContain('WHERE a.id = aa.applicant_id');
        expect(sql).toContain('AND EXISTS (');
        expect(sql).not.toContain('WHERE a.id = aa.applicant_id\n                EXISTS');
        expect(params).toEqual(expect.arrayContaining([
            '12121212-1212-4212-8212-121212121212',
            '13131313-1313-4313-8313-131313131313',
            'job_posting',
            'write'
        ]));
    });
});
