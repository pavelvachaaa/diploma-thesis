const { createMockReq, createMockRes, createMockLogger } = require('../helpers');

const createApplicantsController = require('../../src/domain/applicants/controller');
const createInterviewsController = require('../../src/domain/interviews/controller');
const createChatController = require('../../src/domain/chat/controller');
const createEmployeesController = require('../../src/domain/employees/controller/adminEmployees.controller');
const createOnboardingDocumentsController = require('../../src/domain/onboardingDocuments/controller');

const passthroughIdempotencyService = () => ({
    execute: jest.fn(async (_options, handler) => handler())
});

describe('idempotent write controllers', () => {
    it('applicants applyForJob delegates write execution to command idempotency', async () => {
        const commandIdempotencyService = passthroughIdempotencyService();
        const controller = createApplicantsController({
            applicantsService: {
                createApplicant: jest.fn().mockResolvedValue({ id: 'app-1' }),
                getApplicantStatusHistory: jest.fn(),
                getApplicantNotes: jest.fn(),
                getAllApplicants: jest.fn(),
                getApplicantById: jest.fn(),
                getApplicantsByJobId: jest.fn(),
                updateApplicantStatus: jest.fn(),
                getAllStatuses: jest.fn(),
                getAttachmentsByApplicantId: jest.fn(),
                getAttachmentById: jest.fn(),
                createApplicantNote: jest.fn(),
                updateApplicantNote: jest.fn(),
                deleteApplicantNote: jest.fn(),
                updateAttachmentStatus: jest.fn(),
                getAllDocumentStatuses: jest.fn()
            },
            jobsService: {
                getJobDetail: jest.fn().mockResolvedValue({
                    id: 'job-1',
                    title: 'Nurse',
                    organization_id: 'org-1'
                })
            },
            documentsService: {
                storeApplicantAttachment: jest.fn().mockResolvedValue({ id: 'att-1' }),
                getApplicantAttachmentForDownload: jest.fn()
            },
            jobSeekersService: {
                getJobSeekerById: jest.fn()
            },
            emailService: {},
            fileDownload: { downloadFile: jest.fn() },
            commandIdempotencyService,
            logger: createMockLogger()
        });

        const req = createMockReq({
            params: { id: 'job-1' },
            body: {
                firstName: 'Jan',
                lastName: 'Novak',
                email: 'jan@example.com',
                phone: '123',
                gdprConsent: true
            },
            headers: {
                'Idempotency-Key': 'idem-apply-1'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.applyForJob(req, res, next);

        expect(commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'applicants.applyForJob',
                idempotencyKey: 'idem-apply-1'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('interviews create delegates write execution to command idempotency', async () => {
        const commandIdempotencyService = passthroughIdempotencyService();
        const controller = createInterviewsController({
            calendarService: {
                createInterview: jest.fn().mockResolvedValue({ id: 'int-1' })
            },
            applicantsService: {
                getApplicantById: jest.fn().mockResolvedValue({
                    id: 'app-1',
                    organization_id: 'org-1',
                    job_posting_id: 'job-1',
                    name: 'Jan',
                    surname: 'Novak'
                })
            },
            commandIdempotencyService,
            logger: createMockLogger(),
            fileDownload: { downloadFile: jest.fn() }
        });

        const req = createMockReq({
            body: {
                applicant_id: 'app-1',
                job_posting_id: 'job-1',
                title: 'Interview',
                scheduled_at: new Date().toISOString()
            },
            user: {
                id: 'user-1',
                roles: ['admin'],
                organizations: ['org-1']
            },
            headers: {
                'Idempotency-Key': 'idem-interview-create'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.create(req, res, next);

        expect(commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'interviews.create',
                idempotencyKey: 'idem-interview-create'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('chat sendMessage delegates write execution to command idempotency', async () => {
        const commandIdempotencyService = passthroughIdempotencyService();
        const controller = createChatController({
            chatService: {
                sendMessageWithAttachments: jest.fn().mockResolvedValue({ id: 'msg-1' })
            },
            commandIdempotencyService
        });

        const req = createMockReq({
            params: { withUserId: '00000000-0000-0000-0000-000000000002' },
            body: { body: 'hello' },
            headers: {
                'Idempotency-Key': 'idem-chat-send'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.sendMessage(req, res, next);

        expect(commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'chat.sendMessage',
                idempotencyKey: 'idem-chat-send'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('employees createEmployeeFromApplicant delegates write execution to command idempotency', async () => {
        const commandIdempotencyService = passthroughIdempotencyService();
        const controller = createEmployeesController({
            employeesService: {
                createEmployeeFromApplicant: jest.fn().mockResolvedValue({ id: 'emp-1' })
            },
            commandIdempotencyService,
            logger: createMockLogger()
        });

        const req = createMockReq({
            body: {
                applicant_id: 'app-1',
                onboarding_workflow_id: 'wf-1'
            },
            headers: {
                'Idempotency-Key': 'idem-employee-create'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.createEmployeeFromApplicantAdmin(req, res, next);

        expect(commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'employees.createFromApplicant',
                idempotencyKey: 'idem-employee-create'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('employees delete delegates write execution to command idempotency', async () => {
        const commandIdempotencyService = passthroughIdempotencyService();
        const controller = createEmployeesController({
            employeesService: {
                deleteEmployeeFully: jest.fn().mockResolvedValue({ id: 'emp-1' })
            },
            commandIdempotencyService,
            logger: createMockLogger()
        });

        const req = createMockReq({
            params: { id: 'emp-1' },
            user: {
                id: 'super-1',
                roles: ['super_admin']
            },
            headers: {
                'Idempotency-Key': 'idem-employee-delete'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.deleteEmployeeAdmin(req, res, next);

        expect(commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'employees.delete',
                idempotencyKey: 'idem-employee-delete'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('onboardingDocuments uploadUserDocument delegates write execution to command idempotency', async () => {
        const commandIdempotencyService = passthroughIdempotencyService();
        const controller = createOnboardingDocumentsController({
            onboardingDocumentsService: {
                storeUserDocument: jest.fn().mockResolvedValue({ id: 'user-doc-1' })
            },
            commandIdempotencyService,
            logger: createMockLogger()
        });

        const req = createMockReq({
            user: { id: 'user-1' },
            params: { documentId: 'doc-1' },
            file: {
                originalname: 'agreement.pdf',
                key: 'user-documents/agreement.pdf',
                bucket: 'documents',
                mimetype: 'application/pdf',
                size: 111
            },
            headers: {
                'Idempotency-Key': 'idem-upload-user-doc'
            }
        });
        const res = createMockRes();
        const next = jest.fn();

        await controller.uploadUserDocument(req, res, next);

        expect(commandIdempotencyService.execute).toHaveBeenCalledWith(
            expect.objectContaining({
                scope: 'onboardingDocuments.uploadUserDocument',
                idempotencyKey: 'idem-upload-user-doc'
            }),
            expect.any(Function)
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
