const QualificationLookupAttempt = require('@core/qualification/domain/QualificationLookupAttempt');
const QualificationLookupRequest = require('@core/qualification/domain/QualificationLookupRequest');
const QualificationLookupResult = require('@core/qualification/domain/QualificationLookupResult');

const buildAuditEvent = ({ snapshot, result = null, error = null }) => {
    const actor = snapshot?.actor || {};
    const outcomeCode = error
        ? (error?.details?.reasonCode || error?.code || 'QUALIFICATION_LOOKUP_FAILED')
        : 'QUALIFICATION_LOOKUP_SUCCESS';

    return {
        status: error ? 'failure' : 'success',
        actorUserId: actor.id || null,
        actorEmail: actor.email || null,
        actorRoles: actor.roles || null,
        organizationId: actor.organizationId || null,
        resourceType: snapshot?.applicantId ? 'applicant' : 'qualification_lookup',
        resourceId: snapshot?.applicantId || null,
        errorMessage: error?.message || null,
        searchType: snapshot?.searchType || null,
        queryMasked: snapshot?.queryMasked || null,
        queryHash: snapshot?.queryHash || null,
        applicantId: snapshot?.applicantId || null,
        upstream: error
            ? {
                code: error?.code || null,
                status: error?.status || null
            }
            : (result?.upstream || null),
        outcomeCode
    };
};

module.exports = ({ qualificationProviderPort, qualificationAuditPort }) => {
    return async (payload = {}) => {
        const attempt = QualificationLookupAttempt.create(payload);
        let request = null;

        try {
            request = QualificationLookupRequest.create(payload);

            const providerResult = request.searchType === 'nrzp'
                ? await qualificationProviderPort.lookupByWorkerNumber({
                    workerNumber: request.normalizedQuery
                })
                : await qualificationProviderPort.lookupByBirthNumber({
                    birthNumber: request.normalizedQuery
                });

            const result = QualificationLookupResult.create({
                request,
                providerResult
            });

            await qualificationAuditPort.recordLookup(
                buildAuditEvent({
                    snapshot: request,
                    result
                })
            );

            return result;
        } catch (error) {
            await qualificationAuditPort.recordLookup(
                buildAuditEvent({
                    snapshot: request || attempt,
                    error
                })
            );

            throw error;
        }
    };
};
