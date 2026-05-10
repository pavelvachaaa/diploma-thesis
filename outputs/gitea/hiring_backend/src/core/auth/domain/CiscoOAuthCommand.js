const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const create = (ciscoToken) => {
    if (!ciscoToken) {
        throw new ApplicationError('Cisco token is required', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'missing_cisco_token' }
        });
    }

    return Object.freeze({
        ciscoToken
    });
};

module.exports = {
    create
};
