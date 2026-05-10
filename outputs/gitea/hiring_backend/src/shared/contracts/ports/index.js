module.exports = {
    createApplicantsQueryPort: require('./applicantsQuery.port'),
    createApplicantsStatusCommandPort: require('./applicantsStatusCommand.port'),
    createApplicantDocumentsQueryPort: require('./applicantDocumentsQuery.port'),
    createApplicantEmailPort: require('./applicantEmail.port'),
    createAuditQueryPort: require('./auditQuery.port'),
    createCvIntentPort: require('../runtime/proxies/cv/cvIntent.proxy'),
    createEmailSenderPort: require('./emailSender.port'),
    createEmployeeDocumentPort: require('./employeeDocument.port'),
    createEmployeeOnboardingQueryPort: require('./employeeOnboardingQuery.port'),
    createEmployeeOnboardingStepPort: require('./employeeOnboardingStep.port'),
    createJobEmbeddingPort: require('./jobEmbedding.port'),
    createJobPermissionPort: require('./jobPermission.port'),
    createJobSeekerCvAnalysisQueryPort: require('../runtime/proxies/jobSeekerCvAnalysis/jobSeekerCvAnalysisQuery.proxy'),
    createMembershipAccessPort: require('./membershipAccess.port'),
    createNotificationUrlPort: require('./notificationUrl.port'),
    createOnboardingStepsAdminPort: require('./onboardingStepsAdmin.port'),
    createOnboardingTemplateQueryPort: require('./onboardingTemplateQuery.port')
};
