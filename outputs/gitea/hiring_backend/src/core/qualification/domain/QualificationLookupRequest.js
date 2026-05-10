const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const QualificationLookupAttempt = require('./QualificationLookupAttempt');

const VALID_SEARCH_TYPES = new Set(['nrzp', 'rodne_cislo']);

const isValidNrzpNumber = (value) => /^\d+$/.test(String(value || ''));

const isValidBirthNumber = (value) => /^\d{6}\/?\d{3,4}$/.test(String(value || ''));

const createValidationError = (message, reasonCode) => {
    return new ApplicationError(message, {
        code: ErrorCode.VALIDATION_ERROR,
        details: { reasonCode }
    });
};

const create = (payload = {}) => {
    const attempt = QualificationLookupAttempt.create(payload);

    if (!VALID_SEARCH_TYPES.has(attempt.searchType)) {
        throw createValidationError(
            'searchType must be one of: nrzp, rodne_cislo',
            'QUALIFICATION_INVALID_SEARCH_TYPE'
        );
    }

    if (attempt.searchType === 'nrzp') {
        if (!isValidNrzpNumber(attempt.normalizedQuery)) {
            throw createValidationError(
                'NRZP číslo musí obsahovat pouze číslice',
                'QUALIFICATION_INVALID_NRZP'
            );
        }
    } else if (!isValidBirthNumber(attempt.normalizedQuery)) {
        throw createValidationError(
            'Rodné číslo má neplatný formát',
            'QUALIFICATION_INVALID_BIRTH_NUMBER'
        );
    }

    return Object.freeze({
        searchType: attempt.searchType,
        normalizedQuery: attempt.normalizedQuery,
        queryMasked: attempt.queryMasked,
        queryHash: attempt.queryHash,
        applicantId: attempt.applicantId,
        actor: attempt.actor
    });
};

module.exports = {
    create,
    isValidBirthNumber,
    isValidNrzpNumber,
    VALID_SEARCH_TYPES
};
