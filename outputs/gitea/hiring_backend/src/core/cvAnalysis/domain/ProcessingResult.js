const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const createCompleted = (result = {}) => {
    if (!result.attachment_id || !result.applicant_id) {
        failValidation('attachment_id and applicant_id are required for CV analysis result');
    }

    return Object.freeze({
        ...result,
        organization_id: result.organization_id || null,
        skills: Object.freeze(Array.isArray(result.skills) ? result.skills : []),
        languages: Object.freeze(Array.isArray(result.languages) ? result.languages : []),
        certifications: Object.freeze(Array.isArray(result.certifications) ? result.certifications : []),
        education: Object.freeze(Array.isArray(result.education) ? result.education : []),
        experience: Object.freeze(Array.isArray(result.experience) ? result.experience : []),
        evaluation_strengths: Object.freeze(Array.isArray(result.evaluation_strengths) ? result.evaluation_strengths : []),
        evaluation_weaknesses: Object.freeze(Array.isArray(result.evaluation_weaknesses) ? result.evaluation_weaknesses : []),
        embedding: Object.freeze(Array.isArray(result.embedding) ? result.embedding : [])
    });
};

const createFailure = (result = {}) => {
    if (!result.attachment_id || !result.applicant_id) {
        failValidation('attachment_id and applicant_id are required for CV analysis failure');
    }

    return Object.freeze({
        attachment_id: result.attachment_id,
        applicant_id: result.applicant_id,
        organization_id: result.organization_id || null,
        error_message: result.error_message || 'Unknown error during CV processing'
    });
};

module.exports = Object.freeze({
    createCompleted,
    createFailure
});
