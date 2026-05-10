const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (v) => (typeof v === 'string' ? v.trim() : '');
const normalizeOptional = (v) => {
    const t = normalizeText(v);
    return t || null;
};

/**
 * Value object factory — validates invariants and returns a frozen draft
 * ready to be persisted via the store port.
 *
 * @throws {ApplicationError} VALIDATION_ERROR if any required field is missing or invalid
 */
const create = (data = {}) => {
    const name = normalizeText(data.name);
    const email = normalizeText(data.email);
    const phone = normalizeOptional(data.phone);
    const message = normalizeText(data.message);
    const gdprConsent = data.gdprConsent === true;

    if (!name) {
        throw new ApplicationError('Name is required', { code: ErrorCode.VALIDATION_ERROR });
    }
    if (!email) {
        throw new ApplicationError('Email is required', { code: ErrorCode.VALIDATION_ERROR });
    }
    if (!EMAIL_REGEX.test(email)) {
        throw new ApplicationError('Valid email address is required', { code: ErrorCode.VALIDATION_ERROR });
    }
    if (!message) {
        throw new ApplicationError('Message is required', { code: ErrorCode.VALIDATION_ERROR });
    }
    if (!gdprConsent) {
        throw new ApplicationError('GDPR consent is required', { code: ErrorCode.VALIDATION_ERROR });
    }

    return Object.freeze({ name, email, phone, message, gdprConsent: true });
};

/**
 * ReplyStatus — the set of valid inquiry reply states used as filter criteria.
 * The domain owns this because answered/unanswered/all is a business invariant,
 * not a database or UI decision.
 */
const ReplyStatus = Object.freeze({
    ANSWERED: 'answered',
    UNANSWERED: 'unanswered',
    ALL: 'all',

    /**
     * Coerces an arbitrary string into a valid ReplyStatus.
     * Unknown values fall back to ALL.
     */
    from(value) {
        if (value === 'answered' || value === 'unanswered') {
            return value;
        }
        return 'all';
    }
});

/**
 * FilterCriteria value object — represents a validated query contract for listing
 * contact inquiries. The application layer constructs this from raw HTTP params
 * and passes it to the store port.
 */
const filterQuery = ({ search = '', status = 'all' } = {}) => {
    return Object.freeze({
        search: normalizeText(search),
        status: ReplyStatus.from(status)
    });
};

module.exports = { create, filterQuery, ReplyStatus };
