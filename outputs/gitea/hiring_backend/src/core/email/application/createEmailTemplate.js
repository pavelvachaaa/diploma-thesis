const EmailTemplate = require('@core/email/domain/EmailTemplate');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({ emailTemplatesStorePort }) => {
    return async (data, options = {}) => {
        const validated = EmailTemplate.create(data);
        const template = await emailTemplatesStorePort.create({
            organization_id: validated.organizationId,
            name: validated.name,
            type: validated.type,
            subject: validated.subject,
            body: validated.body,
            created_by: validated.createdBy
        }, options);

        if (!template) {
            throw new ApplicationError('Organization not found or access denied', { code: ErrorCode.NOT_FOUND });
        }

        return template;
    };
};
