const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const toLimit = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 20;
    }
    return Math.min(parsed, 50);
};

const toThreshold = (value) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
        return 0.5;
    }
    return Math.max(0, Math.min(parsed, 1));
};

const create = (embedding, options = {}) => {
    if (!Array.isArray(embedding) || embedding.length === 0 || embedding.some((value) => !Number.isFinite(Number(value)))) {
        failValidation('A numeric job embedding vector is required');
    }

    return Object.freeze({
        embedding: Object.freeze(embedding.map(Number)),
        limit: toLimit(options.limit),
        threshold: toThreshold(options.threshold)
    });
};

module.exports = Object.freeze({ create });
