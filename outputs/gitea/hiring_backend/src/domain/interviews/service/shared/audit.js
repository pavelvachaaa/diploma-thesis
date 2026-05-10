const { createSnapshot, getChangedFields } = require('@shared/audit/state');
const { INTERVIEW_AUDIT_FIELDS } = require('./constants');

module.exports = ({ audit }) => {
    const emitAudit = (event) => {
        void audit.writeAuditEvent(event);
    };

    const createInterviewSnapshot = (resource) => createSnapshot(resource, INTERVIEW_AUDIT_FIELDS);

    return {
        emitAudit,
        createInterviewSnapshot,
        getChangedFields
    };
};
