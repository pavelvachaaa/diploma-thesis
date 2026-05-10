const HttpError = require('@shared/errors/HttpError');

module.exports = ({
    emailSenderPort,
    getEmployeeById
}) => {
    const sendEmailToEmployee = async (employeeId, payload = {}, options = {}) => {
        const { subject, message, files = [], requestUser = null } = payload;

        if (!subject || !message) {
            const error = new HttpError(400, 'Subject and message are required');
            error.code = 'EMPLOYEE_EMAIL_INVALID_INPUT';
            throw error;
        }

        const employee = await getEmployeeById(employeeId, {
            actorUserId: options.actorUserId || requestUser?.id || null,
            minAccess: options.minAccess || 'read'
        });
        if (!employee) {
            throw new HttpError(404, 'Employee not found');
        }

        const attachments = (files || [])
            .filter((file) => file.key && file.bucket)
            .map((file) => ({
                filename: file.originalname,
                contentType: file.mimetype,
                storage: {
                    bucket: file.bucket,
                    key: file.key
                }
            }));

        const emailResult = await emailSenderPort.sendCustomEmail({
            to: employee.email,
            subject: String(subject).trim(),
            message: String(message).trim(),
            employeeName: `${employee.name} ${employee.surname}`,
            senderName: requestUser?.name
                ? `${requestUser.name} ${requestUser.surname}`
                : 'KZCR Administration',
            attachments
        });

        if (!emailResult?.success) {
            throw new HttpError(500, emailResult?.error || 'Unknown email dispatch error');
        }

        return emailResult;
    };

    const sendTestEmail = async (email, type = 'basic') => {
        if (!email) {
            throw new HttpError(400, 'Email address is required');
        }

        switch (type) {
            case 'basic':
                return emailSenderPort.sendTestEmail(email);
            case 'welcome':
                return emailSenderPort.sendWelcomeEmail({
                    employee: {
                        id: 'test-employee-id',
                        email,
                        name: 'Jan',
                        surname: 'Testovací',
                        organization_name: 'Krajské zařízení České republiky',
                        organization_id: 'test-org-id'
                    },
                    plainPassword: 'TestPassword123!'
                });
            case 'health':
                return emailSenderPort.getHealthStatus();
            default:
                throw new HttpError(400, 'Invalid email test type');
        }
    };

    return {
        sendEmailToEmployee,
        sendTestEmail
    };
};
