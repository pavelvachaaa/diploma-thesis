const { toApplicantOrgContext } = require('@shared/contracts/interviews');

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.status = statusCode;
    error.statusCode = statusCode;
    return error;
};

module.exports = {
    createHttpError,
    toApplicantOrgContext
};
