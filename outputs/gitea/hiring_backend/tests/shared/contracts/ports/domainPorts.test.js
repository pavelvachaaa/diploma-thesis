const createApplicantsQueryPort = require('../../../../src/shared/contracts/ports/applicantsQuery.port');
const createApplicantsStatusCommandPort = require('../../../../src/shared/contracts/ports/applicantsStatusCommand.port');
const createApplicantDocumentsQueryPort = require('../../../../src/shared/contracts/ports/applicantDocumentsQuery.port');
const createApplicantEmailPort = require('../../../../src/shared/contracts/ports/applicantEmail.port');
const createAuditQueryPort = require('../../../../src/shared/contracts/runtime/proxies/operations/auditQuery.proxy');
const createCvIntentPort = require('../../../../src/shared/contracts/runtime/proxies/cv/cvIntent.proxy');
const createEmailSenderPort = require('../../../../src/shared/contracts/ports/emailSender.port');
const createEmployeeDocumentPort = require('../../../../src/shared/contracts/ports/employeeDocument.port');
const createEmployeeOnboardingQueryPort = require('../../../../src/shared/contracts/ports/employeeOnboardingQuery.port');
const createEmployeeOnboardingStepPort = require('../../../../src/shared/contracts/ports/employeeOnboardingStep.port');
const createJobEmbeddingPort = require('../../../../src/shared/contracts/ports/jobEmbedding.port');
const createJobPermissionPort = require('../../../../src/shared/contracts/ports/jobPermission.port');
const createJobSeekerCvAnalysisQueryPort = require('../../../../src/shared/contracts/runtime/proxies/jobSeekerCvAnalysis/jobSeekerCvAnalysisQuery.proxy');
const createMembershipAccessPort = require('../../../../src/shared/contracts/ports/membershipAccess.port');
const createNotificationUrlPort = require('../../../../src/shared/contracts/ports/notificationUrl.port');
const createOnboardingStepsAdminPort = require('../../../../src/shared/contracts/ports/onboardingStepsAdmin.port');
const createOnboardingTemplateQueryPort = require('../../../../src/shared/contracts/ports/onboardingTemplateQuery.port');

