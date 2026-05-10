const { getTestDb, getTestStorage, cleanup, teardown } = require('./setup');

const createFileService = require('../src/services/file.service');
const createApplicantsService = require('../src/domain/applicants/application');
const createApplicantsRepository = require('../src/repositories/applicants.repository');
const createAttachmentsRepository = require('../src/repositories/attachments.repository');
const createStatusRepository = require('../src/repositories/status.repository');
const createNotesRepository = require('../src/repositories/notes.repository');
const createJobsRepository = require('../src/repositories/jobs.repository');

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
};

// Helper to create an applicant quickly (reduces boilerplate)
const makeApplicantData = (overrides = {}) => ({
    name: 'Jan',
    surname: 'Novák',
    email: 'jan.novak@test.cz',
    phone: '+420111222333',
    gdpr_consent: true,
    current_status: 'submitted',
    ...overrides,
});

describe('Applicant integration', () => {
    let db;
    let storage;
    let fileService;
    let applicantsService;
    let applicantsRepo;
    let attachmentsRepo;
    let statusRepo;
    let notesRepo;
    let jobsRepo;

    // Mocked external services
    let mockNotificationService;
    let mockRabbitmqService;
    let mockCvAnalysisService;
    let mockEmailService;

    // Seed data IDs
    let orgId;
    let orgId2;
    let jobPostingId;
    let userId;

    beforeAll(async () => {
        db = getTestDb();
        storage = getTestStorage();
        await storage.ensureBuckets();

        mockNotificationService = { notifyRoleInOrg: jest.fn().mockResolvedValue({}) };
        mockRabbitmqService = { publishCVEvent: jest.fn().mockResolvedValue({}) };
        mockCvAnalysisService = { createPendingAnalysis: jest.fn().mockResolvedValue({}) };
        mockEmailService = {
            sendApplicationReceivedEmail: jest.fn().mockResolvedValue({}),
            sendApplicationUnderReviewEmail: jest.fn().mockResolvedValue({}),
            sendRejectionEmail: jest.fn().mockResolvedValue({}),
        };

        // Build real repositories with test DB
        applicantsRepo = createApplicantsRepository({ db });
        attachmentsRepo = createAttachmentsRepository({ db });
        statusRepo = createStatusRepository({ db });
        notesRepo = createNotesRepository({ db });
        jobsRepo = createJobsRepository({ db });

        // Build services with real repos + mocked externals
        fileService = createFileService({
            db,
            logger: mockLogger,
            storageService: storage,
            notificationService: mockNotificationService,
            rabbitmqService: mockRabbitmqService,
            cvAnalysisService: mockCvAnalysisService,
        });

        applicantsService = createApplicantsService({
            applicantsRepository: applicantsRepo,
            attachmentsRepository: attachmentsRepo,
            statusRepository: statusRepo,
            notesRepository: notesRepo,
            emailService: mockEmailService,
            jobsRepository: jobsRepo,
            logger: mockLogger,
        });

        // Seed: pick two organizations
        const orgResult = await db.query('SELECT id FROM organizations ORDER BY name LIMIT 2');
        orgId = orgResult.rows[0].id;
        orgId2 = orgResult.rows[1].id;

        // Seed: create a job posting
        const jpResult = await db.query(
            `INSERT INTO job_postings (id, title, description, organization_id, status)
             VALUES (gen_random_uuid(), 'Test Nurse Position', 'Nursing test position', $1, 'active')
             RETURNING id`,
            [orgId]
        );
        jobPostingId = jpResult.rows[0].id;

        // Seed: create a user (needed for notes author, status changed_by, attachment review)
        const userResult = await db.query(
            `INSERT INTO users (id, email, name, surname, organization_id)
             VALUES (gen_random_uuid(), 'hr@test.cz', 'Test', 'HR', $1)
             RETURNING id`,
            [orgId]
        );
        userId = userResult.rows[0].id;
    });

    afterEach(async () => {
        await db.query('DELETE FROM cv_analyses');
        await db.query('DELETE FROM application_attachments');
        await db.query('DELETE FROM applicant_status_history');
        await db.query('DELETE FROM applicant_notes');
        await db.query('DELETE FROM applicants');
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        await db.query('DELETE FROM job_postings WHERE id = $1', [jobPostingId]);
        await teardown();
    });

    // ===================================================================
    // FILE UPLOAD + S3 FLOW
    // ===================================================================

    describe('storeApplicantAttachment - full DB + S3 flow', () => {
        it('should insert attachment into DB and upload to S3', async () => {
            const applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );

            const pdfContent = Buffer.from('%PDF-1.4 fake pdf content for integration test');
            const s3Key = `applicant-attachments/test-${applicant.id}-${Date.now()}.pdf`;
            await storage.upload('attachments', s3Key, pdfContent, { contentType: 'application/pdf' });

            const attachment = await fileService.storeApplicantAttachment(applicant.id, {
                filename: `test-${applicant.id}.pdf`,
                originalName: 'zivotopis.pdf',
                mimetype: 'application/pdf',
                size: pdfContent.length,
                key: s3Key,
                bucket: 'attachments',
            });

            // DB record correct
            expect(attachment.id).toBeDefined();
            expect(attachment.applicant_id).toBe(applicant.id);
            expect(attachment.original_filename).toBe('zivotopis.pdf');
            expect(attachment.mime_type).toBe('application/pdf');
            expect(attachment.file_size).toBe(pdfContent.length);
            expect(attachment.file_path).toBe(s3Key);

            // Re-query confirms persistence
            const dbCheck = await db.query('SELECT * FROM application_attachments WHERE id = $1', [attachment.id]);
            expect(dbCheck.rows).toHaveLength(1);

            // S3 round-trip: downloaded content matches uploaded content
            const downloaded = await storage.download('attachments', s3Key);
            const chunks = [];
            for await (const chunk of downloaded.Body) { chunks.push(chunk); }
            expect(Buffer.concat(chunks)).toEqual(pdfContent);

            await storage.delete('attachments', s3Key);
        });

        it('should trigger CV processing for PDF attachments', async () => {
            const applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'eva@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            const s3Key = `applicant-attachments/cv-${applicant.id}-${Date.now()}.pdf`;
            await storage.upload('attachments', s3Key, Buffer.from('%PDF'), { contentType: 'application/pdf' });

            await fileService.storeApplicantAttachment(applicant.id, {
                filename: 'cv.pdf', originalName: 'cv_eva.pdf', mimetype: 'application/pdf',
                size: 4, key: s3Key, bucket: 'attachments',
            });

            expect(mockRabbitmqService.publishCVEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    applicant_id: applicant.id,
                    s3_key: s3Key,
                    mime_type: 'application/pdf',
                    job_title: 'Test Nurse Position',
                })
            );
            expect(mockCvAnalysisService.createPendingAnalysis).toHaveBeenCalledWith(
                expect.objectContaining({ applicant_id: applicant.id, organization_id: orgId })
            );
            await storage.delete('attachments', s3Key);
        });

        it('should NOT trigger CV processing for image attachments', async () => {
            const applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'karel@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            const s3Key = `applicant-attachments/photo-${applicant.id}.png`;
            await storage.upload('attachments', s3Key, Buffer.from('png'), { contentType: 'image/png' });

            await fileService.storeApplicantAttachment(applicant.id, {
                filename: 'photo.png', originalName: 'foto.png', mimetype: 'image/png',
                size: 3, key: s3Key, bucket: 'attachments',
            });

            expect(mockRabbitmqService.publishCVEvent).not.toHaveBeenCalled();
            await storage.delete('attachments', s3Key);
        });
    });

    // ===================================================================
    // APPLICANT SERVICE — CREATE + STATUS WORKFLOW
    // ===================================================================

    describe('applicantsService.createApplicant', () => {
        it('should create applicant with submitted status and initial history entry', async () => {
            const applicant = await applicantsService.createApplicant({
                name: 'Alena',
                surname: 'Služební',
                email: 'alena@test.cz',
                phone: '+420000111222',
                gdpr_consent: true,
                job_posting_id: jobPostingId,
                organization_id: orgId,
            });

            expect(applicant.id).toBeDefined();
            expect(applicant.current_status).toBe('submitted');

            // Status history row created automatically
            const history = await statusRepo.getStatusHistoryByApplicantId(applicant.id);
            expect(history).toHaveLength(1);
            expect(history[0].status_name).toBe('submitted');
            expect(history[0].changed_by).toBeNull(); // system-created
            expect(history[0].notes).toBe('Přihláška byla automaticky odeslána');
        });

        it('should trigger application received email asynchronously', async () => {
            await applicantsService.createApplicant({
                name: 'Email',
                surname: 'Test',
                email: 'email@test.cz',
                phone: '+420111',
                gdpr_consent: true,
                job_posting_id: jobPostingId,
                organization_id: orgId,
            });

            // setImmediate fires the callback, but the callback itself does async DB queries
            // (getJobById) so we need to wait for those to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockEmailService.sendApplicationReceivedEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    applicant: expect.objectContaining({ email: 'email@test.cz' }),
                    job: expect.objectContaining({ title: 'Test Nurse Position' }),
                })
            );
        });
    });

    describe('applicantsService.updateApplicantStatus', () => {
        let applicantId;

        beforeEach(async () => {
            const applicant = await applicantsService.createApplicant({
                name: 'Status',
                surname: 'Flow',
                email: 'status@test.cz',
                phone: '+420222',
                gdpr_consent: true,
                job_posting_id: jobPostingId,
                organization_id: orgId,
            });
            applicantId = applicant.id;
        });

        it('should update status and create history entry', async () => {
            const updated = await applicantsService.updateApplicantStatus(
                applicantId, 'under_review', userId, 'Reviewing now'
            );

            expect(updated.current_status).toBe('under_review');

            // Two history entries: submitted (auto) + under_review
            const history = await statusRepo.getStatusHistoryByApplicantId(applicantId);
            expect(history).toHaveLength(2);
            // Most recent first (ORDER BY changed_at DESC)
            expect(history[0].status_name).toBe('under_review');
            expect(history[0].changed_by).toBe(userId);
            expect(history[0].notes).toBe('Reviewing now');
            expect(history[1].status_name).toBe('submitted');
        });

        it('should walk through the full status lifecycle', async () => {
            await applicantsService.updateApplicantStatus(applicantId, 'under_review', userId);
            await applicantsService.updateApplicantStatus(applicantId, 'interview_scheduled', userId);
            await applicantsService.updateApplicantStatus(applicantId, 'interview_completed', userId);
            await applicantsService.updateApplicantStatus(applicantId, 'accepted', userId, 'Welcome aboard!');

            // Verify final status
            const applicant = await applicantsRepo.getApplicantById(applicantId);
            expect(applicant.current_status).toBe('accepted');

            // 5 history entries total
            const history = await statusRepo.getStatusHistoryByApplicantId(applicantId);
            expect(history).toHaveLength(5);
            expect(history.map(h => h.status_name)).toEqual([
                'accepted', 'interview_completed', 'interview_scheduled', 'under_review', 'submitted'
            ]);
        });

        it('should reject invalid status names', async () => {
            await expect(
                applicantsService.updateApplicantStatus(applicantId, 'nonexistent_status', userId)
            ).rejects.toThrow("Status 'nonexistent_status' not found");
        });

        it('should trigger under_review email', async () => {
            await applicantsService.updateApplicantStatus(applicantId, 'under_review', userId);
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockEmailService.sendApplicationUnderReviewEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    applicant: expect.objectContaining({ id: applicantId }),
                    job: expect.objectContaining({ title: 'Test Nurse Position' }),
                })
            );
        });

        it('should trigger rejection email with notes', async () => {
            await applicantsService.updateApplicantStatus(
                applicantId, 'rejected', userId, 'Position filled'
            );
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockEmailService.sendRejectionEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    applicant: expect.objectContaining({ id: applicantId }),
                    notes: 'Position filled',
                })
            );
        });
    });

    // ===================================================================
    // STATUS REPOSITORY
    // ===================================================================

    describe('statusRepository', () => {
        it('getAllStatuses should return seeded statuses in workflow order', async () => {
            const statuses = await statusRepo.getAllStatuses();

            expect(statuses.length).toBeGreaterThanOrEqual(7);
            const names = statuses.map(s => s.name);
            expect(names[0]).toBe('submitted');
            expect(names[1]).toBe('under_review');
            expect(names).toContain('accepted');
            expect(names).toContain('rejected');
        });

        it('getStatusByName should return status details', async () => {
            const status = await statusRepo.getStatusByName('submitted');
            expect(status).toBeDefined();
            expect(status.name).toBe('submitted');
            expect(status.description).toBeDefined();
        });

        it('getStatusByName should return undefined for invalid name', async () => {
            const status = await statusRepo.getStatusByName('fake_status');
            expect(status).toBeUndefined();
        });
    });

    // ===================================================================
    // ATTACHMENTS REPOSITORY
    // ===================================================================

    describe('attachmentsRepository', () => {
        let applicant;

        beforeEach(async () => {
            applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );
        });

        it('should create and retrieve attachments by applicant', async () => {
            const att1 = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'cv.pdf',
                original_filename: 'zivotopis.pdf',
                mime_type: 'application/pdf',
                file_size: 1000,
                file_path: 'applicant-attachments/cv-1.pdf',
            });
            const att2 = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'cert.pdf',
                original_filename: 'certifikat.pdf',
                mime_type: 'application/pdf',
                file_size: 2000,
                file_path: 'applicant-attachments/cert-1.pdf',
            });

            const attachments = await attachmentsRepo.getByApplicantId(applicant.id);
            expect(attachments).toHaveLength(2);
            // Includes joined status info
            expect(attachments[0]).toHaveProperty('status_description');
            expect(attachments[0]).toHaveProperty('status_color');
        });

        it('getById should return single attachment', async () => {
            const created = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'doc.pdf',
                original_filename: 'dokument.pdf',
                mime_type: 'application/pdf',
                file_size: 500,
                file_path: 'applicant-attachments/doc-1.pdf',
            });

            const found = await attachmentsRepo.getById(created.id);
            expect(found.id).toBe(created.id);
            expect(found.original_filename).toBe('dokument.pdf');
        });

        it('getById should return null for missing attachment', async () => {
            const found = await attachmentsRepo.getById('00000000-0000-0000-0000-000000000000');
            expect(found).toBeNull();
        });

        it('updateStatus should set review fields', async () => {
            const created = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'rev.pdf',
                original_filename: 'review.pdf',
                mime_type: 'application/pdf',
                file_size: 300,
                file_path: 'applicant-attachments/rev-1.pdf',
            });

            const updated = await attachmentsRepo.updateStatus(created.id, {
                status: 'approved',
                reviewed_by: userId,
                review_notes: 'Looks good',
            });

            expect(updated.status).toBe('approved');
            expect(updated.reviewed_by).toBe(userId);
            expect(updated.review_notes).toBe('Looks good');
            expect(updated.reviewed_at).toBeDefined();
        });

        it('delete should remove attachment and return deleted row', async () => {
            const created = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'del.pdf',
                original_filename: 'delete_me.pdf',
                mime_type: 'application/pdf',
                file_size: 100,
                file_path: 'applicant-attachments/del-1.pdf',
            });

            const deleted = await attachmentsRepo.delete(created.id);
            expect(deleted.id).toBe(created.id);

            const check = await attachmentsRepo.getById(created.id);
            expect(check).toBeNull();
        });

        it('getAllStatuses should return document statuses', async () => {
            const statuses = await attachmentsRepo.getAllStatuses();
            const names = statuses.map(s => s.name);
            expect(names).toContain('pending');
            expect(names).toContain('approved');
            expect(names).toContain('rejected');
        });

        it('getByIdWithApplicant should include organization_id', async () => {
            const created = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'org.pdf',
                original_filename: 'org_check.pdf',
                mime_type: 'application/pdf',
                file_size: 200,
                file_path: 'applicant-attachments/org-1.pdf',
            });

            const found = await attachmentsRepo.getByIdWithApplicant(created.id);
            expect(found.organization_id).toBe(orgId);
            expect(found.applicant_id).toBe(applicant.id);
        });
    });

    // ===================================================================
    // NOTES CRUD
    // ===================================================================

    describe('notesRepository', () => {
        let applicant;

        beforeEach(async () => {
            applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );
        });

        it('should create a note with author', async () => {
            const note = await notesRepo.createNote({
                applicant_id: applicant.id,
                author_id: userId,
                note: 'Promising candidate',
            });

            expect(note.id).toBeDefined();
            expect(note.applicant_id).toBe(applicant.id);
            expect(note.author_id).toBe(userId);
            expect(note.note).toBe('Promising candidate');
            expect(note.created_at).toBeDefined();
        });

        it('should create a note without author (system note)', async () => {
            const note = await notesRepo.createNote({
                applicant_id: applicant.id,
                author_id: null,
                note: 'Auto-generated note',
            });

            expect(note.author_id).toBeNull();
        });

        it('should list notes for an applicant with author details', async () => {
            await notesRepo.createNote({ applicant_id: applicant.id, author_id: userId, note: 'First' });
            await notesRepo.createNote({ applicant_id: applicant.id, author_id: userId, note: 'Second' });
            await notesRepo.createNote({ applicant_id: applicant.id, author_id: null, note: 'Third' });

            const notes = await notesRepo.getNotesByApplicantId(applicant.id);
            expect(notes).toHaveLength(3);
            // Most recent first
            expect(notes[0].note).toBe('Third');
            // Author details from JOIN
            expect(notes[2].author_name).toBe('Test');
            expect(notes[2].author_surname).toBe('HR');
            expect(notes[2].author_email).toBe('hr@test.cz');
        });

        it('should update a note', async () => {
            const note = await notesRepo.createNote({
                applicant_id: applicant.id, author_id: userId, note: 'Original text',
            });

            const updated = await notesRepo.updateNote(note.id, 'Updated text');
            expect(updated.note).toBe('Updated text');
            expect(new Date(updated.updated_at).getTime())
                .toBeGreaterThanOrEqual(new Date(note.updated_at).getTime());
        });

        it('should delete a note', async () => {
            const note = await notesRepo.createNote({
                applicant_id: applicant.id, author_id: userId, note: 'To delete',
            });

            const deleted = await notesRepo.deleteNote(note.id);
            expect(deleted.id).toBe(note.id);

            const remaining = await notesRepo.getNotesByApplicantId(applicant.id);
            expect(remaining).toHaveLength(0);
        });

        it('getNoteById should return note with author details', async () => {
            const created = await notesRepo.createNote({
                applicant_id: applicant.id, author_id: userId, note: 'Lookup test',
            });

            const note = await notesRepo.getNoteById(created.id);
            expect(note.note).toBe('Lookup test');
            expect(note.author_email).toBe('hr@test.cz');
        });
    });

    // ===================================================================
    // APPLICANTS REPOSITORY — QUERIES & PAGINATION
    // ===================================================================

    describe('applicantsRepository - queries', () => {
        it('getApplicantById should return enriched applicant data', async () => {
            const created = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );

            const applicant = await applicantsRepo.getApplicantById(created.id);
            expect(applicant.job_title).toBe('Test Nurse Position');
            expect(applicant.organization_name).toBeDefined();
            expect(applicant.current_status_name).toBe('submitted');
            expect(applicant.current_status_description).toBeDefined();
        });

        it('getApplicantById should return undefined for nonexistent id', async () => {
            const result = await applicantsRepo.getApplicantById('00000000-0000-0000-0000-000000000000');
            expect(result).toBeUndefined();
        });

        it('getApplicantsByJobId should return applicants for a job', async () => {
            await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'a1@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'a2@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );

            const applicants = await applicantsRepo.getApplicantsByJobId(jobPostingId);
            expect(applicants).toHaveLength(2);
            expect(applicants[0].job_title).toBe('Test Nurse Position');
        });

        it('getAllApplicants should return empty for wrong org', async () => {
            await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );

            const result = await applicantsRepo.getAllApplicants(1, 10, orgId2);
            expect(result.data).toHaveLength(0);
            expect(result.pagination.total).toBe(0);
        });

        it('getAllApplicants should return paginated results scoped to org', async () => {
            // Create 3 applicants
            for (let i = 0; i < 3; i++) {
                await applicantsRepo.createApplicant(
                    makeApplicantData({
                        email: `pag${i}@test.cz`,
                        job_posting_id: jobPostingId,
                        organization_id: orgId,
                    })
                );
            }

            // Page 1, limit 2
            const page1 = await applicantsRepo.getAllApplicants(1, 2, orgId);
            expect(page1.data).toHaveLength(2);
            expect(page1.pagination.total).toBe(3);
            expect(page1.pagination.totalPages).toBe(2);
            expect(page1.pagination.hasNext).toBe(true);
            expect(page1.pagination.hasPrev).toBe(false);

            // Page 2, limit 2
            const page2 = await applicantsRepo.getAllApplicants(2, 2, orgId);
            expect(page2.data).toHaveLength(1);
            expect(page2.pagination.hasNext).toBe(false);
            expect(page2.pagination.hasPrev).toBe(true);
        });

        it('getAllApplicants should filter by search term', async () => {
            await applicantsRepo.createApplicant(
                makeApplicantData({
                    name: 'Unique',
                    surname: 'Candidate',
                    email: 'unique@test.cz',
                    job_posting_id: jobPostingId,
                    organization_id: orgId,
                })
            );
            await applicantsRepo.createApplicant(
                makeApplicantData({
                    name: 'Other',
                    surname: 'Person',
                    email: 'other@test.cz',
                    job_posting_id: jobPostingId,
                    organization_id: orgId,
                })
            );

            const result = await applicantsRepo.getAllApplicants(1, 10, orgId, 'Unique');
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Unique');
        });

        it('getAllApplicants should filter by status', async () => {
            const a1 = await applicantsRepo.createApplicant(
                makeApplicantData({ email: 's1@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            await applicantsRepo.createApplicant(
                makeApplicantData({ email: 's2@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            // Change one status
            await applicantsRepo.updateApplicantStatus(a1.id, 'under_review');

            const submitted = await applicantsRepo.getAllApplicants(1, 10, orgId, '', 'submitted');
            expect(submitted.data).toHaveLength(1);

            const underReview = await applicantsRepo.getAllApplicants(1, 10, orgId, '', 'under_review');
            expect(underReview.data).toHaveLength(1);
        });

        it('getAllApplicants should support comma-separated status filter', async () => {
            const a1 = await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'ms1@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            const a2 = await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'ms2@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );
            await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'ms3@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );

            await applicantsRepo.updateApplicantStatus(a1.id, 'under_review');
            await applicantsRepo.updateApplicantStatus(a2.id, 'rejected');

            const result = await applicantsRepo.getAllApplicants(1, 10, orgId, '', 'under_review,rejected');
            expect(result.data).toHaveLength(2);
        });

        it('getAllApplicants with null org should return all (super admin)', async () => {
            await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'sa@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );

            const result = await applicantsRepo.getAllApplicants(1, 10, null);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
        });

        it('getAllApplicants should support array of org IDs', async () => {
            await applicantsRepo.createApplicant(
                makeApplicantData({ email: 'arr@test.cz', job_posting_id: jobPostingId, organization_id: orgId })
            );

            const result = await applicantsRepo.getAllApplicants(1, 10, [orgId, orgId2]);
            expect(result.data).toHaveLength(1); // only orgId has data
        });
    });

    // ===================================================================
    // APPLICANT REPOSITORY — CREATION & FK VALIDATION
    // ===================================================================

    describe('applicant creation via repository', () => {
        it('should persist applicant with all fields and correct FK references', async () => {
            const applicant = await applicantsRepo.createApplicant({
                name: 'Petr',
                surname: 'Kompletní',
                email: 'petr@test.cz',
                phone: '+420111000111',
                address: 'Ulice 42',
                city: 'Brno',
                zip: '60200',
                education: 'SŠ',
                field: 'Zdravotnický asistent',
                experience: '1 rok',
                last_employer: 'Ambulance',
                last_position: 'Asistent',
                gdpr_consent: true,
                current_status: 'submitted',
                job_posting_id: jobPostingId,
                organization_id: orgId,
            });

            const result = await db.query('SELECT * FROM applicants WHERE id = $1', [applicant.id]);
            const row = result.rows[0];

            expect(row.name).toBe('Petr');
            expect(row.surname).toBe('Kompletní');
            expect(row.email).toBe('petr@test.cz');
            expect(row.organization_id).toBe(orgId);
            expect(row.job_posting_id).toBe(jobPostingId);
            expect(row.current_status).toBe('submitted');
            expect(row.gdpr_consent).toBe(true);
            expect(row.applied_at).toBeDefined();
        });

        it('should reject invalid FK references', async () => {
            await expect(
                applicantsRepo.createApplicant({
                    name: 'Bad', surname: 'Ref', email: 'bad@test.cz',
                    gdpr_consent: false, current_status: 'submitted',
                    job_posting_id: jobPostingId,
                    organization_id: '00000000-0000-0000-0000-000000000001',
                })
            ).rejects.toThrow();
        });

        it('should reject invalid status FK', async () => {
            await expect(
                applicantsRepo.createApplicant(
                    makeApplicantData({
                        current_status: 'totally_fake',
                        job_posting_id: jobPostingId,
                        organization_id: orgId,
                    })
                )
            ).rejects.toThrow();
        });
    });

    // ===================================================================
    // FILE SERVICE — DOWNLOAD HELPERS
    // ===================================================================

    describe('getApplicantAttachmentForDownload', () => {
        it('should return correct file info from DB', async () => {
            const applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );
            const s3Key = `applicant-attachments/dl-test-${Date.now()}.pdf`;
            await storage.upload('attachments', s3Key, Buffer.from('%PDF'), { contentType: 'application/pdf' });

            const attachment = await fileService.storeApplicantAttachment(applicant.id, {
                filename: 'dl.pdf', originalName: 'stazeny_soubor.pdf', mimetype: 'application/pdf',
                size: 4, key: s3Key, bucket: 'attachments',
            });

            const fileInfo = await fileService.getApplicantAttachmentForDownload(attachment.id);
            expect(fileInfo.file_path).toBe(s3Key);
            expect(fileInfo.original_name).toBe('stazeny_soubor.pdf');
            expect(fileInfo.mime_type).toBe('application/pdf');

            await storage.delete('attachments', s3Key);
        });

        it('should throw when attachment does not exist', async () => {
            await expect(
                fileService.getApplicantAttachmentForDownload('00000000-0000-0000-0000-000000000000')
            ).rejects.toThrow('Attachment not found');
        });
    });

    // ===================================================================
    // NOTES VIA SERVICE LAYER
    // ===================================================================

    describe('applicantsService notes methods', () => {
        let applicant;

        beforeEach(async () => {
            applicant = await applicantsService.createApplicant({
                name: 'Note',
                surname: 'Subject',
                email: 'notes@test.cz',
                phone: '+420333',
                gdpr_consent: true,
                job_posting_id: jobPostingId,
                organization_id: orgId,
            });
        });

        it('should create, list, update, and delete notes through service', async () => {
            // Create
            const note = await applicantsService.createApplicantNote({
                applicant_id: applicant.id,
                author_id: userId,
                note: 'Service-level note',
            });
            expect(note.id).toBeDefined();

            // List
            const notes = await applicantsService.getApplicantNotes(applicant.id);
            expect(notes).toHaveLength(1);
            expect(notes[0].note).toBe('Service-level note');

            // Update
            const updated = await applicantsService.updateApplicantNote(note.id, 'Updated via service');
            expect(updated.note).toBe('Updated via service');

            // Delete
            const deleted = await applicantsService.deleteApplicantNote(note.id);
            expect(deleted.id).toBe(note.id);

            const remaining = await applicantsService.getApplicantNotes(applicant.id);
            expect(remaining).toHaveLength(0);
        });
    });

    // ===================================================================
    // ATTACHMENT STATUS VIA SERVICE LAYER
    // ===================================================================

    describe('applicantsService attachment status', () => {
        it('should update attachment status and list document statuses', async () => {
            const applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );
            const att = await attachmentsRepo.create({
                applicant_id: applicant.id,
                filename: 'status.pdf',
                original_filename: 'status_test.pdf',
                mime_type: 'application/pdf',
                file_size: 100,
                file_path: 'applicant-attachments/status-1.pdf',
            });

            // Update via service
            const updated = await applicantsService.updateAttachmentStatus(att.id, {
                status: 'rejected',
                reviewed_by: userId,
                review_notes: 'Wrong document',
            });
            expect(updated.status).toBe('rejected');
            expect(updated.review_notes).toBe('Wrong document');

            // List all document statuses
            const statuses = await applicantsService.getAllDocumentStatuses();
            expect(statuses.length).toBeGreaterThanOrEqual(3);
        });
    });

    // ===================================================================
    // getNoteByIdWithApplicant (used by org middleware)
    // ===================================================================

    describe('applicantsRepository.getNoteByIdWithApplicant', () => {
        it('should return note with applicant organization_id', async () => {
            const applicant = await applicantsRepo.createApplicant(
                makeApplicantData({ job_posting_id: jobPostingId, organization_id: orgId })
            );
            const note = await notesRepo.createNote({
                applicant_id: applicant.id,
                author_id: userId,
                note: 'Middleware check',
            });

            const result = await applicantsRepo.getNoteByIdWithApplicant(note.id);
            expect(result).toBeDefined();
            expect(result.organization_id).toBe(orgId);
            expect(result.note).toBe('Middleware check');
        });

        it('should return null for nonexistent note', async () => {
            const result = await applicantsRepo.getNoteByIdWithApplicant('00000000-0000-0000-0000-000000000000');
            expect(result).toBeNull();
        });
    });
});
