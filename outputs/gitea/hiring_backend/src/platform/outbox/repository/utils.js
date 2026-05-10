const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const DEFAULT_REPLAY_LIMIT = 100;
const MAX_REPLAY_LIMIT = 500;

const toPositiveInt = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.min(Math.trunc(parsed), max);
};

const buildFilterClauses = (filters = {}, startingIndex = 1) => {
    const conditions = [];
    const params = [];
    let idx = startingIndex;

    if (filters.status) {
        conditions.push(`status = $${idx}`);
        params.push(filters.status);
        idx += 1;
    }

    if (filters.eventType) {
        conditions.push(`event_type = $${idx}`);
        params.push(filters.eventType);
        idx += 1;
    }

    return { conditions, params, nextIndex: idx };
};

const buildReplaySelection = (selection = {}) => {
    const ids = Array.isArray(selection.ids)
        ? selection.ids.map((id) => String(id).trim()).filter(Boolean)
        : [];
    const eventType = selection.eventType ? String(selection.eventType).trim() : null;
    const limit = ids.length > 0
        ? ids.length
        : toPositiveInt(selection.limit, DEFAULT_REPLAY_LIMIT, MAX_REPLAY_LIMIT);

    return {
        ids,
        eventType,
        limit
    };
};

module.exports = {
    DEFAULT_LIST_LIMIT,
    MAX_LIST_LIMIT,
    DEFAULT_REPLAY_LIMIT,
    MAX_REPLAY_LIMIT,
    toPositiveInt,
    buildFilterClauses,
    buildReplaySelection
};
