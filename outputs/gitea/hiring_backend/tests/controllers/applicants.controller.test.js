const { createMockReq, createMockRes, createMockLogger } = require('../helpers');

const mockDownloadFile = jest.fn();

const createController = require('../../src/domain/applicants/controller');

const buildMocks = () => ({
    applicantsService: {
        createApplicant: jest.fn(),
        getAllApplicants: jest.fn(),
        getApplicantById: jest.fn(),
        getApplicantsByJobId: jest.fn(),
        updateApplicantStatus: jest.fn(),
        getApplicantStatusHistory: jest.fn(),
        getAllStatuses: jest.fn(),
        getAttachmentsByApplicantId: jest.fn(),
        getAttachmentById: jest.fn(),
        getApplicantNotes: jest.fn(),
        createApplicantNote: jest.fn(),
        updateApplicantNote: jest.fn(),
        deleteApplicantNote: jest.fn(),
        updateAttachmentStatus: jest.fn(),
        getAllDocumentStatuses: jest.fn(),
        sendEmailToApplicant: jest.fn(),
        scheduleInterviewInvitation: jest.fn(),
    },
    jobSeekersAccessPort: {
        getJobSeekerById: jest.fn(),
        getAttachmentsByJobSeekerId: jest.fn()
    },
    jobsService: {
        getJobDetail: jest.fn(),
    },
    documentsService: {
        storeApplicantAttachment: jest.fn(),
        getApplicantAttachmentForDownload: jest.fn(),
    },
    fileDownload: {
        downloadFile: mockDownloadFile
    },
    commandIdempotencyService: {
        execute: jest.fn(async (_options, handler) => handler())
    },
    logger: createMockLogger()
});

