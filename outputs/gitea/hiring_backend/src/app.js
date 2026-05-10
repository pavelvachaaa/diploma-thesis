const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { requestContextMiddleware } = require('@middlewares/requestContext.middleware');
const { accessLogMiddleware } = require('@middlewares/accessLog.middleware');
const errorHandler = require('@middlewares/errorHandler');
const { getReadinessStatus } = require('@/startup/server');
const { metricsHandler } = require('@platform/metrics');

const buildCorsOptions = () => ({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://onboarding.kzcr.eu',
        'https://kariera.kzcr.eu'
    ],
    credentials: true
});

const registerRoutes = (app, container, basePath) => {
    // Public API (for kariera.kzcr.eu career site)
    app.use(`${basePath}/auth`, container.resolve('publicAuthRoutes'));
    app.use(`${basePath}/jobs`, container.resolve('publicJobsRoutes'));
    app.use(`${basePath}/organizations`, container.resolve('publicOrganizationsRoutes'));
    app.use(`${basePath}/contract_types`, container.resolve('publicContractTypesRoutes'));
    app.use(`${basePath}/job_roles`, container.resolve('publicJobRolesRoutes'));
    app.use(`${basePath}/job_posting_statuses`, container.resolve('publicJobPostingStatusesRoutes'));
    app.use(`${basePath}/contact-inquiries`, container.resolve('publicContactInquiriesRoutes'));
    app.use(`${basePath}/contacts`, container.resolve('publicJobSeekersRoutes'));

    // Admin API (for admin panel)
    app.use(`${basePath}/admin/jobs`, container.resolve('adminJobsRoutes'));
    app.use(`${basePath}/admin/applicants`, container.resolve('adminApplicantsRoutes'));
    app.use(`${basePath}/admin/employees`, container.resolve('adminEmployeesRoutes'));
    const adminRoleAssignmentsRoutes = container.resolve('adminRoleAssignmentsRoutes');
    app.use(`${basePath}/admin/users`, adminRoleAssignmentsRoutes);
    app.use(`${basePath}/admin`, adminRoleAssignmentsRoutes); // Also mount for /organization-memberships/* routes
    app.use(`${basePath}/admin/organizations`, container.resolve('adminOrganizationsRoutes'));
    app.use(`${basePath}/admin/contract_types`, container.resolve('adminContractTypesRoutes'));
    app.use(`${basePath}/admin/job_roles`, container.resolve('adminJobRolesRoutes'));
    app.use(`${basePath}/admin/job_posting_statuses`, container.resolve('adminJobPostingStatusesRoutes'));
    app.use(`${basePath}/admin/document_types`, container.resolve('adminDocumentTypesRoutes'));
    app.use(`${basePath}/admin/onboarding-documents`, container.resolve('adminOnboardingDocsRoutes'));
    app.use(`${basePath}/admin/onboarding`, container.resolve('adminOnboardingFormsRoutes'));
    app.use(`${basePath}/admin/workflows`, container.resolve('adminWorkflowsRoutes'));
    app.use(`${basePath}/admin/job-seekers`, container.resolve('adminJobSeekersRoutes'));
    app.use(`${basePath}/admin/contact-inquiries`, container.resolve('adminContactInquiriesRoutes'));
    app.use(`${basePath}/admin/section-items`, container.resolve('adminSectionItemsRoutes'));
    app.use(`${basePath}/admin/interviews`, container.resolve('adminCalendarRoutes'));
    app.use(`${basePath}/admin/email-templates`, container.resolve('adminEmailTemplatesRoutes'));
    app.use(`${basePath}/admin/audit-events`, container.resolve('adminAuditRoutes'));
    app.use(`${basePath}/admin/outbox`, container.resolve('adminOutboxRoutes'));
    app.use(`${basePath}/admin/cv-analysis`, container.resolve('adminCvAnalysisRoutes'));
    app.use(`${basePath}/admin/qualifications`, container.resolve('adminQualificationsRoutes'));
    app.use(`${basePath}/admin/mzcr-accreditations`, container.resolve('adminMzcrAccreditationsRoutes'));
    app.use(`${basePath}/admin/internal-users`, container.resolve('adminInternalUsersRoutes'));
    app.use(`${basePath}/admin/ai-job-chat`, container.resolve('adminAiJobChatRoutes'));

    // Employee API (minimal - mostly placeholders)
    app.use(`${basePath}/employee/jobs`, container.resolve('employeeJobsRoutes'));
    app.use(`${basePath}/employee/applicants`, container.resolve('employeeApplicantsRoutes'));
    app.use(`${basePath}/employee/onboarding`, container.resolve('employeeOnboardingRoutes'));
    app.use(`${basePath}/employee/onboarding/steps`, container.resolve('employeeOnboardingStepsRoutes'));

    // Notification API (shared between admin, hr, and employee users)
    app.use(`${basePath}/notifications`, container.resolve('employeeNotificationRoutes'));

    // Chat API (shared between admin and employee users)
    app.use(`${basePath}/chat`, container.resolve('chatRoutes'));
};

const createApp = ({ container, basePath = process.env.API_PREFIX || '/api/v1' }) => {
    const app = express();

    app.use(cookieParser());
    app.use(cors(buildCorsOptions()));
    app.use(express.json());
    app.use(requestContextMiddleware);
    app.use(accessLogMiddleware);

    registerRoutes(app, container, basePath);
    app.get('/hrbackend/health', (_req, res) => res.send('OK'));
    app.get('/hrbackend/ready', (_req, res) => {
        const readiness = getReadinessStatus();
        res.status(readiness.ready ? 200 : 503).json(readiness);
    });
    app.get('/metrics', metricsHandler);

    app.use(errorHandler);

    return app;
};

module.exports = {
    createApp,
};
