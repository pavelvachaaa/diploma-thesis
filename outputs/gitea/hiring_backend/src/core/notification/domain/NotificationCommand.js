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

const normalizeData = (value) => {
    if (value === undefined || value === null) {
        return {};
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
        failValidation('data must be an object');
    }

    return { ...value };
};

const createUserNotification = ({
    userId,
    type,
    title,
    body,
    data = {},
    actionUrl,
    skipPreferences = false
} = {}) => Object.freeze({
    userId: requireText(userId, 'userId, type, and title are required'),
    type: requireText(type, 'userId, type, and title are required'),
    title: requireText(title, 'userId, type, and title are required'),
    body,
    data: normalizeData(data),
    actionUrl,
    skipPreferences: skipPreferences === true
});

const createRoleBroadcast = ({
    type,
    organizationId,
    title,
    body,
    data = {},
    actionUrl,
    roleName = 'HR'
} = {}) => Object.freeze({
    type: requireText(type, 'type, organizationId, and title are required'),
    organizationId: requireText(organizationId, 'type, organizationId, and title are required'),
    title: requireText(title, 'type, organizationId, and title are required'),
    body,
    data: normalizeData(data),
    actionUrl,
    roleName
});

const createDualChannelNotification = ({
    userId,
    email,
    type,
    title,
    body,
    data = {},
    actionUrl,
    skipPreferences = false
} = {}) => Object.freeze({
    userId: requireText(userId, 'userId, email, type, and title are required'),
    email: requireText(email, 'userId, email, type, and title are required'),
    type: requireText(type, 'userId, email, type, and title are required'),
    title: requireText(title, 'userId, email, type, and title are required'),
    body,
    data: normalizeData(data),
    actionUrl,
    skipPreferences: skipPreferences === true
});

module.exports = Object.freeze({
    createUserNotification,
    createRoleBroadcast,
    createDualChannelNotification
});
