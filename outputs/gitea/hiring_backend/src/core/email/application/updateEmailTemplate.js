const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

module.exports = ({ emailTemplatesStorePort }) => {
    return async (id, data, options = {}) => {
        const template = await emailTemplatesStorePort.update(id, data, options);
        if (!template) {
            throw new ApplicationError('Email template not found', { code: ErrorCode.NOT_FOUND });
        }
        return template;
    };
};
