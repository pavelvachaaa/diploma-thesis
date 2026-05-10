const bcrypt = require('bcrypt');
const HttpError = require('@shared/errors/HttpError');

const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

module.exports = ({
    employeesRepository,
    applicantsQueryPort,
    membershipAccessPort,
    logger,
    EMPLOYEE_CREATE_ROLES,
    employeeEvents,
    queueMembershipSync
}) => {
    const createEmployeeFromApplicant = async (applicantId, workflowId, startDate, notes, actorUserId = null) => {
        const applicant = await applicantsQueryPort.getApplicantById(applicantId, {
            actorUserId,
            minAccess: 'write'
        });

        if (!applicant) {
            throw new HttpError(404, 'Applicant not found');
        }

        await membershipAccessPort.ensureMembershipCreateAccess({
            actorUserId,
            organizationId: applicant.organization_id,
            allowedRoles: EMPLOYEE_CREATE_ROLES
        });

        const workflow = await employeesRepository.getWorkflowById(workflowId, {
            actorUserId,
            minAccess: 'write'
        });
        if (!workflow) {
            throw new HttpError(404, 'Workflow not found');
        }
        if (workflow.organization_id !== applicant.organization_id) {
            throw new HttpError(403, 'Workflow does not belong to applicant organization');
        }

        const plainPassword = generateRandomPassword();
        const passwordHash = await bcrypt.hash(plainPassword, 12);

        let welcomeOutboxEvent = null;
        let hrRoleNotificationOutboxEvent = null;

        const employee = await employeesRepository.createEmployeeFromApplicant(
            applicantId,
            workflowId,
            startDate,
            notes,
            passwordHash,
            {
                onBeforeCommit: async ({ client, newUser, membership }) => {
                    welcomeOutboxEvent = await employeeEvents.queueWelcomeEmail({
                        client,
                        employee: newUser,
                        plainPassword
                    });

                    hrRoleNotificationOutboxEvent = await employeeEvents.queueEmployeeCreatedRoleNotification({
                        client,
                        employee: newUser,
                        applicantId,
                        startDate,
                        emailOutboxId: welcomeOutboxEvent?.id || null
                    });

                    if (membership) {
                        await queueMembershipSync({ client, membership });
                    }
                }
            }
        );

        logger.info('Employee lifecycle outbox events queued', {
            employeeId: employee.id,
            welcomeOutboxId: welcomeOutboxEvent?.id || null,
            roleNotificationOutboxId: hrRoleNotificationOutboxEvent?.id || null
        });

        return {
            ...employee,
            emailSent: false,
            emailQueued: true,
            emailOutboxId: welcomeOutboxEvent?.id || null,
            emailMessageId: null
        };
    };

    return {
        createEmployeeFromApplicant
    };
};
