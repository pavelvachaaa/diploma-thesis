function sanitizePreferredPositionName(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const cleaned = value
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return cleaned ? cleaned.slice(0, 255) : null;
}

function normalizePreferredPositionKey(value) {
    const sanitized = sanitizePreferredPositionName(value);
    if (!sanitized) {
        return null;
    }

    return sanitized
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

module.exports = Object.freeze({
    sanitizePreferredPositionName,
    normalizePreferredPositionKey
});
