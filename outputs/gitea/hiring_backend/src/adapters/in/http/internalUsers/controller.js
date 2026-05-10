const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ internalUsersApplication }) => {
    const search = handle(async (req, res) => {
        const result = await internalUsersApplication.search({
            query: req.query?.q
        });

        return sendResult(res, result);
    });

    return {
        search
    };
};
