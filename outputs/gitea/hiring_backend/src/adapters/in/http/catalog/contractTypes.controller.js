const { handle, sendResult } = require('@shared/http/controller');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({ contractTypesApplication }) => {
    const validateRequest = (req, res) => ensureRequestValid(req, res, {
        legacyErrorsArray: true
    });

    const getAll = handle(async (_req, res) => {
        const contractTypes = await contractTypesApplication.getAll();
        return sendResult(res, contractTypes);
    });

    const getByCode = handle(async (req, res) => {
        const contractType = await contractTypesApplication.getByCode(req.params.code);
        if (!contractType) return sendResult(res, { message: 'Contract type not found' }, 404);
        return sendResult(res, contractType);
    });

    const create = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const contractType = await contractTypesApplication.create(req.body);
        return sendResult(res, contractType, 201);
    });

    const update = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const contractType = await contractTypesApplication.update(req.params.code, req.body);
        if (!contractType) return sendResult(res, { message: 'Contract type not found' }, 404);
        return sendResult(res, contractType);
    });

    const deleteOne = handle(async (req, res) => {
        const contractType = await contractTypesApplication.delete(req.params.code);
        if (!contractType) return sendResult(res, { message: 'Contract type not found' }, 404);
        return sendResult(res, { message: 'Contract type deleted successfully' });
    });

    return { getAll, getByCode, create, update, delete: deleteOne };
};
