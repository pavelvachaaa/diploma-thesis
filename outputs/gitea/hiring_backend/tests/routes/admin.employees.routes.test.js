const mockRequireAuth = jest.fn(() => (_req, _res, next) => next());

const {
    ADMIN_HR_ROLES,
    ADMIN_ONLY_ROLES,
    SUPER_ADMIN_ONLY_ROLES
} = require('../../src/shared/auth/roles');

jest.mock('@middlewares/auth.middleware', () => ({
    requireAuth: (...args) => mockRequireAuth(...args)
}));

jest.mock('@middlewares/resourceAccessAudit.middleware', () => jest.fn(() => (_req, _res, next) => next()));

const createEmployeesRoutes = require('../../src/routes/admin/employees.routes');

const buildEmployeesController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getAllEmployeesAdmin: noop,
        getEmployeeRolesAdmin: noop,
        createEmployeeFromApplicantAdmin: noop,
        getEmployeeByIdAdmin: noop,
        getEmployeeAuditEventsAdmin: noop,
        updateEmployeeRoleAdmin: noop,
        deleteEmployeeAdmin: noop,
        getEmployeeApplicantDataAdmin: noop,
        getEmployeeDocumentsAdmin: noop,
        updateDocumentStatusAdmin: noop,
        uploadDocumentForEmployeeAdmin: noop,
        sendEmailToEmployeeAdmin: noop,
        sendTestEmailAdmin: noop
    };
};

const buildOnboardingController = () => {
    const noop = jest.fn((_req, _res, next) => next && next());
    return {
        getEmployeeOnboardingDashboardAdmin: noop,
        getEmployeeOnboardingStepsAdmin: noop,
        getEmployeeOnboardingProgressAdmin: noop,
        getEmployeeStepResponsesAdmin: noop
    };
};

describe('admin employees routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows HR to read the employee list while preserving admin-only write and detail routes', () => {
        const router = createEmployeesRoutes({
            employeesController: buildEmployeesController(),
            employeesOnboardingController: buildOnboardingController(),
            employeesService: {
                getEmployeeDocumentForDownload: jest.fn()
            },
            fileHandler: {
                createUploadMiddleware: jest.fn(() => (_req, _res, next) => next()),
                createMultipleUploadMiddleware: jest.fn(() => (_req, _res, next) => next())
            },
            fileDownload: {
                downloadFile: jest.fn()
            }
        });

        expect(router).toBeDefined();
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_HR_ROLES);
        expect(mockRequireAuth).toHaveBeenCalledWith(ADMIN_ONLY_ROLES);
        expect(mockRequireAuth).toHaveBeenCalledWith(SUPER_ADMIN_ONLY_ROLES);
    });
});
