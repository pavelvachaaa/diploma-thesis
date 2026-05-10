const { validationResult } = require('express-validator');

const sendValidationError = (res, errors, options = {}) => {
    if (options.legacyErrorsArray === true) {
        return res.status(400).json({ errors });
    }

    return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_FAILED',
        meta: {
            errors
        }
    });
};

const ensureRequestValid = (req, res, options = {}) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        sendValidationError(res, errors.array(), options);
        return false;
    }

    return true;
};

module.exports = {
    ensureRequestValid,
    sendValidationError
};
