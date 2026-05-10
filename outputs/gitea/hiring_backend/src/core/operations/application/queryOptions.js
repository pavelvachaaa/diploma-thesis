const normalizePage = (value, fallback = 0) => {
    const parsed = Number(value ?? fallback);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeLimit = (value, fallback = 50, max = 200) => {
    const parsed = Number(value ?? fallback);
    if (Number.isNaN(parsed)) {
        return fallback;
    }
    return Math.min(Math.max(parsed, 1), max);
};

const normalizeAuditFilters = (filters = {}) => ({
    ...filters,
    page: normalizePage(filters.page),
    limit: normalizeLimit(filters.limit)
});

const normalizeOutboxEventFilters = (filters = {}) => ({
    page: normalizePage(filters.page),
    limit: normalizeLimit(filters.limit),
    status: filters.status ?? null,
    eventType: filters.eventType ?? null
});

const normalizeOutboxSummaryFilters = (filters = {}) => ({
    status: filters.status ?? null,
    eventType: filters.eventType ?? null
});

const normalizeReplaySelection = (selection = {}) => Object.freeze({
    ids: Array.isArray(selection.ids) ? [...selection.ids] : [],
    eventType: selection.eventType ?? null,
    limit: selection.limit,
    execute: selection.execute === true
});

module.exports = {
    normalizeAuditFilters,
    normalizeOutboxEventFilters,
    normalizeOutboxSummaryFilters,
    normalizeReplaySelection
};
