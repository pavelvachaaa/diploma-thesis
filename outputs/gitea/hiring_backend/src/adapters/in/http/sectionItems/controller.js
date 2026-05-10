const { handle, sendResult } = require('@shared/http/controller');
const { toBySectionTypeOptions } = require('./sectionItems.mapper');

module.exports = ({ sectionItemsApplication }) => {
    const notFound = (message) => ({
        statusCode: 404,
        body: { message }
    });

    const getAllSectionTypes = handle(async (_req, res) => {
        const sectionTypes = await sectionItemsApplication.getAllSectionTypes();
        return sendResult(res, sectionTypes);
    });

    const getAll = handle(async (req, res) => {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.q,
            sectionType: req.query.sectionType,
            activeOnly: req.query.activeOnly
        };
        const result = await sectionItemsApplication.getAll(options);
        return sendResult(res, result);
    });

    const getBySectionType = handle(async (req, res) => {
        const items = await sectionItemsApplication.getBySectionType(
            req.params.sectionType,
            toBySectionTypeOptions(req.query)
        );
        return sendResult(res, items);
    });

    const getById = handle(async (req, res) => {
        const item = await sectionItemsApplication.getById(req.params.id);
        if (!item) {
            return sendResult(res, notFound('Section item not found'));
        }

        return sendResult(res, item);
    });

    const create = handle(async (req, res) => {
        const item = await sectionItemsApplication.create(req.body);
        return sendResult(res, item, 201);
    });

    const update = handle(async (req, res) => {
        const item = await sectionItemsApplication.update(req.params.id, req.body);
        if (!item) {
            return sendResult(res, notFound('Section item not found'));
        }

        return sendResult(res, item);
    });

    const deleteOne = handle(async (req, res) => {
        const item = await sectionItemsApplication.delete(req.params.id);
        if (!item) {
            return sendResult(res, notFound('Section item not found'));
        }

        return sendResult(res, { message: 'Section item deleted successfully' });
    });

    const updateOrderIndices = handle(async (req, res) => {
        await sectionItemsApplication.updateOrderIndices(req.body.items);
        return sendResult(res, { message: 'Order indices updated successfully' });
    });

    const getByJobRole = handle(async (req, res) => {
        const items = await sectionItemsApplication.getByJobRole(req.params.jobRoleId, {
            actorUserId: req.user?.id || null
        });
        return sendResult(res, items);
    });

    const addToJobRole = handle(async (req, res) => {
        const item = await sectionItemsApplication.addToJobRole(req.params.jobRoleId, req.body, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        if (!item) {
            return sendResult(res, notFound('Job role not found'));
        }

        return sendResult(res, item, 201);
    });

    const updateJobRoleItem = handle(async (req, res) => {
        const item = await sectionItemsApplication.updateJobRoleItem(req.params.id, req.body, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        if (!item) {
            return sendResult(res, notFound('Job role section item not found'));
        }

        return sendResult(res, item);
    });

    const removeFromJobRole = handle(async (req, res) => {
        const item = await sectionItemsApplication.removeFromJobRole(req.params.id, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        if (!item) {
            return sendResult(res, notFound('Job role section item not found'));
        }

        return sendResult(res, { message: 'Job role section item removed successfully' });
    });

    const replaceJobRoleSectionItems = handle(async (req, res) => {
        await sectionItemsApplication.replaceJobRoleSectionItems(
            req.params.jobRoleId,
            req.params.sectionType,
            req.body.items,
            {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            }
        );
        return sendResult(res, { message: 'Job role section items replaced successfully' });
    });

    return {
        getAllSectionTypes,
        getAll,
        getBySectionType,
        getById,
        create,
        update,
        delete: deleteOne,
        updateOrderIndices,
        getByJobRole,
        addToJobRole,
        updateJobRoleItem,
        removeFromJobRole,
        replaceJobRoleSectionItems
    };
};
