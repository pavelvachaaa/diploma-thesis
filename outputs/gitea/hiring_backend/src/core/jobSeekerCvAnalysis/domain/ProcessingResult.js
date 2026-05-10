const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const createCompleted = (result = {}) => {
    if (!result.job_seeker_id) {
        failValidation('job_seeker_id is required for job seeker CV analysis result');
    }

    return Object.freeze({
        ...result,
        organization_id: result.organization_id || null,
        skills: Object.freeze(Array.isArray(result.skills) ? result.skills : []),
        languages: Object.freeze(Array.isArray(result.languages) ? result.languages : []),
        certifications: Object.freeze(Array.isArray(result.certifications) ? result.certifications : []),
        education: Object.freeze(Array.isArray(result.education) ? result.education : []),
        experience: Object.freeze(Array.isArray(result.experience) ? result.experience : []),
        embedding: Object.freeze(Array.isArray(result.embedding) ? result.embedding : [])
    });
};

const createFailure = (result = {}) => {
    if (!result.job_seeker_id) {
        failValidation('job_seeker_id is required for job seeker CV analysis failure');
    }

    return Object.freeze({
        job_seeker_id: result.job_seeker_id,
        organization_id: result.organization_id || null,
        error_message: result.error_message || 'Unknown error during CV processing'
    });
}; 

module.exports = Object.freeze({
    createCompleted,
    createFailure
});
