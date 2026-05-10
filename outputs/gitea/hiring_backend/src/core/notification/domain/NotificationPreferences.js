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

const requireBoolean = (value, fieldName) => {
    if (typeof value !== 'boolean') {
        failValidation(`${fieldName} must be a boolean value`);
    }

    return value;
};

const requireNullableBoolean = (value, fieldName) => {
    if (value !== null && typeof value !== 'boolean') {
        failValidation(`${fieldName} must be boolean or null`);
    }

    return value;
};

const normalizeChannel = (channel) => {
    if (!['email', 'inApp'].includes(channel)) {
        failValidation('channel must be either "email" or "inApp"');
    }

    return channel;
};

const createGlobalUpdate = (userId, preferences = {}) => Object.freeze({
    userId: requireText(userId, 'userId and preferences are required'),
    preferences: Object.freeze({
        inAppEnabled: requireBoolean(preferences.inAppEnabled, 'inAppEnabled'),
        emailEnabled: requireBoolean(preferences.emailEnabled, 'emailEnabled')
    })
});

const createTypeUpdate = (userId, typeCode, preferences = {}) => Object.freeze({
    userId: requireText(userId, 'userId, typeCode, and preferences are required'),
    typeCode: requireText(typeCode, 'userId, typeCode, and preferences are required'),
    preferences: Object.freeze({
        inAppEnabled: requireNullableBoolean(preferences.inAppEnabled, 'inAppEnabled'),
        emailEnabled: requireNullableBoolean(preferences.emailEnabled, 'emailEnabled')
    })
});

const createPreferenceLookup = (userId, typeCode = null) => Object.freeze({
    userId: requireText(userId, 'userId is required'),
    typeCode: typeCode || null
});

const createTypePreferenceLookup = (userId, typeCode) => Object.freeze({
    userId: requireText(userId, 'userId and typeCode are required'),
    typeCode: requireText(typeCode, 'userId and typeCode are required')
});

const createPreferenceCheck = (userId, channel, typeCode = null) => Object.freeze({
    userId: requireText(userId, 'userId and channel are required'),
    channel: normalizeChannel(channel),
    typeCode: typeCode || null
});

const pickChannelFlag = (preferences = {}, channel) => (
    channel === 'email' ? preferences.emailEnabled : preferences.inAppEnabled
);

const resolveChannelPreference = ({ globalPreferences = {}, typePreferences = {}, channel, typeCode = null }) => {
    const globalEnabled = pickChannelFlag(globalPreferences, channel);

    if (!globalEnabled) {
        return false;
    }

    if (!typeCode) {
        return globalEnabled;
    }

    const typeEnabled = pickChannelFlag(typePreferences, channel);
    return typeEnabled !== null ? typeEnabled : globalEnabled;
};

module.exports = Object.freeze({
    createGlobalUpdate,
    createTypeUpdate,
    createPreferenceLookup,
    createTypePreferenceLookup,
    createPreferenceCheck,
    resolveChannelPreference
});
