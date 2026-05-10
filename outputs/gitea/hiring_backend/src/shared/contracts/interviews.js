const toApplicantOrgContext = (applicant) => ({
    applicantId: applicant?.id || null,
    organizationId: applicant?.organization_id || null,
    fullName: `${applicant?.name || ''} ${applicant?.surname || ''}`.trim()
});

module.exports = {
    toApplicantOrgContext
};
