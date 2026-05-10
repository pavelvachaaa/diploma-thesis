const createShared = require('./shared');
const createQueries = require('./queries');
const createLifecycle = require('./lifecycle');
const createOnboarding = require('./onboarding');
const createCommunication = require('./communication');
const createRoles = require('./roles');
const createDeletion = require('./deletion');

module.exports = (deps) => {
    const {
        employeesRepository,
        audit,
        auditQueryPort,
        applicantsQueryPort,
        employeeDocumentPort,
        emailSenderPort,
        employeeOnboardingQueryPort,
        employeeOnboardingStepPort,
        sideEffectOutboxService,
        logger,
        membershipAccessPort
    } = deps;

    const shared = createShared({
        employeesRepository,
        sideEffectOutboxService
    });
    const queries = createQueries({
        employeesRepository,
        auditQueryPort,
        applicantsQueryPort
    });
    const lifecycle = createLifecycle({
        employeesRepository,
        applicantsQueryPort,
        membershipAccessPort,
        logger,
        EMPLOYEE_CREATE_ROLES: shared.EMPLOYEE_CREATE_ROLES,
        employeeEvents: shared.employeeEvents,
        queueMembershipSync: shared.queueMembershipSync
    });
    const onboarding = createOnboarding({
        employeesRepository,
        employeeDocumentPort,
        employeeOnboardingQueryPort,
        employeeOnboardingStepPort,
        ensureEmployeeAccess: shared.ensureEmployeeAccess,
        employeeEvents: shared.employeeEvents,
        logger
    });
    const communication = createCommunication({
        emailSenderPort,
        getEmployeeById: queries.getEmployeeById
    });
    const roles = createRoles({
        employeesRepository,
        logger,
        queueUserRoleSync: shared.queueUserRoleSync
    });
    const deletion = createDeletion({
        employeesRepository,
        sideEffectOutboxService,
        audit,
        logger
    });

    return {
        ...queries,
        ...lifecycle,
        ...onboarding,
        ...communication,
        ...roles,
        ...deletion
    };
};
