const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ mzcrAccreditationsApplication }) => {
    const getAll = handle(async (req, res) => {
        const result = await mzcrAccreditationsApplication.listMzcrAccreditations({
            page: req.query?.page,
            limit: req.query?.limit,
            organizationId: req.query?.organizationId,
            validity: req.query?.validity,
            specialtyType: req.query?.specialtyType,
            q: req.query?.q,
            actorUserId: req.user?.id || null
        });

        return sendResult(res, result);
    });

    const getMeta = handle(async (req, res) => {
        const result = await mzcrAccreditationsApplication.getMzcrAccreditationMeta({
            actorUserId: req.user?.id || null
        });

        return sendResult(res, result);
    });

    return {
        getAll,
        getMeta
    };
};
