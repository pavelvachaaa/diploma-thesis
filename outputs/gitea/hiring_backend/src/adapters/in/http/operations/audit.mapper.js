const toAuditFilters = (query = {}) => ({
    page: query.page,
    limit: query.limit,
    actorUserId: query.actorUserId || null,
    category: query.category || null,
    action: query.action || null,
    status: query.status || null,
    resourceType: query.resourceType || null,
    resourceId: query.resourceId || null,
    dateFrom: query.dateFrom || null,
    dateTo: query.dateTo || null
});

module.exports = {
    toAuditFilters
};
