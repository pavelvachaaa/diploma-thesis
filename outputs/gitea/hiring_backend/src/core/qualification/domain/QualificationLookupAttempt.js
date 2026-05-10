const { createHash } = require('node:crypto');

const normalizeNullableString = (value) => {
    const normalized = String(value || '').trim();
    return normalized || null;
};

const normalizeSearchType = (value) => String(value || '').trim().toLowerCase();

const normalizeNrzpNumber = (query) => {
    return String(query || '').trim().replace(/\s+/g, '');
};

const normalizeBirthNumber = (query) => {
    return String(query || '').trim().replace(/[\s/]+/g, '');
};

const normalizeQueryForType = (searchType, query) => {
    return searchType === 'rodne_cislo'
        ? normalizeBirthNumber(query)
        : normalizeNrzpNumber(query);
};

const maskValue = (rawValue) => {
    const value = String(rawValue || '');
    if (!value) {
        return null;
    }

    if (value.length <= 4) {
        return '*'.repeat(value.length);
    }

    return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
};

const hashValue = (rawValue) => {
    const value = String(rawValue || '');
    if (!value) {
        return null;
    }

    return createHash('sha256').update(value).digest('hex');
};

const normalizeActor = (actor = {}) => {
    const roles = Array.isArray(actor.roles)
        ? actor.roles
            .map((role) => String(role || '').trim())
            .filter(Boolean)
        : [];

    return Object.freeze({
        id: normalizeNullableString(actor.id),
        email: normalizeNullableString(actor.email),
        roles: Object.freeze(roles),
        organizationId: normalizeNullableString(actor.organizationId)
    });
};

const create = (payload = {}) => {
    const searchType = normalizeSearchType(payload.searchType);
    const normalizedQuery = normalizeQueryForType(searchType, payload.query);

    return Object.freeze({
        searchType,
        normalizedQuery,
        queryMasked: maskValue(normalizedQuery),
        queryHash: hashValue(normalizedQuery),
        applicantId: normalizeNullableString(payload.applicantId),
        actor: normalizeActor(payload.actor)
    });
};

module.exports = {
    create,
    hashValue,
    maskValue,
    normalizeActor,
    normalizeBirthNumber,
    normalizeNrzpNumber,
    normalizeQueryForType,
    normalizeSearchType
};
