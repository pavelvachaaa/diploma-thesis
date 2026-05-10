const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const toSkills = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
};

const toLimit = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 20;
    }
    return Math.min(parsed, 50);
};

const create = ({ skills, limit = 20 } = {}) => {
    const normalizedSkills = toSkills(skills);
    if (normalizedSkills.length === 0) {
        failValidation(skills ? 'At least one skill is required' : 'Skills parameter is required (comma-separated)');
    }

    return Object.freeze({
        skills: Object.freeze(normalizedSkills),
        limit: toLimit(limit)
    });
};

module.exports = Object.freeze({ create });
