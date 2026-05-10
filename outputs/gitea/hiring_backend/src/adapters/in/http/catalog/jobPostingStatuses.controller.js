const { handle, sendResult } = require('@shared/http/controller');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({ jobPostingStatusesApplication }) => {
    const validateRequest = (req, res) => ensureRequestValid(req, res, {
        legacyErrorsArray: true
    });

    const getAll = handle(async (_req, res) => {
        const statuses = await jobPostingStatusesApplication.getAll();
        return sendResult(res, statuses);
    });

    const getByCode = handle(async (req, res) => {
        const status = await jobPostingStatusesApplication.getByCode(req.params.code);
        if (!status) return sendResult(res, { message: 'Job posting status not found' }, 404);
        return sendResult(res, status);
    });

    const create = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const status = await jobPostingStatusesApplication.create(req.body);
        return sendResult(res, status, 201);
    });

    const update = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const status = await jobPostingStatusesApplication.update(req.params.code, req.body);
        if (!status) return sendResult(res, { message: 'Job posting status not found' }, 404);
        return sendResult(res, status);
    });

    const deleteOne = handle(async (req, res) => {
        const status = await jobPostingStatusesApplication.delete(req.params.code);
        if (!status) return sendResult(res, { message: 'Job posting status not found' }, 404);
        return sendResult(res, { message: 'Job posting status deleted successfully' });
    });

    return { getAll, getByCode, create, update, delete: deleteOne };
};
