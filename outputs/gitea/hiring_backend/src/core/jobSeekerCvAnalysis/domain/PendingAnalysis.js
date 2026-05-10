const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const create = (data = {}) => {
    if (!data.job_seeker_id) {
        failValidation('job_seeker_id is required for pending job seeker CV analysis');
    }

    return Object.freeze({
        job_seeker_id: data.job_seeker_id,
        organization_id: data.organization_id || null
    });
};

module.exports = Object.freeze({ create });
