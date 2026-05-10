const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const DEFAULT_PAGE = 0;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const VALIDITY_VALUES = new Set(['valid', 'all', 'invalid']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPECIALTY_TYPE_PATTERN = /^[a-z_]+$/;

const toNonNegativeInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

const toPositiveInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, MAX_LIMIT) : fallback;
};

const optionalText = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();
    return text && text !== 'all' ? text : null;
};

const validateUuid = (value, field) => {
    if (value && !UUID_PATTERN.test(value)) {
        throw new ApplicationError('MZCR accreditation filter is invalid', {
            code: ErrorCode.VALIDATION_ERROR,
            details: {
                reasonCode: 'MZCR_ACCREDITATION_FILTER_INVALID',
                field
            }
        });
    }
};

const normalizeQuery = (query = {}) => {
    const organizationId = optionalText(query.organizationId);
    const specialtyType = optionalText(query.specialtyType);
    const validity = VALIDITY_VALUES.has(String(query.validity || '').trim())
        ? String(query.validity).trim()
        : 'valid';

    validateUuid(organizationId, 'organizationId');

    if (specialtyType && !SPECIALTY_TYPE_PATTERN.test(specialtyType)) {
        throw new ApplicationError('MZCR accreditation specialty type is invalid', {
            code: ErrorCode.VALIDATION_ERROR,
            details: {
                reasonCode: 'MZCR_ACCREDITATION_SPECIALTY_TYPE_INVALID'
            }
        });
    }

    return {
        page: toNonNegativeInteger(query.page, DEFAULT_PAGE),
        limit: toPositiveInteger(query.limit, DEFAULT_LIMIT),
        organizationId,
        validity,
        specialtyType,
        q: optionalText(query.q),
        actorUserId: query.actorUserId || null
    };
};

module.exports = ({ mzcrAccreditationStorePort }) => {
    return (query = {}) => mzcrAccreditationStorePort.listAccreditations(normalizeQuery(query));
};
