const AuditAccessScope = require('@core/operations/domain/AuditAccessScope');
const { normalizeAuditFilters } = require('@core/operations/application/queryOptions');

module.exports = ({ operationsAuditStorePort }) => {
    const buildScopedOptions = (filters = {}, actor = {}) => ({
        ...normalizeAuditFilters(filters),
        ...AuditAccessScope.create(actor)
    });

    const getEvents = (filters = {}, actor = {}) => (
        operationsAuditStorePort.getEvents(buildScopedOptions(filters, actor))
    );

    const getEmployeeEvents = (employeeId, filters = {}, actor = {}) => (
        operationsAuditStorePort.getEmployeeEvents({
            ...buildScopedOptions(filters, actor),
            employeeId
        })
    );

    return {
        getEvents,
        getEmployeeEvents
    };
};
