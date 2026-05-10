const normalizeName = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

const normalizeNameKey = (value) => normalizeName(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getUniqueSortedJobRoleNames = (values = []) => {
    const seen = new Set();
    const unique = [];

    for (const value of values || []) {
        const name = normalizeName(value);
        if (!name) continue;

        const key = normalizeNameKey(name);
        if (seen.has(key)) continue;

        seen.add(key);
        unique.push(name);
    }

    return unique.sort((a, b) => a.localeCompare(b, 'cs', { sensitivity: 'base' }));
};

module.exports = {
    getUniqueSortedJobRoleNames
};
