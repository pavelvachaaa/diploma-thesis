describe('domain token bindings', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('resolves legacy service tokens from domain module bindings', () => {
        // eslint-disable-next-line global-require
        const container = require('../../src/container');

        const authService = container.resolve('authService');
        const applicantsService = container.resolve('applicantsService');
        const calendarService = container.resolve('calendarService');
        const documentsService = container.resolve('documentsService');
        const documentsRepository = container.resolve('documentsRepository');
        const cvService = container.resolve('cvService');
        const onboardingStepsService = container.resolve('onboardingStepsService');
        const notificationService = container.resolve('notificationService');
        const emailService = container.resolve('emailService');
        const jobsService = container.resolve('jobsService');
        const workflowsService = container.resolve('workflowsService');
        const onboardingDocumentsService = container.resolve('onboardingDocumentsService');
        const employeeOnboardingService = container.resolve('employeeOnboardingService');
        const chatService = container.resolve('chatService');
        const organizationsApplication = container.resolve('organizationsApplication');
        const roleAssignmentsApplication = container.resolve('roleAssignmentsApplication');
        const sectionItemsApplication = container.resolve('sectionItemsApplication');
        const jobSeekersService = container.resolve('jobSeekersService');
        const jobEmbeddingsService = container.resolve('jobEmbeddingsService');
        const contractTypesApplication = container.resolve('contractTypesApplication');
        const jobRolesApplication = container.resolve('jobRolesApplication');
        const documentTypesApplication = container.resolve('documentTypesApplication');
        const jobPostingStatusesApplication = container.resolve('jobPostingStatusesApplication');
        const aiJobChatApplication = container.resolve('aiJobChatApplication');
        const operationsAuditApplication = container.resolve('operationsAuditApplication');
        const operationsOutboxApplication = container.resolve('operationsOutboxApplication');
        const mzcrAccreditationsApplication = container.resolve('mzcrAccreditationsApplication');
        const cvAnalysisConsumerService = container.resolve('cvAnalysisConsumerService');
        const jobSeekerCvConsumerService = container.resolve('jobSeekerCvConsumerService');
        const jobEmbeddingsConsumerService = container.resolve('jobEmbeddingsConsumerService');

        expect(typeof authService.handleLocalLogin).toBe('function');
        expect(typeof applicantsService.createApplicant).toBe('function');
        expect(typeof calendarService.createInterview).toBe('function');
        expect(typeof documentsService.storeApplicantAttachment).toBe('function');
        expect(typeof documentsRepository.getApplicantAttachmentForDownload).toBe('function');
        expect(typeof cvService.queueApplicantAttachmentPublishIntent).toBe('function');
        expect(typeof onboardingStepsService.completeStep).toBe('function');
        expect(typeof notificationService.notifyUser).toBe('function');
        expect(typeof emailService.sendNotificationEmail).toBe('function');
        expect(typeof jobsService.createJob).toBe('function');
        expect(typeof workflowsService.create).toBe('function');
        expect(typeof onboardingDocumentsService.getAll).toBe('function');
        expect(typeof employeeOnboardingService.getDashboardData).toBe('function');
        expect(typeof chatService.sendMessageWithAttachments).toBe('function');
        expect(typeof organizationsApplication.getAll).toBe('function');
        expect(typeof roleAssignmentsApplication.getUserRole).toBe('function');
        expect(typeof sectionItemsApplication.getAllSectionTypes).toBe('function');
        expect(typeof jobSeekersService.getAllJobSeekers).toBe('function');
        expect(typeof jobEmbeddingsService.getOrRequestEmbedding).toBe('function');
        expect(typeof contractTypesApplication.getAll).toBe('function');
        expect(typeof jobRolesApplication.getAll).toBe('function');
        expect(typeof documentTypesApplication.getAll).toBe('function');
        expect(typeof jobPostingStatusesApplication.getAll).toBe('function');
        expect(typeof aiJobChatApplication.streamChat).toBe('function');
        expect(typeof operationsAuditApplication.getEvents).toBe('function');
        expect(typeof operationsOutboxApplication.getSummary).toBe('function');
        expect(typeof mzcrAccreditationsApplication.listMzcrAccreditations).toBe('function');
        expect(typeof mzcrAccreditationsApplication.getMzcrAccreditationMeta).toBe('function');
        expect(typeof cvAnalysisConsumerService.start).toBe('function');
        expect(typeof cvAnalysisConsumerService.saveAnalysis).toBe('function');
        expect(typeof jobSeekerCvConsumerService.start).toBe('function');
        expect(typeof jobSeekerCvConsumerService.saveAnalysis).toBe('function');
        expect(typeof jobEmbeddingsConsumerService.start).toBe('function');
        expect(typeof jobEmbeddingsConsumerService.saveResult).toBe('function');
    });
});
