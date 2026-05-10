module.exports = ({ employeesController, employeesOnboardingController, employeesService, fileHandler, fileDownload }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const { ADMIN_HR_ROLES, ADMIN_ONLY_ROLES, SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');
    const resourceAccessAudit = require('@middlewares/resourceAccessAudit.middleware');
    const { createUploadMiddleware, createMultipleUploadMiddleware } = fileHandler;
    const { downloadFile } = fileDownload;

    const router = Router();

    router.get('/',
        requireAuth(ADMIN_HR_ROLES),
        employeesController.getAllEmployeesAdmin
    );

    router.get('/roles', requireAuth(ADMIN_ONLY_ROLES), employeesController.getEmployeeRolesAdmin);

    router.post('/from-applicant',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-creation'),
        employeesController.createEmployeeFromApplicantAdmin
    );

    router.get('/:id',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee'),
        employeesController.getEmployeeByIdAdmin
    );

    router.get('/:id/audit-events',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-audit'),
        employeesController.getEmployeeAuditEventsAdmin
    );

    router.put('/:id/role',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-role-update'),
        employeesController.updateEmployeeRoleAdmin
    );

    router.delete('/:id',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-delete'),
        employeesController.deleteEmployeeAdmin
    );

    router.get('/:id/applicant-data',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee'),
        employeesController.getEmployeeApplicantDataAdmin
    );

    router.get('/:id/documents',
        requireAuth(ADMIN_ONLY_ROLES),
        employeesController.getEmployeeDocumentsAdmin
    );

    router.put('/:id/documents/:documentId/status',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-document'),
        employeesController.updateDocumentStatusAdmin
    );

    router.get('/:id/documents/:documentId/download',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-document'),
        async (req, res, next) => {
            try {
                const { id: employeeId, documentId } = req.params;
                const fileInfo = await employeesService.getEmployeeDocumentForDownload(employeeId, documentId, {
                    actorUserId: req.user.id
                });

                await downloadFile(res, fileInfo, req.user, 'employee-document', {
                    resourceId: documentId,
                    metadata: {
                        employeeId
                    }
                });
            } catch (error) {
                next(error);
            }
        }
    );

    const uploadEmployeeDocument = createUploadMiddleware('user-documents');
    router.post('/:id/documents/:documentId/upload',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-document'),
        uploadEmployeeDocument,
        employeesController.uploadDocumentForEmployeeAdmin
    );

    router.get('/:id/onboarding/dashboard',
        requireAuth(ADMIN_ONLY_ROLES),
        employeesOnboardingController.getEmployeeOnboardingDashboardAdmin
    );

    router.get('/:id/onboarding/steps',
        requireAuth(ADMIN_ONLY_ROLES),
        employeesOnboardingController.getEmployeeOnboardingStepsAdmin
    );

    router.get('/:id/onboarding/progress',
        requireAuth(ADMIN_ONLY_ROLES),
        employeesOnboardingController.getEmployeeOnboardingProgressAdmin
    );

    router.get('/:id/onboarding/steps/:stepId/responses',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee-onboarding'),
        employeesOnboardingController.getEmployeeStepResponsesAdmin
    );

    const uploadEmailAttachments = createMultipleUploadMiddleware('user-documents', 'attachments', 5);
    router.post('/:id/send-email',
        requireAuth(ADMIN_ONLY_ROLES),
        resourceAccessAudit('employee'),
        uploadEmailAttachments,
        employeesController.sendEmailToEmployeeAdmin
    );

    router.post('/test-email', requireAuth(ADMIN_ONLY_ROLES), employeesController.sendTestEmailAdmin);

    return router;
};
