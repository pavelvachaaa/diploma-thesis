const { handle, sendResult } = require('@shared/http/controller');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({ documentTypesApplication }) => {
    const validateRequest = (req, res) => ensureRequestValid(req, res, {
        legacyErrorsArray: true
    });

    const getAll = handle(async (_req, res) => {
        const documentTypes = await documentTypesApplication.getAll();
        return sendResult(res, documentTypes);
    });

    const getById = handle(async (req, res) => {
        const documentType = await documentTypesApplication.getById(req.params.id);
        if (!documentType) return sendResult(res, { message: 'Document type not found' }, 404);
        return sendResult(res, documentType);
    });

    const create = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const documentType = await documentTypesApplication.create(req.body);
        return sendResult(res, documentType, 201);
    });

    const update = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const documentType = await documentTypesApplication.update(req.params.id, req.body);
        if (!documentType) return sendResult(res, { message: 'Document type not found' }, 404);
        return sendResult(res, documentType);
    });

    const deleteOne = handle(async (req, res) => {
        const documentType = await documentTypesApplication.delete(req.params.id);
        if (!documentType) return sendResult(res, { message: 'Document type not found' }, 404);
        return sendResult(res, { message: 'Document type deleted successfully' });
    });

    return { getAll, getById, create, update, delete: deleteOne };
};
