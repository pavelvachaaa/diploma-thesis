const HttpError = require('@shared/errors/HttpError');
const { enqueueFileGcDelete } = require('@shared/file/gcOutbox');
const { SUPER_ADMIN_ROLE } = require('@shared/auth/roles');
const { createSnapshot } = require('@shared/audit/state');

const EMPLOYEE_AUDIT_FIELDS = Object.freeze([
    'id',
    'email',
    'name',
    'surname',
    'phone',
    'is_active',
    'organization_id',
    'organization_name',
    'role_name',
    'created_at'
]);

module.exports = ({
    employeesRepository,
    sideEffectOutboxService,
    audit,
    logger
}) => {
    const deleteEmployeeFully = async (employeeId, requestingUser) => {
        const requesterRoles = Array.isArray(requestingUser?.roles) ? requestingUser.roles : [];

        if (!requesterRoles.includes(SUPER_ADMIN_ROLE)) {
            throw new HttpError('Only super admins can fully delete employees', 403);
        }

        if (!employeeId) {
            throw new HttpError('Employee ID is required', 400);
        }

        if (requestingUser?.id && requestingUser.id === employeeId) {
            throw new HttpError('You cannot fully delete your own account', 422);
        }

        const employee = await employeesRepository.getEmployeeById(employeeId, {
            actorUserId: requestingUser.id,
            minAccess: 'admin'
        });

        if (!employee) {
            throw new HttpError('Employee not found', 404);
        }

        const deletedEmployee = await employeesRepository.deleteEmployeeFully(
            employeeId,
            {
                onBeforeCommit: async ({ client, employee: removedEmployee, fileRefs = [] }) => {
                    for (const file of fileRefs) {
                        await enqueueFileGcDelete({
                            sideEffectOutboxService,
                            fileId: file.id,
                            bucket: file.bucket,
                            objectKey: file.object_key,
                            organizationId: file.organization_id || removedEmployee.organization_id || null,
                            reason: 'employee_full_delete',
                            sourceModule: 'employees.deleteEmployeeFully'
                        }, { client });
                    }
                }
            },
            {
                deletedByUserId: requestingUser.id
            }
        );

        if (!deletedEmployee) {
            throw new HttpError('Employee not found', 404);
        }

        const employeeSnapshot = createSnapshot(employee, EMPLOYEE_AUDIT_FIELDS);
        const targetName = [employee.name, employee.surname].filter(Boolean).join(' ');
        const target = employee.email
            ? `${targetName} <${employee.email}>`.trim()
            : targetName || employeeId;

        void audit?.writeAuditEvent?.({
            category: 'employee',
            action: 'employee.delete',
            status: 'success',
            resourceType: 'employee',
            resourceId: employeeId,
            organizationId: employee.organization_id || null,
            target,
            beforeState: employeeSnapshot,
            afterState: null,
            metadata: {
                deletedBy: requestingUser.id,
                deletedRole: employee.role_name || null
            }
        })?.catch((error) => {
            logger.warn('Failed to emit employee delete audit event', {
                employeeId,
                deletedBy: requestingUser.id,
                error: error.message
            });
        });

        logger.info('Employee fully deleted', {
            employeeId,
            deletedBy: requestingUser.id,
            organizationId: deletedEmployee.organization_id || null
        });

        return deletedEmployee;
    };

    return {
        deleteEmployeeFully
    };
};
