const parseIds = (value) => {
    if (Array.isArray(value)) {
        return value.map((id) => String(id).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
    }

    return [];
};

const toOutboxFilters = (query = {}) => ({
    page: query.page,
    limit: query.limit,
    status: query.status || null,
    eventType: query.eventType || query.event_type || null
});

const toOutboxSummaryFilters = (query = {}) => ({
    status: query.status || null,
    eventType: query.eventType || query.event_type || null
});

const toReplaySelection = (body = {}) => ({
    ids: parseIds(body.ids),
    eventType: body.eventType || body.event_type || null,
    limit: body.limit,
    execute: body.execute
});

const toActorOptions = (user = {}) => ({
    actorUserId: user.id || null,
    actorEmail: user.email || null,
    actorRoles: user.roles || [],
    organizationId: user.organization_id || null,
    source: 'admin-api'
});

module.exports = {
    toOutboxFilters,
    toOutboxSummaryFilters,
    toReplaySelection,
    toActorOptions
};
