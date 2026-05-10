const normalizeEmail = require('@shared/email/normalizeEmail');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

/**
 * Normalizes a seat location code to uppercase.
 * Returns empty string if the value is blank.
 */
const normalizeSeatLocation = (value) => {
    const trimmed = String(value || '').trim();
    return trimmed ? trimmed.toUpperCase() : '';
};

/**
 * Splits a name from a candidate object that may carry {name, surname}
 * or a combined {fullName}.
 */
const splitName = (candidate = {}) => {
    const name = String(candidate.name || '').trim();
    const surname = String(candidate.surname || '').trim();
    const fullName = String(candidate.fullName || '').trim();

    if (name || surname) {
        return { name, surname };
    }

    if (!fullName) {
        return { name: '', surname: '' };
    }

    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return { name: parts[0], surname: '' };
    }

    return { name: parts[0], surname: parts.slice(1).join(' ') };
};

/**
 * Value object factory — validates invariants and returns a frozen profile
 * ready to be looked up or persisted via the store port.
 *
 * @throws {ApplicationError} UNPROCESSABLE if email or name is missing
 */
const create = (candidate = {}) => {
    const email = normalizeEmail(candidate?.email);
    const seatLocation = normalizeSeatLocation(candidate?.seatLocation);
    const { name, surname } = splitName(candidate);

    if (!email || !name) {
        throw new ApplicationError('Interní uživatel musí mít e-mail a jméno', {
            code: ErrorCode.UNPROCESSABLE
        });
    }

    return Object.freeze({ email, name, surname, seatLocation });
};

module.exports = { create, splitName, normalizeSeatLocation };