describe('domain contract ports', () => {
    it('ApplicantsQueryPort delegates and composes applicant dossier with access options', async () => {
        const applicantsService = {
            getApplicantById: jest.fn().mockResolvedValue({ id: 'app-1', organization_id: 'org-1' }),
            getApplicantStatusHistory: jest.fn().mockResolvedValue([{ id: 'status-1' }]),
            getAttachmentsByApplicantId: jest.fn().mockResolvedValue([{ id: 'att-1' }]),
            getApplicantNotes: jest.fn().mockResolvedValue([{ id: 'note-1' }])
        };
        const port = createApplicantsQueryPort({ applicantsService });
        const accessOptions = { actorUserId: 'actor-1', minAccess: 'read' };

        const dossier = await port.getApplicantDossier('app-1', accessOptions);

        expect(dossier).toEqual({
            applicant: { id: 'app-1', organization_id: 'org-1' },
            history: [{ id: 'status-1' }],
            attachments: [{ id: 'att-1' }],
            notes: [{ id: 'note-1' }]
        });
        expect(applicantsService.getApplicantById).toHaveBeenCalledWith('app-1', accessOptions);
        expect(applicantsService.getApplicantStatusHistory).toHaveBeenCalledWith('app-1', accessOptions);
        expect(applicantsService.getAttachmentsByApplicantId).toHaveBeenCalledWith('app-1', accessOptions);
        expect(applicantsService.getApplicantNotes).toHaveBeenCalledWith('app-1', accessOptions);
    });

    it('ApplicantsStatusCommandPort delegates updateApplicantStatus with actor context', async () => {
        const applicantsService = {
            updateApplicantStatus: jest.fn().mockResolvedValue({ id: 'app-1', current_status: 'submitted' })
        };
        const port = createApplicantsStatusCommandPort({ applicantsService });

        await port.updateApplicantStatus('app-1', 'submitted', 'actor-1');

        expect(applicantsService.updateApplicantStatus).toHaveBeenCalledWith(
            'app-1',
            'submitted',
            'actor-1',
            null,
            {}
        );
    });

    it('AuditQueryPort delegates global and employee scoped reads', async () => {
        const operationsAuditApplication = {
            getEvents: jest.fn().mockResolvedValue({ data: [] }),
            getEmployeeEvents: jest.fn().mockResolvedValue({ data: [] })
        };
        const port = createAuditQueryPort({ operationsAuditApplication });

        await port.getEvents({ page: 0 }, { id: 'user-1' });
        await port.getEmployeeEvents('emp-1', { limit: 10 }, { id: 'super-1' });

        expect(operationsAuditApplication.getEvents).toHaveBeenCalledWith({ page: 0 }, { id: 'user-1' });
        expect(operationsAuditApplication.getEmployeeEvents).toHaveBeenCalledWith('emp-1', { limit: 10 }, { id: 'super-1' });
    });

    it('ApplicantDocumentsQueryPort delegates getApplicantAttachments', async () => {
        const documentsService = {
            getApplicantAttachments: jest.fn().mockResolvedValue([{ id: 'att-1' }])
        };
        const port = createApplicantDocumentsQueryPort({ documentsService });

        await port.getApplicantAttachments('app-1');

        expect(documentsService.getApplicantAttachments).toHaveBeenCalledWith('app-1');
    });

    it('ApplicantEmailPort delegates applicant email operations', async () => {
        const emailApplication = {
            sendApplicantEmail: jest.fn().mockResolvedValue({ success: true }),
            sendInterviewInvitation: jest.fn().mockResolvedValue({ success: true })
        };
        const port = createApplicantEmailPort({ emailApplication });

        await port.sendApplicantEmail({ to: 'a@example.com' });
        await port.sendInterviewInvitation({ to: 'a@example.com' });

        expect(emailApplication.sendApplicantEmail).toHaveBeenCalledWith({ to: 'a@example.com' });
        expect(emailApplication.sendInterviewInvitation).toHaveBeenCalledWith({ to: 'a@example.com' });
    });

    it('EmailSenderPort delegates sender operations', async () => {
        const emailApplication = {
            sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
            sendTestEmail: jest.fn().mockResolvedValue({ success: true }),
            sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
            getHealthStatus: jest.fn().mockResolvedValue({ healthy: true })
        };
        const port = createEmailSenderPort({ emailApplication });

        await port.sendCustomEmail({ to: 'a@example.com' });
        await port.sendTestEmail('a@example.com');
        await port.sendWelcomeEmail({ employee: { id: 'emp-1' } });
        await port.getHealthStatus();

        expect(emailApplication.sendCustomEmail).toHaveBeenCalledWith({ to: 'a@example.com' });
        expect(emailApplication.sendTestEmail).toHaveBeenCalledWith('a@example.com');
        expect(emailApplication.sendWelcomeEmail).toHaveBeenCalledWith({ employee: { id: 'emp-1' } });
        expect(emailApplication.getHealthStatus).toHaveBeenCalledWith();
    });

    it('EmployeeDocumentPort delegates employee document helpers', async () => {
        const onboardingDocumentsService = {
            getEmployeeDocumentForDownload: jest.fn().mockResolvedValue({ id: 'doc-1' }),
            storeUserDocument: jest.fn().mockResolvedValue({ id: 'user-doc-1' })
        };
        const port = createEmployeeDocumentPort({ onboardingDocumentsService });
        const file = { key: 'user-documents/a.pdf', bucket: 'documents', mimetype: 'application/pdf', size: 42 };

        await port.getEmployeeDocumentForDownload('emp-1', 'doc-1', { actorUserId: 'actor-1' });
        await port.storeUserDocument('emp-1', 'doc-1', file, { actorUserId: 'actor-1' });

        expect(onboardingDocumentsService.getEmployeeDocumentForDownload).toHaveBeenCalledWith(
            'emp-1',
            'doc-1',
            { actorUserId: 'actor-1' }
        );
        expect(onboardingDocumentsService.storeUserDocument).toHaveBeenCalledWith(
            'emp-1',
            'doc-1',
            file,
            { actorUserId: 'actor-1' }
        );
    });

    it('EmployeeOnboardingQueryPort delegates read operations and composes snapshot', async () => {
        const employeeOnboardingService = {
            getDashboardDataForEmployee: jest.fn().mockResolvedValue({ summary: 'ok' }),
            getOnboardingStepsForEmployee: jest.fn().mockResolvedValue([{ id: 'step-1' }]),
            getProgressForEmployee: jest.fn().mockResolvedValue({ completed: 1 })
        };
        const port = createEmployeeOnboardingQueryPort({ employeeOnboardingService });

        const snapshot = await port.getEmployeeOnboardingSnapshot('emp-1');

        expect(employeeOnboardingService.getDashboardDataForEmployee).toHaveBeenCalledWith('emp-1');
        expect(employeeOnboardingService.getOnboardingStepsForEmployee).toHaveBeenCalledWith('emp-1');
        expect(employeeOnboardingService.getProgressForEmployee).toHaveBeenCalledWith('emp-1');
        expect(snapshot).toEqual({
            dashboard: { summary: 'ok' },
            steps: [{ id: 'step-1' }],
            progress: { completed: 1 }
        });
    });

    it('EmployeeOnboardingStepPort delegates employee step lifecycle', async () => {
        const onboardingStepsService = {
            getStepDetailsForEmployee: jest.fn().mockResolvedValue({ id: 'detail-1' }),
            startStep: jest.fn().mockResolvedValue({ userStep: { id: 'user-step-1' } }),
            completeStep: jest.fn().mockResolvedValue({ userStep: { id: 'user-step-1' } })
        };
        const port = createEmployeeOnboardingStepPort({ onboardingStepsService });

        await port.getStepDetailsForEmployee('user-step-1', 'emp-1');
        await port.startStep('user-step-1', 'user-1');
        await port.completeStep('user-step-1', 'user-1');

        expect(onboardingStepsService.getStepDetailsForEmployee).toHaveBeenCalledWith('user-step-1', 'emp-1');
        expect(onboardingStepsService.startStep).toHaveBeenCalledWith('user-step-1', 'user-1');
        expect(onboardingStepsService.completeStep).toHaveBeenCalledWith('user-step-1', 'user-1');
    });

    it('OnboardingStepsAdminPort delegates admin step operations', async () => {
        const onboardingStepsService = {
            getAllSteps: jest.fn().mockResolvedValue([{ id: 'step-1' }]),
            createStep: jest.fn().mockResolvedValue({ id: 'step-1' }),
            updateStep: jest.fn().mockResolvedValue({ id: 'step-1' }),
            deleteStep: jest.fn().mockResolvedValue({ id: 'step-1' })
        };
        const port = createOnboardingStepsAdminPort({ onboardingStepsService });

        await port.getAllSteps('org-1', { actorUserId: 'actor-1' });
        await port.createStep({ title: 'Step' }, { actorUserId: 'actor-1' });
        await port.updateStep('step-1', { title: 'Updated' }, { actorUserId: 'actor-1' });
        await port.deleteStep('step-1', { actorUserId: 'actor-1' });

        expect(onboardingStepsService.getAllSteps).toHaveBeenCalledWith('org-1', { actorUserId: 'actor-1' });
        expect(onboardingStepsService.createStep).toHaveBeenCalledWith({ title: 'Step' }, { actorUserId: 'actor-1' });
        expect(onboardingStepsService.updateStep).toHaveBeenCalledWith('step-1', { title: 'Updated' }, { actorUserId: 'actor-1' });
        expect(onboardingStepsService.deleteStep).toHaveBeenCalledWith('step-1', { actorUserId: 'actor-1' });
    });

    it('OnboardingTemplateQueryPort delegates template lookup', async () => {
        const onboardingDocumentsService = {
            getOnboardingTemplateByFilename: jest.fn().mockResolvedValue({ id: 'tpl-1' })
        };
        const port = createOnboardingTemplateQueryPort({ onboardingDocumentsService });

        await port.getOnboardingTemplateByFilename('template.pdf');

        expect(onboardingDocumentsService.getOnboardingTemplateByFilename).toHaveBeenCalledWith('template.pdf');
    });

    it('CvIntentPort delegates publish intent operations', async () => {
        const cvService = {
            queueApplicantAttachmentPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
            queueApplicantReanalysisPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-2' }),
            queueJobSeekerCvPublishIntent: jest.fn().mockResolvedValue({ id: 'outbox-3' }),
            queueJobEmbeddingRequestIntent: jest.fn().mockResolvedValue({ id: 'outbox-4' })
        };
        const port = createCvIntentPort({ cvService });

        await port.queueApplicantAttachmentPublishIntent({ attachment: { id: 'att-1' } }, { client: { query: jest.fn() } });
        await port.queueApplicantReanalysisPublishIntent({ attachmentInfo: { attachment_id: 'att-1' } });
        await port.queueJobSeekerCvPublishIntent({ jobSeeker: { id: 'js-1' } });
        await port.queueJobEmbeddingRequestIntent({ job: { id: 'job-1' } });

        expect(cvService.queueApplicantAttachmentPublishIntent).toHaveBeenCalledWith(
            { attachment: { id: 'att-1' } },
            { client: { query: expect.any(Function) } }
        );
        expect(cvService.queueApplicantReanalysisPublishIntent).toHaveBeenCalledWith(
            { attachmentInfo: { attachment_id: 'att-1' } },
            {}
        );
        expect(cvService.queueJobSeekerCvPublishIntent).toHaveBeenCalledWith({ jobSeeker: { id: 'js-1' } }, {});
        expect(cvService.queueJobEmbeddingRequestIntent).toHaveBeenCalledWith({ job: { id: 'job-1' } }, {});
    });

    it('NotificationUrlPort wraps generated url into a DTO', async () => {
        const notificationService = {
            generateNotificationUrlForUser: jest.fn().mockResolvedValue('/chat?with=user-1')
        };
        const port = createNotificationUrlPort({ notificationService });

        const result = await port.generateNotificationUrlForUser('user-2', 'chat.message', { senderId: 'user-1' });

        expect(result).toEqual({ url: '/chat?with=user-1' });
        expect(notificationService.generateNotificationUrlForUser).toHaveBeenCalledWith(
            'user-2',
            'chat.message',
            { senderId: 'user-1' }
        );
    });

    it('JobSeekerCvAnalysisQueryPort delegates matching query with options object', async () => {
        const jobSeekerCvAnalysisService = {
            findMatchingJobSeekers: jest.fn().mockResolvedValue([{ id: 'js-1' }])
        };
        const port = createJobSeekerCvAnalysisQueryPort({ jobSeekerCvAnalysisService });
        const options = { organizationId: 'org-1', limit: 20, threshold: 0.5 };

        await port.findMatchingJobSeekers([0.1, 0.2], options);

        expect(jobSeekerCvAnalysisService.findMatchingJobSeekers).toHaveBeenCalledWith([0.1, 0.2], options);
    });

    it('JobEmbeddingPort delegates embedding read write helpers', async () => {
        const jobsApplication = {
            getOrRequestEmbedding: jest.fn().mockResolvedValue({ status: 'completed' }),
            getStatus: jest.fn().mockResolvedValue({ status: 'completed' })
        };
        const port = createJobEmbeddingPort({ jobsApplication });

        await port.getOrRequestEmbedding({ id: 'job-1' });
        await port.getStatus('job-1');

        expect(jobsApplication.getOrRequestEmbedding).toHaveBeenCalledWith({ id: 'job-1' });
        expect(jobsApplication.getStatus).toHaveBeenCalledWith('job-1');
    });

    it('MembershipAccessPort delegates membership access checks as a DTO contract', async () => {
        const rebacService = {
            ensureMembershipCreateAccess: jest.fn().mockResolvedValue(true)
        };
        const port = createMembershipAccessPort({ rebacService });

        const result = await port.ensureMembershipCreateAccess({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['hr', 'admin']
        });

        expect(result).toEqual({ granted: true });
        expect(rebacService.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['hr', 'admin']
        });
    });

    it('JobPermissionPort delegates and normalizes job assignment operations', async () => {
        const rebacService = {
            syncJobPostingPermissions: jest.fn().mockResolvedValue({ jobPostingId: 'job-1' }),
            replaceDirectJobAssignments: jest.fn().mockResolvedValue(['user-1']),
            getDirectJobAssignments: jest.fn().mockResolvedValue([{ userId: 'user-1' }])
        };
        const port = createJobPermissionPort({ rebacService });

        const replaced = await port.replaceDirectJobAssignments('job-1', ['user-1'], { client: { query: jest.fn() } });
        await port.syncJobPostingPermissions('job-1', { client: { query: jest.fn() } });
        await port.getDirectJobAssignments('job-1');

        expect(replaced).toEqual([{ userId: 'user-1' }]);
        expect(rebacService.syncJobPostingPermissions).toHaveBeenCalledWith('job-1', { client: expect.any(Object) });
        expect(rebacService.replaceDirectJobAssignments).toHaveBeenCalledWith('job-1', ['user-1'], { client: expect.any(Object) });
        expect(rebacService.getDirectJobAssignments).toHaveBeenCalledWith('job-1', {});
    });

});
