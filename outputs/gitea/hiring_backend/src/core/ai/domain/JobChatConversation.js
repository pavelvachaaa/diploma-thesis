const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const create = ({
    messages,
    existingOfferText = '',
    organizationName = ''
} = {}) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new ApplicationError('Messages array is required and must not be empty', {
            code: ErrorCode.VALIDATION_ERROR
        });
    }

    return Object.freeze({
        messages: messages.map((message) => Object.freeze({ ...message })),
        existingOfferText,
        organizationName
    });
};

module.exports = Object.freeze({
    create
});
