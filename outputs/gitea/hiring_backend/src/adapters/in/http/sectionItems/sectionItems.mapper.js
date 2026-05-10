const toBySectionTypeOptions = (query = {}) => {
    const limit = Number.parseInt(query.limit, 10);

    return {
        activeOnly: query.activeOnly !== 'false',
        search: typeof query.q === 'string' ? query.q : '',
        limit: Number.isInteger(limit) && limit > 0 ? limit : undefined
    };
};

module.exports = {
    toBySectionTypeOptions
};
