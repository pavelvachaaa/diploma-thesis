const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const requireText = (value, message) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        failValidation(message);
    }

    return value;
};

const normalizeLimit = (value = 50) => {
    const limit = Number.parseInt(value, 10);

    if (!Number.isInteger(limit) || limit > 100 || limit < 1) {
        failValidation('limit must be between 1 and 100');
    }

    return limit;
};

const createListQuery = ({ userId, limit = 50, cursor = null } = {}) => Object.freeze({
    userId: requireText(userId, 'userId is required'),
    limit: normalizeLimit(limit),
    cursor: cursor || null
});

const createUserRequest = (userId) => Object.freeze({
    userId: requireText(userId, 'userId is required')
});

const createMarkReadRequest = (id, userId) => Object.freeze({
    id: requireText(id, 'id and userId are required'),
    userId: requireText(userId, 'id and userId are required')
});

module.exports = Object.freeze({
    createListQuery,
    createUserRequest,
    createMarkReadRequest
});
