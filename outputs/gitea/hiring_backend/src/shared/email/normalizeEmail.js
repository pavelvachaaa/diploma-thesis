const normalizeEmail = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized;
};

module.exports = normalizeEmail;
