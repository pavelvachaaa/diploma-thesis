const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

const normalizeOptionalText = (value) => {
    if (typeof value !== 'string') {
        return value ?? null;
    }

    const trimmed = value.trim();
    return trimmed || null;
};

const assertValidEmail = (value) => {
    if (value !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new ApplicationError('contact_email must be a valid email address', {
            code: ErrorCode.VALIDATION_ERROR,
            details: { field: 'contact_email' }
        });
    }
};

const assertValidHttpsUrl = (field, value) => {
    if (value === null) {
        return;
    }

    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        parsed = null;
    }

    if (!parsed || parsed.protocol !== 'https:') {
        throw new ApplicationError(`${field} must be a valid HTTPS URL`, {
            code: ErrorCode.VALIDATION_ERROR,
            details: { field }
        });
    }
};

const buildSanitizedOrganizationPayload = (data = {}, { partial = false } = {}) => {
    if (!partial) {
        const name = normalizeOptionalText(data.name);
        if (!name) {
            throw new ApplicationError('Organization name is required', {
                code: ErrorCode.VALIDATION_ERROR,
                details: { field: 'name' }
            });
        }

        const contact_email = normalizeOptionalText(data.contact_email);
        assertValidEmail(contact_email);

        const contact_linkedin_url = normalizeOptionalText(data.contact_linkedin_url);
        assertValidHttpsUrl('contact_linkedin_url', contact_linkedin_url);

        return {
            name,
            seat_location: normalizeOptionalText(data.seat_location),
            address: normalizeOptionalText(data.address),
            contact_email,
            contact_name: normalizeOptionalText(data.contact_name),
            contact_phone: normalizeOptionalText(data.contact_phone),
            contact_linkedin_url
        };
    }

    const sanitized = {};

    if (hasOwn(data, 'name')) {
        const name = normalizeOptionalText(data.name);
        if (!name) {
            throw new ApplicationError('Organization name cannot be empty', {
                code: ErrorCode.VALIDATION_ERROR,
                details: { field: 'name' }
            });
        }

        sanitized.name = name;
    }

    if (hasOwn(data, 'seat_location')) sanitized.seat_location = normalizeOptionalText(data.seat_location);
    if (hasOwn(data, 'address')) sanitized.address = normalizeOptionalText(data.address);

    if (hasOwn(data, 'contact_email')) {
        sanitized.contact_email = normalizeOptionalText(data.contact_email);
        assertValidEmail(sanitized.contact_email);
    }

    if (hasOwn(data, 'contact_name')) sanitized.contact_name = normalizeOptionalText(data.contact_name);
    if (hasOwn(data, 'contact_phone')) sanitized.contact_phone = normalizeOptionalText(data.contact_phone);

    if (hasOwn(data, 'contact_linkedin_url')) {
        sanitized.contact_linkedin_url = normalizeOptionalText(data.contact_linkedin_url);
        assertValidHttpsUrl('contact_linkedin_url', sanitized.contact_linkedin_url);
    }

    return sanitized;
};

module.exports = {
    buildSanitizedOrganizationPayload,
    normalizeOptionalText
};
