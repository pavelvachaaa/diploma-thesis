const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const create = ({
    offerText,
    organizationName = ''
} = {}) => {
    if (!offerText || typeof offerText !== 'string' || !offerText.trim()) {
        throw new ApplicationError('offer_text is required', {
            code: ErrorCode.VALIDATION_ERROR
        });
    }

    return Object.freeze({
        offerText,
        organizationName
    });
};

module.exports = Object.freeze({
    create
});
