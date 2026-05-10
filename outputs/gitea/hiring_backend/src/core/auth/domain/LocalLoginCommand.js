const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const Email = require('./email');

const create = (data = {}) => {
    const email = Email.normalize(data.email);
    const password = data.password;

    if (!email || !password) {
        throw new ApplicationError('Neplatné přihlašovací údaje', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'missing_credentials' }
        });
    }

    return Object.freeze({
        email,
        password
    });
};

module.exports = {
    create
};
