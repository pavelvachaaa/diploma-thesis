const toInteger = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeListOptions = (options = {}) => ({
    page: toInteger(options.page, 0),
    limit: toInteger(options.limit, 50),
    search: options.search || undefined,
    sectionType: options.sectionType || undefined,
    activeOnly: options.activeOnly === true || options.activeOnly === 'true'
});

const normalizeSectionTypeLookup = (options = {}) => {
    const activeOnly = options.activeOnly !== false && options.activeOnly !== 'false';
    const search = typeof options.search === 'string' ? options.search : '';
    const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : undefined;

    return {
        activeOnly,
        search,
        limit
    };
};

module.exports = {
    normalizeListOptions,
    normalizeSectionTypeLookup
};
