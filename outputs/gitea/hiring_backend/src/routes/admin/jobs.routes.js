module.exports = ({ jobsController, applicantsController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const {
        ADMIN_HR_AUTHORIZED_PERSON_ROLES,
        ADMIN_HR_ROLES
    } = require('@shared/auth/roles');
    const resourceAccessAudit = require('@middlewares/resourceAccessAudit.middleware');

    const router = Router();

    router.use(authMiddleware);

    // Admin job management routes
    router.get('/',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        jobsController.getJobsAdmin
    );

    router.get('/:id',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        resourceAccessAudit('job'),
        jobsController.getJobDetailAdmin
    );

    router.post('/',
        requireAuth(ADMIN_HR_ROLES),
        jobsController.createJob
    );

    router.post('/:id/duplicate',
        requireAuth(ADMIN_HR_ROLES),
        resourceAccessAudit('job'),
        jobsController.duplicateJob
    );

    // Find matching job seekers for this job (uses AI embedding similarity)
    router.post('/:id/matching-job-seekers',
        requireAuth(ADMIN_HR_ROLES),
        jobsController.getMatchingJobSeekers
    );

    // Get job embedding status (for polling during async generation)
    router.get('/:id/embedding-status',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        jobsController.getJobEmbeddingStatus
    );

    router.put('/:id',
        requireAuth(ADMIN_HR_ROLES),
        resourceAccessAudit('job'),
        jobsController.updateJob
    );

    router.put('/:id/authorized-people',
        requireAuth(ADMIN_HR_ROLES),
        resourceAccessAudit('job'),
        jobsController.updateAuthorizedPeople
    );

    router.delete('/:id',
        requireAuth(ADMIN_HR_ROLES),
        resourceAccessAudit('job'),
        jobsController.deleteJob
    );

    // Admin job applicant management routes
    router.get('/:id/applicants',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getJobApplicants
    );

    router.get('/:id/applications',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getJobApplications
    );

    router.put('/:id/applicants/:applicantId/status',
        requireAuth(ADMIN_HR_ROLES),
        applicantsController.updateApplicantStatus
    );

    // Admin applicant attachment routes
    router.get('/applicants/:id/attachments',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getApplicantAttachments
    );

    router.get('/attachments/:attachmentId/download',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        resourceAccessAudit('attachment'),
        applicantsController.downloadAttachment
    );

    // Admin status management routes
    router.put('/applicants/:applicantId/status',
        requireAuth(ADMIN_HR_ROLES),
        resourceAccessAudit('applicant'),
        applicantsController.updateApplicantStatus
    );

    router.get('/applicants/:applicantId/status-history',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getApplicantStatusHistory
    );

    router.get('/application-statuses',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getAllStatuses
    );

    return router;
};
