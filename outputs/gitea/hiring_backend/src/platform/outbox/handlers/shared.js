const normalizeEventType = (value) => String(value || '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
    .toLowerCase();

const buildNormalizedTypeSet = (value, aliases = []) => {
    const normalized = [value, ...aliases]
        .map((item) => normalizeEventType(item))
        .filter(Boolean);

    return new Set(normalized);
};

const normalizePrefixes = (prefixes = []) => (prefixes || [])
    .map((prefix) => normalizeEventType(prefix))
    .filter(Boolean);

const createOutboxStrategy = ({
    key,
    eventTypes,
    prefixes = [],
    dispatch
}) => {
    if (!key || typeof key !== 'string') {
        throw new Error('Outbox strategy key is required');
    }

    if (!(eventTypes instanceof Set)) {
        throw new Error(`Outbox strategy "${key}" requires eventTypes as Set`);
    }

    if (typeof dispatch !== 'function') {
        throw new Error(`Outbox strategy "${key}" requires dispatch(event)`);
    }

    const normalizedPrefixes = normalizePrefixes(prefixes);

    return {
        key,
        eventTypes,
        prefixes: normalizedPrefixes,
        supports: (normalizedEventType) => {
            if (!normalizedEventType) {
                return false;
            }

            if (eventTypes.has(normalizedEventType)) {
                return true;
            }

            return normalizedPrefixes.some((prefix) => normalizedEventType.startsWith(prefix));
        },
        dispatch
    };
};

const createPermanentHandlerError = (message, code = 'SIDE_EFFECT_OUTBOX_UNSUPPORTED_EVENT') => {
    const error = new Error(message);
    error.code = code;
    error.isPermanent = true;
    return error;
};

module.exports = {
    normalizeEventType,
    buildNormalizedTypeSet,
    createOutboxStrategy,
    createPermanentHandlerError
};
