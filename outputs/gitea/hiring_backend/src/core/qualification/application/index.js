const createLookupQualification = require('./lookupQualification');

module.exports = ({ qualificationProviderPort, qualificationAuditPort }) => {
    const lookupQualification = createLookupQualification({
        qualificationProviderPort,
        qualificationAuditPort
    });

    return {
        lookupQualification
    };
};
