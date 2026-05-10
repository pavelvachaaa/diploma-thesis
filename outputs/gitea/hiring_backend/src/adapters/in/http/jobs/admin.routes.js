module.exports = ({ jobsHttpController, applicantsController }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const {
        ADMIN_HR_AUTHORIZED_PERSON_ROLES,
        ADMIN_HR_ROLES
    } = require('@shared/auth/roles');
    const resourceAccessAudit = require('@middlewares/resourceAccessAudit.middleware');

    const router = Router();

    router.use(authMiddleware);

    router.get('/', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobsHttpController.getJobsAdmin);
    router.get('/:id', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), resourceAccessAudit('job'), jobsHttpController.getJobDetailAdmin);
    router.post('/', requireAuth(ADMIN_HR_ROLES), jobsHttpController.createJob);
    router.post('/:id/duplicate', requireAuth(ADMIN_HR_ROLES), resourceAccessAudit('job'), jobsHttpController.duplicateJob);
    router.post('/:id/matching-job-seekers', requireAuth(ADMIN_HR_ROLES), jobsHttpController.getMatchingJobSeekers);
    router.get('/:id/embedding-status', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobsHttpController.getJobEmbeddingStatus);
    router.put('/:id', requireAuth(ADMIN_HR_ROLES), resourceAccessAudit('job'), jobsHttpController.updateJob);
    router.put('/:id/authorized-people', requireAuth(ADMIN_HR_ROLES), resourceAccessAudit('job'), jobsHttpController.updateAuthorizedPeople);
    router.delete('/:id', requireAuth(ADMIN_HR_ROLES), resourceAccessAudit('job'), jobsHttpController.deleteJob);

    router.get('/:id/applicants', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), applicantsController.getJobApplicants);
    router.get('/:id/applications', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), applicantsController.getJobApplications);
    router.put('/:id/applicants/:applicantId/status', requireAuth(ADMIN_HR_ROLES), applicantsController.updateApplicantStatus);

    router.get('/applicants/:id/attachments', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), applicantsController.getApplicantAttachments);
    router.get('/attachments/:attachmentId/download', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), resourceAccessAudit('attachment'), applicantsController.downloadAttachment);

    router.put('/applicants/:applicantId/status', requireAuth(ADMIN_HR_ROLES), resourceAccessAudit('applicant'), applicantsController.updateApplicantStatus);
    router.get('/applicants/:applicantId/status-history', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), applicantsController.getApplicantStatusHistory);
    router.get('/application-statuses', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), applicantsController.getAllStatuses);

    return router;
};
