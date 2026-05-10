const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failWithValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const ensureNonEmptyString = (value, message) => {
    if (!hasText(value)) {
        failWithValidation(message);
    }
};

const normalizeBoolean = (value, {
    fallback = undefined,
    fieldName = 'value',
    required = false
} = {}) => {
    if (value === undefined) {
        if (required) {
            failWithValidation(`${fieldName} is required`);
        }

        return fallback;
    }

    if (typeof value !== 'boolean') {
        failWithValidation(`${fieldName} must be a boolean`);
    }

    return value;
};

const normalizeOrderIndex = (value, {
    fallback = undefined,
    required = false
} = {}) => {
    if (value === undefined) {
        if (required) {
            failWithValidation('order_index is required');
        }

        return fallback;
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
        failWithValidation('order_index must be an integer');
    }

    return value;
};

module.exports = Object.freeze({
    ensureNonEmptyString,
    failWithValidation,
    hasText,
    normalizeBoolean,
    normalizeOrderIndex
});
