module.exports = ({ applicantsController, fileHandler }) => {
    const { Router } = require('express');
    const { requireAuth, forbidAuthorizedPersonOnly } = require('@middlewares/auth.middleware');
    const {
        ADMIN_HR_AUTHORIZED_PERSON_ROLES,
        ADMIN_HR_ROLES
    } = require('@shared/auth/roles');
    const resourceAccessAudit = require('@middlewares/resourceAccessAudit.middleware');
    const { createMultipleUploadMiddleware } = fileHandler;

    const router = Router();

    router.get('/',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getAllApplicantsAdmin
    );

    const uploadApplicantFiles = createMultipleUploadMiddleware('applicant-attachments', 'attachments', 5);
    router.post('/',
        requireAuth(ADMIN_HR_ROLES),
        forbidAuthorizedPersonOnly,
        uploadApplicantFiles,
        applicantsController.createApplicantAdmin
    );

    router.get('/document-statuses', requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES), applicantsController.getDocumentStatusesAdmin);

    router.get('/attachments/:attachmentId/download',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        resourceAccessAudit('attachment'),
        applicantsController.downloadAttachmentSecure
    );

    router.put('/attachments/:attachmentId/status',
        requireAuth(ADMIN_HR_ROLES),
        forbidAuthorizedPersonOnly,
        resourceAccessAudit('attachment'),
        applicantsController.updateAttachmentStatusAdmin
    );

    router.put('/notes/:noteId',
        requireAuth(ADMIN_HR_ROLES),
        forbidAuthorizedPersonOnly,
        applicantsController.updateApplicantNoteAdmin
    );

    router.delete('/notes/:noteId',
        requireAuth(ADMIN_HR_ROLES),
        forbidAuthorizedPersonOnly,
        applicantsController.deleteApplicantNoteAdmin
    );

    router.get('/job/:jobId',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getApplicantsByJobIdAdmin
    );

    router.get('/:id',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        resourceAccessAudit('applicant'),
        applicantsController.getApplicantByIdAdmin
    );

    router.put('/:id/status',
        requireAuth(ADMIN_HR_ROLES),
        forbidAuthorizedPersonOnly,
        resourceAccessAudit('applicant'),
        applicantsController.updateApplicantStatusAdmin
    );

    router.get('/:id/history',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getApplicantStatusHistoryAdmin
    );

    router.get('/:id/attachments',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getApplicantAttachmentsAdmin
    );

    router.get('/:id/notes',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.getApplicantNotesAdmin
    );

    router.post('/:id/notes',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        applicantsController.createApplicantNoteAdmin
    );

    const uploadEmailAttachments = createMultipleUploadMiddleware('applicant-attachments', 'attachments', 5);
    router.post('/:id/send-email',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        resourceAccessAudit('applicant'),
        uploadEmailAttachments,
        applicantsController.sendEmailToApplicantAdmin
    );

    router.post('/:id/schedule-interview',
        requireAuth(ADMIN_HR_ROLES),
        forbidAuthorizedPersonOnly,
        resourceAccessAudit('applicant'),
        applicantsController.scheduleInterviewAdmin
    );

    return router;
};
