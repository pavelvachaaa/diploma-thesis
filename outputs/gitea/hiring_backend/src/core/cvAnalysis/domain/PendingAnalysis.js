const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const failValidation = (message) => {
    throw new ApplicationError(message, { code: ErrorCode.VALIDATION_ERROR });
};

const create = (data = {}) => {
    if (!data.attachment_id || !data.applicant_id) {
        failValidation('attachment_id and applicant_id are required for pending CV analysis');
    }

    return Object.freeze({
        attachment_id: data.attachment_id,
        applicant_id: data.applicant_id,
        organization_id: data.organization_id || null
    });
};

module.exports = Object.freeze({ create });
