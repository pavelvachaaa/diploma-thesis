const { handle, sendResult } = require('@shared/http/controller');
const { toAuditFilters } = require('./audit.mapper');

module.exports = ({ operationsAuditApplication }) => ({
    getEvents: handle(async (req, res) => sendResult(
        res,
        await operationsAuditApplication.getEvents(toAuditFilters(req.query), req.user)
    ))
});
