const mockAuditOrgAccess = jest.fn(() => (_req, _res, next) => next());
const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());
const mockForbidAuthorizedPersonOnly = jest.fn((_req, _res, next) => next());
const mockCreateMultipleUploadMiddleware = jest.fn(() => (_req, _res, next) => next());
const {
    ADMIN_HR_AUTHORIZED_PERSON_ROLES,
    ADMIN_HR_ROLES
} = require('../../src/shared/auth/roles');

jest.mock('@middlewares/resourceAccessAudit.middleware', () => (...args) => mockAuditOrgAccess(...args));

jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: (...args) => mockRequireAuth(...args),
    forbidAuthorizedPersonOnly: (...args) => mockForbidAuthorizedPersonOnly(...args)
}));

const createApplicantsRoutes = require('../../src/routes/admin/applicants.routes');

const buildController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getAllApplicantsAdmin: noop,
        createApplicantAdmin: noop,
        getDocumentStatusesAdmin: noop,
        downloadAttachmentSecure: noop,
        updateAttachmentStatusAdmin: noop,
        updateApplicantNoteAdmin: noop,
        deleteApplicantNoteAdmin: noop,
        getApplicantsByJobIdAdmin: noop,
        getApplicantByIdAdmin: noop,
        updateApplicantStatusAdmin: noop,
        getApplicantStatusHistoryAdmin: noop,
        getApplicantAttachmentsAdmin: noop,
        getApplicantNotesAdmin: noop,
        createApplicantNoteAdmin: noop,
        sendEmailToApplicantAdmin: noop,
        scheduleInterviewAdmin: noop
    };
};

describe('admin applicants routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds routes without legacy scope middleware and keeps auth guards', () => {
        const router = createApplicantsRoutes({
            applicantsController: buildController(),
            fileHandler: {
                createMultipleUploadMiddleware: (...args) => mockCreateMultipleUploadMiddleware(...args)
            }
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_HR_AUTHORIZED_PERSON_ROLES);
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_HR_ROLES);
        expect(mockCreateMultipleUploadMiddleware).toHaveBeenCalledWith('applicant-attachments', 'attachments', 5);
    });
});
