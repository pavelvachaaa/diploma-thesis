const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const VALID_FIELD_TYPES = Object.freeze(['description', 'duty', 'requirement', 'benefit']);

const create = ({
    text,
    fieldType,
    jobTitle = ''
} = {}) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
        throw new ApplicationError('text is required', {
            code: ErrorCode.VALIDATION_ERROR
        });
    }

    if (!fieldType || !VALID_FIELD_TYPES.includes(fieldType)) {
        throw new ApplicationError(`field_type must be one of: ${VALID_FIELD_TYPES.join(', ')}`, {
            code: ErrorCode.VALIDATION_ERROR
        });
    }

    return Object.freeze({
        text,
        fieldType,
        jobTitle
    });
};

module.exports = Object.freeze({
    VALID_FIELD_TYPES,
    create
});
