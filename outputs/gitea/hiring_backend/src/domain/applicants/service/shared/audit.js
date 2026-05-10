const { createSnapshot, getChangedFields } = require('@shared/audit/state');

module.exports = ({ audit }) => {
    const emitAudit = (event) => {
        void audit.writeAuditEvent(event);
    };

    return {
        emitAudit,
        createSnapshot,
        getChangedFields
    };
};
