const { handle, sendResult } = require('@shared/http/controller');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({ jobRolesApplication }) => {
    const validateRequest = (req, res) => ensureRequestValid(req, res, {
        legacyErrorsArray: true
    });

    const getAll = handle(async (req, res) => {
        const options = {
            page: parseInt(req.query.page, 10) || 0,
            limit: parseInt(req.query.limit, 10) || 50,
            search: req.query.q,
            organizationId: req.query.org || null,
            classificationCode: req.query.classification,
            actorUserId: req.user?.id || null
        };
        const result = await jobRolesApplication.getAll(options);
        return sendResult(res, result);
    });

    const getById = handle(async (req, res) => {
        const jobRole = await jobRolesApplication.getById(req.params.id, {
            actorUserId: req.user?.id || null,
            minAccess: 'read'
        });
        if (!jobRole) return sendResult(res, { message: 'Job role not found' }, 404);
        return sendResult(res, jobRole);
    });

    const getByOrganization = handle(async (req, res) => {
        const jobRoles = await jobRolesApplication.getByOrganization(req.params.organizationId, {
            actorUserId: req.user?.id || null,
            minAccess: 'read'
        });
        return sendResult(res, jobRoles);
    });

    const getUniqueNames = handle(async (_req, res) => {
        const names = await jobRolesApplication.getUniqueNames();
        return sendResult(res, names);
    });

    const create = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        if (!req.body.organization_id) {
            return sendResult(res, { message: 'organization_id is required' }, 400);
        }

        const jobRole = await jobRolesApplication.create({ ...req.body }, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        if (!jobRole) return sendResult(res, { message: 'Organization not found or access denied' }, 404);
        return sendResult(res, jobRole, 201);
    });

    const update = handle(async (req, res) => {
        if (!validateRequest(req, res)) return;

        const jobRole = await jobRolesApplication.update(req.params.id, req.body, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        if (!jobRole) return sendResult(res, { message: 'Job role not found' }, 404);
        return sendResult(res, jobRole);
    });

    const deleteOne = handle(async (req, res) => {
        const jobRole = await jobRolesApplication.delete(req.params.id, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        if (!jobRole) return sendResult(res, { message: 'Job role not found' }, 404);
        return sendResult(res, { message: 'Job role deleted successfully' });
    });

    const getAllClassifications = handle(async (_req, res) => {
        const classifications = await jobRolesApplication.getAllClassifications();
        return sendResult(res, classifications);
    });

    return { getAll, getById, getByOrganization, getUniqueNames, create, update, delete: deleteOne, getAllClassifications };
};
