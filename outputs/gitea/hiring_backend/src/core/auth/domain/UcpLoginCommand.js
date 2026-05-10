const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const create = (idToken, accessToken) => {
    if (!idToken || !accessToken) {
        throw new ApplicationError('Missing required parameters: idToken and accessToken', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'missing_ucp_login_parameters' }
        });
    }

    return Object.freeze({
        idToken,
        accessToken
    });
};

module.exports = {
    create
};
