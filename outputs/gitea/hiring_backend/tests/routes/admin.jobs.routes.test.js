const mockAuditOrgAccess = jest.fn(() => (_req, _res, next) => next());
const mockAuthMiddleware = jest.fn((_req, _res, next) => next());
const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());
const {
    ADMIN_HR_AUTHORIZED_PERSON_ROLES,
    ADMIN_HR_ROLES
} = require('../../src/shared/auth/roles');

jest.mock('@middlewares/resourceAccessAudit.middleware', () => (...args) => mockAuditOrgAccess(...args));

jest.mock('@middlewares/auth.middleware', () => ({
    authMiddleware: (...args) => mockAuthMiddleware(...args),
    requireAuth: (...args) => mockRequireAuth(...args)
}));

const createJobsRoutes = require('../../src/routes/admin/jobs.routes');

const buildNoopController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getJobsAdmin: noop,
        getJobDetailAdmin: noop,
        createJob: noop,
        duplicateJob: noop,
        getMatchingJobSeekers: noop,
        getJobEmbeddingStatus: noop,
        updateJob: noop,
        updateAuthorizedPeople: noop,
        deleteJob: noop
    };
};

const buildApplicantsController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getJobApplicants: noop,
        getJobApplications: noop,
        updateApplicantStatus: noop,
        getApplicantAttachments: noop,
        downloadAttachment: noop,
        getApplicantStatusHistory: noop,
        getAllStatuses: noop
    };
};

describe('admin jobs routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds routes without legacy scope middleware and keeps auth guards', () => {
        const router = createJobsRoutes({
            jobsController: buildNoopController(),
            applicantsController: buildApplicantsController()
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_HR_AUTHORIZED_PERSON_ROLES);
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_HR_ROLES);
    });
});
