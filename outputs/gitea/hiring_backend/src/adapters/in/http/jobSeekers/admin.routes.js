module.exports = ({ jobSeekersHttpController, jobSeekerCvAnalysisController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const {
        ADMIN_HR_AUTHORIZED_PERSON_ROLES,
        ADMIN_HR_ROLES
    } = require('@shared/auth/roles');

    const router = Router();

    router.get('/', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekersHttpController.getAllJobSeekersAdmin);
    router.get('/cv-analysis/stats', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekerCvAnalysisController.getStats);
    router.get('/cv-analysis/skills-search', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekerCvAnalysisController.searchBySkills);
    router.get('/organization/:organizationId', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekersHttpController.getJobSeekersByOrganizationAdmin);
    router.get('/:id', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekersHttpController.getJobSeekerByIdAdmin);
    router.get('/:id/cv', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekersHttpController.downloadCVAdmin);
    router.get('/:id/attachments/:attachmentId/download', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekersHttpController.downloadAttachmentAdmin);
    router.get('/:id/cv-analysis', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekerCvAnalysisController.getAnalysis);
    router.get('/:id/cv-analysis/status', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), jobSeekerCvAnalysisController.getStatus);
    router.post('/:id/cv-analysis/reanalyze', requireAuth(ADMIN_HR_ROLES), jobSeekerCvAnalysisController.triggerReanalysis);
    router.delete('/:id', requireAuth(ADMIN_HR_ROLES), jobSeekersHttpController.deleteJobSeekerAdmin);

    return router;
};