describe('applicants.controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createMockRes();
        next = jest.fn();
    });

    describe('applyForJob', () => {
        const job = {
            id: 'job-uuid-1',
            title: 'Nurse',
            organization_id: 'org-uuid-1',
            organization_name: 'Hospital',
            department: 'ICU',
            contract_type_label: 'Full-time',
        };

        it('should return 400 if required fields are missing', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: { firstName: 'Jan' }, // missing lastName, email, phone, gdprConsent
            });

            await controller.applyForJob(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('Missing required fields') })
            );
        });

        it('should return 404 if job does not exist', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: {
                    firstName: 'Jan',
                    lastName: 'Novák',
                    email: 'jan@example.com',
                    phone: '123456789',
                    gdprConsent: 'true',
                },
            });
            mocks.jobsService.getJobDetail.mockResolvedValue(null);

            await controller.applyForJob(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Job not found' });
        });

        it('should map frontend field names to DB field names', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: {
                    firstName: 'Jan',
                    lastName: 'Novák',
                    email: 'jan@example.com',
                    phone: '123456789',
                    gdprConsent: 'true',
                    lastEmployer: 'Old Corp',
                    lastPosition: 'Nurse',
                },
                files: [],
            });

            mocks.jobsService.getJobDetail.mockResolvedValue(job);
            mocks.applicantsService.createApplicant.mockResolvedValue({
                id: 'applicant-uuid-1',
                name: 'Jan',
                surname: 'Novák',
            });

            await controller.applyForJob(req, res, next);

            expect(mocks.applicantsService.createApplicant).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Jan',
                    surname: 'Novák',
                    last_employer: 'Old Corp',
                    last_position: 'Nurse',
                    gdpr_consent: true,
                    job_posting_id: 'job-uuid-1',
                    organization_id: 'org-uuid-1',
                })
            );
        });

        it('should convert gdprConsent string "true" to boolean', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: {
                    firstName: 'Jan',
                    lastName: 'Novák',
                    email: 'jan@example.com',
                    phone: '123456789',
                    gdprConsent: 'true',
                },
                files: [],
            });

            mocks.jobsService.getJobDetail.mockResolvedValue(job);
            mocks.applicantsService.createApplicant.mockResolvedValue({ id: 'app-1' });

            await controller.applyForJob(req, res, next);

            expect(mocks.applicantsService.createApplicant).toHaveBeenCalledWith(
                expect.objectContaining({ gdpr_consent: true })
            );
        });

        it('should call documentsService.storeApplicantAttachment for each uploaded file', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: {
                    firstName: 'Jan',
                    lastName: 'Novák',
                    email: 'jan@example.com',
                    phone: '123456789',
                    gdprConsent: 'true',
                },
                files: [
                    { originalname: 'cv.pdf', key: 's3-key-1', bucket: 'attachments', mimetype: 'application/pdf', size: 1024 },
                    { originalname: 'cover.pdf', key: 's3-key-2', bucket: 'attachments', mimetype: 'application/pdf', size: 2048 },
                ],
            });

            mocks.jobsService.getJobDetail.mockResolvedValue(job);
            mocks.applicantsService.createApplicant.mockResolvedValue({ id: 'app-1' });
            mocks.documentsService.storeApplicantAttachment.mockResolvedValue({
                id: 'att-1',
                original_filename: 'cv.pdf',
                mime_type: 'application/pdf',
                file_size: 1024,
            });

            await controller.applyForJob(req, res, next);

            expect(mocks.documentsService.storeApplicantAttachment).toHaveBeenCalledTimes(2);
            expect(mocks.documentsService.storeApplicantAttachment).toHaveBeenCalledWith('app-1', expect.objectContaining({
                originalName: 'cv.pdf',
                filename: 'cv.pdf',
                key: 's3-key-1',
                bucket: 'attachments',
                mimetype: 'application/pdf',
                size: 1024
            }));
        });

        it('should return 201 with applicant and attachments', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: {
                    firstName: 'Jan',
                    lastName: 'Novák',
                    email: 'jan@example.com',
                    phone: '123456789',
                    gdprConsent: 'true',
                },
                files: [],
            });

            const createdApplicant = { id: 'app-1', name: 'Jan' };
            mocks.jobsService.getJobDetail.mockResolvedValue(job);
            mocks.applicantsService.createApplicant.mockResolvedValue(createdApplicant);

            await controller.applyForJob(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Application submitted successfully',
                    applicant: createdApplicant,
                    attachments: [],
                    job: expect.objectContaining({ id: 'job-uuid-1', title: 'Nurse' }),
                })
            );
        });

        it('should pass errors to next()', async () => {
            const req = createMockReq({
                params: { id: 'job-uuid-1' },
                body: {
                    firstName: 'Jan',
                    lastName: 'Novák',
                    email: 'jan@example.com',
                    phone: '123456789',
                    gdprConsent: 'true',
                },
            });

            const error = new Error('DB connection failed');
            mocks.jobsService.getJobDetail.mockRejectedValue(error);

            await controller.applyForJob(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getAllApplicantsAdmin', () => {
        it('should parse pagination params with defaults', async () => {
            const req = createMockReq({ query: {} });
            mocks.applicantsService.getAllApplicants.mockResolvedValue({ applicants: [], total: 0 });

            await controller.getAllApplicantsAdmin(req, res, next);

            expect(mocks.applicantsService.getAllApplicants).toHaveBeenCalledWith({
                actorUserId: 'user-uuid-1',
                page: 1,
                limit: 10,
                search: '',
                status: '',
                organizationName: ''
            });
        });

        it('should pass organizationIds from req.organizationIds', async () => {
            const req = createMockReq({
                query: { page: '2', limit: '25' },
                organizationIds: ['org-1', 'org-2'],
            });
            mocks.applicantsService.getAllApplicants.mockResolvedValue({ applicants: [], total: 0 });

            await controller.getAllApplicantsAdmin(req, res, next);

            expect(mocks.applicantsService.getAllApplicants).toHaveBeenCalledWith({
                actorUserId: 'user-uuid-1',
                page: 2,
                limit: 25,
                search: '',
                status: '',
                organizationName: ''
            });
        });

        it('should pass null for super admin (no organizationIds)', async () => {
            const req = createMockReq({
                query: {},
                organizationIds: null,
            });
            mocks.applicantsService.getAllApplicants.mockResolvedValue({ applicants: [], total: 0 });

            await controller.getAllApplicantsAdmin(req, res, next);

            expect(mocks.applicantsService.getAllApplicants).toHaveBeenCalledWith({
                actorUserId: 'user-uuid-1',
                page: 1,
                limit: 10,
                search: '',
                status: '',
                organizationName: ''
            });
        });

        it('should delegate read filtering entirely to actor based ACL', async () => {
            const req = createMockReq({
                query: {},
                organizationIds: ['org-chomutov'],
                user: {
                    id: 'user-1',
                    roles: ['user']
                }
            });
            mocks.applicantsService.getAllApplicants.mockResolvedValue({ applicants: [], total: 0 });

            await controller.getAllApplicantsAdmin(req, res, next);

            expect(mocks.applicantsService.getAllApplicants).toHaveBeenCalledWith({
                actorUserId: 'user-1',
                page: 1,
                limit: 10,
                search: '',
                status: '',
                organizationName: ''
            });
        });
    });

    describe('updateApplicantStatusAdmin', () => {
        it('should pass status and notes to service', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: { status: 'under_review', notes: 'Looks good', changed_by: 'user-1' },
            });
            const updatedApplicant = { id: 'app-1', current_status: 'under_review' };
            mocks.applicantsService.updateApplicantStatus.mockResolvedValue(updatedApplicant);

            await controller.updateApplicantStatusAdmin(req, res, next);

            expect(mocks.applicantsService.updateApplicantStatus).toHaveBeenCalledWith(
                'app-1',
                'under_review',
                'user-1',
                'Looks good',
                {
                    actorUserId: 'user-uuid-1',
                    minAccess: 'write'
                }
            );
            expect(res.json).toHaveBeenCalledWith(updatedApplicant);
        });

        it('should pass errors to next()', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: { status: 'invalid' },
            });
            const error = new Error('Status not found');
            mocks.applicantsService.updateApplicantStatus.mockRejectedValue(error);

            await controller.updateApplicantStatusAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createApplicantAdmin', () => {
        it('copies CV and additional job seeker attachments when job_seeker_id is provided', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: {
                    name: 'Jan',
                    surname: 'Novák',
                    email: 'jan@example.com',
                    phone: '+420123456789',
                    job_posting_id: 'job-1',
                    organization_id: 'org-uuid-1',
                    job_seeker_id: 'seeker-1'
                },
                files: []
            });

            mocks.applicantsService.createApplicant.mockResolvedValue({
                id: 'app-1',
                name: 'Jan',
                surname: 'Novák'
            });
            mocks.jobSeekersAccessPort.getJobSeekerById.mockResolvedValue({
                id: 'seeker-1',
                cv_file_path: 'job-seekers/cv.pdf',
                cv_original_filename: 'cv.pdf',
                cv_mime_type: 'application/pdf',
                cv_file_size: 5000
            });
            mocks.jobSeekersAccessPort.getAttachmentsByJobSeekerId.mockResolvedValue([
                {
                    id: 'seeker-att-1',
                    file_path: 'job-seekers/portfolio.pdf',
                    original_filename: 'portfolio.pdf',
                    mime_type: 'application/pdf',
                    file_size: 1200,
                    bucket: 'cv-uploads'
                }
            ]);
            mocks.documentsService.storeApplicantAttachment
                .mockResolvedValueOnce({
                    id: 'att-cv',
                    original_filename: 'cv.pdf',
                    mime_type: 'application/pdf',
                    file_size: 5000
                })
                .mockResolvedValueOnce({
                    id: 'att-extra',
                    original_filename: 'portfolio.pdf',
                    mime_type: 'application/pdf',
                    file_size: 1200
                });

            await controller.createApplicantAdmin(req, res, next);

            expect(mocks.commandIdempotencyService.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    scope: 'applicants.createAdmin'
                }),
                expect.any(Function)
            );
            expect(mocks.documentsService.storeApplicantAttachment).toHaveBeenNthCalledWith(
                1,
                'app-1',
                expect.objectContaining({
                    key: 'job-seekers/cv.pdf',
                    filename: 'cv.pdf'
                })
            );
            expect(mocks.documentsService.storeApplicantAttachment).toHaveBeenNthCalledWith(
                2,
                'app-1',
                expect.objectContaining({
                    key: 'job-seekers/portfolio.pdf',
                    filename: 'portfolio.pdf',
                    bucket: 'cv-uploads'
                })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Applicant created successfully',
                    attachments: expect.arrayContaining([
                        expect.objectContaining({ id: 'att-cv' }),
                        expect.objectContaining({ id: 'att-extra' })
                    ])
                })
            );
        });
    });

    describe('createApplicantNoteAdmin', () => {
        it('should return 400 if note text is missing', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: {},
            });

            await controller.createApplicantNoteAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note text is required' });
        });

        it('should return 201 with created note', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: { note: 'Great candidate' },
            });
            const createdNote = { id: 'note-1', note: 'Great candidate', author_id: 'user-uuid-1' };
            mocks.applicantsService.createApplicantNote.mockResolvedValue(createdNote);

            await controller.createApplicantNoteAdmin(req, res, next);

            expect(mocks.applicantsService.createApplicantNote).toHaveBeenCalledWith({
                applicant_id: 'app-1',
                author_id: 'user-uuid-1',
                note: 'Great candidate',
            }, {
                actorUserId: 'user-uuid-1',
                minAccess: 'read'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(createdNote);
        });
    });

    describe('downloadAttachmentSecure', () => {
        it('should call applicantsService and downloadFile with correct params', async () => {
            const req = createMockReq({
                params: { attachmentId: 'att-1' },
            });
            const fileInfo = {
                file_path: 'applicant-attachments/file.pdf',
                original_name: 'cv.pdf',
                mime_type: 'application/pdf',
            };
            mocks.applicantsService.getAttachmentById.mockResolvedValue(fileInfo);

            await controller.downloadAttachmentSecure(req, res, next);

            expect(mocks.applicantsService.getAttachmentById).toHaveBeenCalledWith('att-1', {
                actorUserId: 'user-uuid-1',
                minAccess: 'read'
            });
            expect(mockDownloadFile).toHaveBeenCalledWith(
                res,
                fileInfo,
                req.user,
                'applicant-attachment',
                expect.objectContaining({
                    resourceId: 'att-1'
                })
            );
        });

        it('should pass errors to next()', async () => {
            const req = createMockReq({
                params: { attachmentId: 'att-1' },
            });
            const error = new Error('Attachment not found');
            mocks.applicantsService.getAttachmentById.mockRejectedValue(error);

            await controller.downloadAttachmentSecure(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('sendEmailToApplicantAdmin', () => {
        it('should return 400 if message is missing', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: {},
            });
            mocks.applicantsService.getApplicantById.mockResolvedValue({ id: 'app-1' });
            mocks.applicantsService.sendEmailToApplicant.mockResolvedValue({
                statusCode: 400,
                body: { message: 'Email message is required' }
            });

            await controller.sendEmailToApplicantAdmin(req, res, next);

            expect(mocks.applicantsService.sendEmailToApplicant).toHaveBeenCalledWith('app-1', {
                message: undefined,
                senderUser: req.user,
                files: []
            });
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email message is required' });
        });

        it('should return 404 if applicant does not exist', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: { message: 'Hello' },
            });
            mocks.applicantsService.getApplicantById.mockResolvedValue(null);
            mocks.applicantsService.sendEmailToApplicant.mockResolvedValue({
                statusCode: 404,
                body: { message: 'Applicant not found' }
            });

            await controller.sendEmailToApplicantAdmin(req, res, next);

            expect(mocks.applicantsService.getApplicantById).toHaveBeenCalledWith('app-1', {
                actorUserId: 'user-uuid-1',
                minAccess: 'read'
            });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Applicant not found' });
        });

        it('should return 200 on success', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: { message: 'Hello applicant' },
                files: [],
            });
            mocks.applicantsService.getApplicantById.mockResolvedValue({ id: 'app-1' });
            mocks.applicantsService.sendEmailToApplicant.mockResolvedValue({
                statusCode: 200,
                body: {
                    success: true,
                    message: 'Email byl úspěšně odeslán uchazeči'
                }
            });

            await controller.sendEmailToApplicantAdmin(req, res, next);

            expect(mocks.applicantsService.sendEmailToApplicant).toHaveBeenCalledWith('app-1', {
                message: 'Hello applicant',
                senderUser: req.user,
                files: []
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );
        });

        it('should return 500 on email dispatch failure', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: { message: 'Hello applicant' },
                files: [],
            });
            mocks.applicantsService.getApplicantById.mockResolvedValue({ id: 'app-1' });
            mocks.applicantsService.sendEmailToApplicant.mockResolvedValue({
                statusCode: 500,
                body: {
                    success: false,
                    message: 'Nepodařilo se odeslat email uchazeči',
                    error: 'smtp unavailable'
                }
            });

            await controller.sendEmailToApplicantAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, error: 'smtp unavailable' })
            );
        });
    });

    describe('scheduleInterviewAdmin', () => {
        it('delegates to applicantsService and preserves response shape', async () => {
            const req = createMockReq({
                params: { id: 'app-1' },
                body: {
                    dateTime: '2026-03-10T10:00:00.000Z',
                    location: 'Most',
                    locationType: 'office',
                    participants: 'HR Team',
                    notes: 'Bring CV copy'
                }
            });
            mocks.applicantsService.getApplicantById.mockResolvedValue({ id: 'app-1' });

            mocks.applicantsService.scheduleInterviewInvitation.mockResolvedValue({
                statusCode: 200,
                body: {
                    success: true,
                    message: 'Pozvánka na pohovor byla odeslána',
                    messageId: null,
                    sentTo: 'jan@example.com'
                }
            });

            await controller.scheduleInterviewAdmin(req, res, next);

            expect(mocks.applicantsService.scheduleInterviewInvitation).toHaveBeenCalledWith('app-1', {
                dateTime: '2026-03-10T10:00:00.000Z',
                location: 'Most',
                locationType: 'office',
                participants: 'HR Team',
                notes: 'Bring CV copy'
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Pozvánka na pohovor byla odeslána'
            }));
        });
    });

    describe('updateAttachmentStatusAdmin', () => {
        it('should return 400 if status is missing', async () => {
            const req = createMockReq({
                params: { attachmentId: 'att-1' },
                body: {},
            });

            await controller.updateAttachmentStatusAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Status is required' });
        });

        it('should return 404 if attachment not found', async () => {
            const req = createMockReq({
                params: { attachmentId: 'att-1' },
                body: { status: 'approved' },
            });
            mocks.applicantsService.getAttachmentById.mockResolvedValue(null);

            await controller.updateAttachmentStatusAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Attachment not found' });
        });

        it('should include reviewed_by from req.user.id in status data', async () => {
            const req = createMockReq({
                params: { attachmentId: 'att-1' },
                body: { status: 'approved', review_notes: 'All good' },
            });
            mocks.applicantsService.getAttachmentById.mockResolvedValue({ id: 'att-1' });
            mocks.applicantsService.updateAttachmentStatus.mockResolvedValue({
                id: 'att-1',
                status: 'approved',
            });

            await controller.updateAttachmentStatusAdmin(req, res, next);

            expect(mocks.applicantsService.updateAttachmentStatus).toHaveBeenCalledWith('att-1', {
                status: 'approved',
                reviewed_by: 'user-uuid-1',
                review_notes: 'All good',
            }, {
                actorUserId: 'user-uuid-1',
                minAccess: 'write'
            });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'approved' })
            );
        });
    });

    describe('getApplicantByIdAdmin', () => {
        it('should return 404 if applicant not found', async () => {
            const req = createMockReq({ params: { id: 'app-1' } });
            mocks.applicantsService.getApplicantById.mockResolvedValue(null);

            await controller.getApplicantByIdAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Applicant not found' });
        });

        it('should return applicant on success', async () => {
            const req = createMockReq({ params: { id: 'app-1' } });
            const applicant = { id: 'app-1', name: 'Jan' };
            mocks.applicantsService.getApplicantById.mockResolvedValue(applicant);

            await controller.getApplicantByIdAdmin(req, res, next);

            expect(res.json).toHaveBeenCalledWith(applicant);
        });
    });

    describe('updateApplicantStatus (public)', () => {
        it('should return 400 if statusName is missing', async () => {
            const req = createMockReq({
                params: { applicantId: 'app-1' },
                body: {},
            });

            await controller.updateApplicantStatus(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('statusName') })
            );
        });

        it('should pass req.user.id as changedBy', async () => {
            const req = createMockReq({
                params: { applicantId: 'app-1' },
                body: { statusName: 'under_review', notes: 'Starting review' },
            });
            const updatedApplicant = { id: 'app-1', current_status: 'under_review' };
            mocks.applicantsService.updateApplicantStatus.mockResolvedValue(updatedApplicant);

            await controller.updateApplicantStatus(req, res, next);

            expect(mocks.applicantsService.updateApplicantStatus).toHaveBeenCalledWith(
                'app-1',
                'under_review',
                'user-uuid-1',
                'Starting review',
                {
                    actorUserId: 'user-uuid-1',
                    minAccess: 'write'
                }
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Status updated successfully',
                    applicant: updatedApplicant,
                })
            );
        });
    });

    describe('deleteApplicantNoteAdmin', () => {
        it('should return 404 if note not found', async () => {
            const req = createMockReq({ params: { noteId: 'note-1' } });
            mocks.applicantsService.deleteApplicantNote.mockResolvedValue(null);

            await controller.deleteApplicantNoteAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return success message on delete', async () => {
            const req = createMockReq({ params: { noteId: 'note-1' } });
            mocks.applicantsService.deleteApplicantNote.mockResolvedValue({ id: 'note-1' });

            await controller.deleteApplicantNoteAdmin(req, res, next);

            expect(res.json).toHaveBeenCalledWith({ message: 'Note deleted successfully' });
        });
    });

    describe('updateApplicantNoteAdmin', () => {
        it('should return 400 if note text is missing', async () => {
            const req = createMockReq({
                params: { noteId: 'note-1' },
                body: {},
            });

            await controller.updateApplicantNoteAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 404 if note not found', async () => {
            const req = createMockReq({
                params: { noteId: 'note-1' },
                body: { note: 'Updated text' },
            });
            mocks.applicantsService.updateApplicantNote.mockResolvedValue(null);

            await controller.updateApplicantNoteAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return updated note on success', async () => {
            const req = createMockReq({
                params: { noteId: 'note-1' },
                body: { note: 'Updated text' },
            });
            const updatedNote = { id: 'note-1', note: 'Updated text' };
            mocks.applicantsService.updateApplicantNote.mockResolvedValue(updatedNote);

            await controller.updateApplicantNoteAdmin(req, res, next);

            expect(res.json).toHaveBeenCalledWith(updatedNote);
        });
    });
});
