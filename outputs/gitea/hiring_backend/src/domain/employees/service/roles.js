const HttpError = require('@shared/errors/HttpError');
const { ROLE_ASSIGNABLE_VALUES } = require('@shared/auth/roles');

module.exports = ({
    employeesRepository,
    logger,
    queueUserRoleSync
}) => {
    const updateEmployeeRole = async (employeeId, newRoleName, requestingUser) => {
        const canChangeRoles = requestingUser.roles.includes('super_admin')
            || requestingUser.roles.includes('admin');

        if (!canChangeRoles) {
            throw new HttpError(403, 'Only admins can change user roles');
        }

        if (newRoleName === 'super_admin') {
            throw new HttpError(400, 'Cannot assign super_admin role via API');
        }

        const validRoles = ROLE_ASSIGNABLE_VALUES;
        if (!validRoles.includes(newRoleName)) {
            throw new HttpError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        const employee = await employeesRepository.getEmployeeById(employeeId, {
            actorUserId: requestingUser.id,
            minAccess: 'admin'
        });
        if (!employee) {
            throw new HttpError(404, 'Employee not found');
        }

        await employeesRepository.updateEmployeeRole(
            employeeId,
            newRoleName,
            {
                onBeforeCommit: ({ client, user }) => queueUserRoleSync({
                    client,
                    user
                })
            }
        );

        logger.info({
            employeeId,
            newRole: newRoleName,
            changedBy: requestingUser.id,
            organization: employee.organization_id
        }, 'Employee role updated');

        return employeesRepository.getEmployeeById(employeeId);
    };

    return {
        updateEmployeeRole
    };
};
