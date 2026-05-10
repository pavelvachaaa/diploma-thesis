const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ qualificationApplication }) => {
    const lookup = handle(async (req, res) => {
        const result = await qualificationApplication.lookupQualification({
            searchType: req.body?.searchType,
            query: req.body?.query,
            applicantId: req.body?.applicantId,
            actor: {
                id: req.user?.id || null,
                email: req.user?.email || null,
                roles: req.user?.roles || [],
                organizationId: req.user?.organization_id || null
            }
        });

        return sendResult(res, result, 200);
    });

    return {
        lookup
    };
};
