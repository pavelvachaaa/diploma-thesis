const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ emailApplication }) => {
    const getAll = handle(async (req, res) => {
        const templates = await emailApplication.getEmailTemplates({
            organizationId: req.query.organization_id || req.query.organizationId || null,
            type: req.query.type || null,
            actorUserId: req.user?.id || null
        });
        return sendResult(res, templates);
    });

    const getById = handle(async (req, res) => {
        const template = await emailApplication.getEmailTemplate(req.params.id, {
            actorUserId: req.user?.id || null
        });
        return sendResult(res, template);
    });

    const create = handle(async (req, res) => {
        const template = await emailApplication.createEmailTemplate({
            organizationId: req.body?.organization_id || req.body?.organizationId,
            name: req.body?.name,
            type: req.body?.type,
            subject: req.body?.subject,
            body: req.body?.body,
            createdBy: req.user?.id
        }, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        return sendResult(res, template, 201);
    });

    const update = handle(async (req, res) => {
        const template = await emailApplication.updateEmailTemplate(
            req.params.id,
            {
                name: req.body?.name,
                type: req.body?.type,
                subject: req.body?.subject,
                body: req.body?.body
            },
            { actorUserId: req.user?.id || null, minAccess: 'write' }
        );
        return sendResult(res, template);
    });

    const remove = handle(async (req, res) => {
        await emailApplication.deleteEmailTemplate(req.params.id, {
            actorUserId: req.user?.id || null,
            minAccess: 'write'
        });
        return sendResult(res, null, 204);
    });

    return { getAll, getById, create, update, remove };
};
