const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const create = (data = {}) => {
    const code = data.code;
    const codeVerifier = data.codeVerifier;
    const redirectUri = data.redirectUri;

    if (!code || !codeVerifier || !redirectUri) {
        throw new ApplicationError('Missing required parameters', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { reason: 'missing_oauth_token_exchange_parameters' }
        });
    }

    return Object.freeze({
        code,
        codeVerifier,
        redirectUri
    });
};

module.exports = {
    create
};
