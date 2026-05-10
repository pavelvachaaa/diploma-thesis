const HttpError = require('@shared/errors/HttpError');
const createEmployeesEvents = require('@domain/employees/events');

const EMPLOYEE_CREATE_ROLES = ['hr', 'admin'];

module.exports = ({
    employeesRepository,
    sideEffectOutboxService
}) => {
    const employeeEvents = createEmployeesEvents({
        sideEffectOutboxService
    });

    const queueUserRoleSync = ({ client, user }) => {
        if (!sideEffectOutboxService?.enqueue || !user?.id) {
            return null;
        }

        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.REBAC_USER_ROLE_SYNC,
            aggregateType: 'user',
            aggregateId: user.id,
            organizationId: user.organization_id || null,
            payload: {
                userId: user.id,
                organizationId: user.organization_id || null
            }
        }, { client });
    };

    const queueMembershipSync = ({ client, membership }) => {
        if (!sideEffectOutboxService?.enqueue) {
            return null;
        }

        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.REBAC_MEMBERSHIP_SYNC,
            aggregateType: 'organization_membership',
            aggregateId: membership.id,
            organizationId: membership.organization_id || null,
            payload: {
                membershipId: membership.id,
                organizationId: membership.organization_id || null,
                userId: membership.user_id || null
            }
        }, { client });
    };

    const ensureEmployeeAccess = async (employeeId, options = {}) => {
        const employee = await employeesRepository.getEmployeeById(employeeId, options);
        if (!employee) {
            throw new HttpError(404, 'Employee not found');
        }

        return employee;
    };

    return {
        EMPLOYEE_CREATE_ROLES,
        employeeEvents,
        queueUserRoleSync,
        queueMembershipSync,
        ensureEmployeeAccess
    };
};
