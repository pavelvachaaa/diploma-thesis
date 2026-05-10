const createEmployeesService = require('../../src/domain/employees/service');

const createDependencies = () => ({
    employeesRepository: {},
    audit: {},
    auditQueryPort: {},
    applicantsQueryPort: {},
    employeeDocumentPort: {},
    emailSenderPort: {},
    employeeOnboardingQueryPort: {},
    employeeOnboardingStepPort: {},
    membershipAccessPort: {},
    sideEffectOutboxService: {
        EVENT_TYPES: {
            WELCOME_EMAIL: 'email.welcome.v1',
            ROLE_NOTIFICATION: 'notification.role.v1',
            USER_NOTIFICATION: 'notification.user.v1'
        },
        enqueue: jest.fn(),
        buildWelcomePayload: jest.fn(() => ({}))
    },
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn()
    }
});

describe('employees.service API contract', () => {
    it('exposes the same employees service API surface', () => {
        const service = createEmployeesService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'createEmployeeFromApplicant',
            'deleteEmployeeFully',
            'getAllEmployees',
            'getAllRoles',
            'getDocumentForDownload',
            'getEmployeeApplicantData',
            'getEmployeeAuditEvents',
            'getEmployeeById',
            'getEmployeeDocumentForDownload',
            'getEmployeeDocuments',
            'getEmployeeOnboardingDashboard',
            'getEmployeeOnboardingProgress',
            'getEmployeeOnboardingStepResponses',
            'getEmployeeOnboardingSteps',
            'sendEmailToEmployee',
            'sendTestEmail',
            'storeEmployeeDocument',
            'updateDocumentStatus',
            'updateEmployeeRole'
        ]);
    });
});
