const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({ emailOutboxPort, logger }) => {
    return async ({ employee, plainPassword, loginUrl }) => {
        if (!employee || !plainPassword) {
            throw new ApplicationError('employee and plainPassword are required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const { email, name, surname, id, organization_id } = employee;
        if (!email || !name) {
            throw new ApplicationError('employee email and name are required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const employeeName = `${name} ${surname || ''}`.trim();
        const resolvedLoginUrl = loginUrl
            || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'https://onboarding.kzcr.eu/login');

        const outboxEvent = await emailOutboxPort.enqueueWelcomeEmail({
            employee,
            plainPassword,
            loginUrl: resolvedLoginUrl
        }, {
            idempotencyKey: `email.welcome.employee.${id}`
        });

        logger?.info?.('Welcome email queued', { employeeId: id, employeeEmail: email, employeeName });

        return {
            success: true,
            queued: true,
            sent: false,
            outboxId: outboxEvent?.id || null,
            messageId: null,
            sentTo: email
        };
    };
};
