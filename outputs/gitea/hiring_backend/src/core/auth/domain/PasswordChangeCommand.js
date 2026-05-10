const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const create = ({ userId, currentPassword, newPassword } = {}) => {
    if (!userId) {
        throw new ApplicationError('User id is required', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'missing_user_id' }
        });
    }

    if (!newPassword || String(newPassword).length < 8) {
        throw new ApplicationError('Nové heslo musí mít alespoň 8 znaků', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'password_too_short' }
        });
    }

    return Object.freeze({
        userId,
        currentPassword,
        newPassword
    });
};

module.exports = {
    create
};
