module.exports = ({
    emitAudit,
    createSnapshot,
    getChangedFields
}) => {
    const emitApplicantChildAudit = ({
        action,
        applicant,
        applicantId,
        auditFields,
        beforeEntity = null,
        afterEntity = null,
        metadata = {}
    }) => {
        const beforeState = createSnapshot(beforeEntity, auditFields);
        const afterState = createSnapshot(afterEntity, auditFields);
        const resolvedApplicantId = applicantId || afterEntity?.applicant_id || beforeEntity?.applicant_id || null;
        const resolvedMetadata = { ...metadata };

        if (beforeState && afterState) {
            resolvedMetadata.changedFields = getChangedFields(beforeState, afterState);
        }

        emitAudit({
            category: 'applicant',
            action,
            status: 'success',
            resourceType: 'applicant',
            resourceId: resolvedApplicantId,
            organizationId: applicant?.organization_id || null,
            beforeState,
            afterState,
            metadata: resolvedMetadata
        });
    };

    return {
        emitApplicantChildAudit
    };
};
