const { handle, sendResult } = require('@shared/http/controller');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({ organizationsApplication }) => {
    const validateRequest = (req, res) => ensureRequestValid(req, res, {
        legacyErrorsArray: true
    });

    const notFound = (message = 'Organization not found') => ({
        statusCode: 404,
        body: { message }
    });

    const requireUploadedFile = (req) => {
        if (req.file) {
            return null;
        }

        return {
            statusCode: 400,
            body: { error: 'No file uploaded' }
        };
    };

    const getAll = handle(async (req, res) => {
        const { page = 0, limit = 50, search = '' } = req.query;

        const result = await organizationsApplication.getAll({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search,
            actorUserId: req.user?.id || null
        });

        return sendResult(res, result);
    });

    const getById = handle(async (req, res) => {
        const organization = await organizationsApplication.getById(req.params.id, {
            actorUserId: req.user?.id || null,
            minAccess: 'read'
        });

        if (!organization) {
            return sendResult(res, notFound());
        }

        return sendResult(res, organization);
    });

    const create = handle(async (req, res) => {
        if (!validateRequest(req, res)) {
            return;
        }

        const organization = await organizationsApplication.create(req.body, {
            actorRole: req.user?.role || null
        });
        return sendResult(res, organization, 201);
    });

    const update = handle(async (req, res) => {
        if (!validateRequest(req, res)) {
            return;
        }

        const organization = await organizationsApplication.update(req.params.id, req.body, {
            actorRole: req.user?.role || null,
            actorUserId: req.user?.id || null,
            minAccess: 'admin'
        });

        if (!organization) {
            return sendResult(res, notFound());
        }

        return sendResult(res, organization);
    });

    const deleteOne = handle(async (req, res) => {
        const organization = await organizationsApplication.delete(req.params.id, {
            actorRole: req.user?.role || null,
            actorUserId: req.user?.id || null,
            minAccess: 'admin'
        });

        if (!organization) {
            return sendResult(res, notFound());
        }

        return sendResult(res, { message: 'Organization deleted successfully' });
    });

    const uploadContactPhoto = handle(async (req, res) => {
        const missingFile = requireUploadedFile(req);
        if (missingFile) {
            return sendResult(res, missingFile);
        }

        const organization = await organizationsApplication.uploadContactPhoto(
            req.params.id,
            req.file,
            req.user?.id || null,
            {
                actorRole: req.user?.role || null,
                actorUserId: req.user?.id || null,
                minAccess: 'admin'
            }
        );

        if (!organization) {
            return sendResult(res, notFound());
        }

        return sendResult(res, organization);
    });

    const deleteContactPhoto = handle(async (req, res) => {
        const organization = await organizationsApplication.deleteContactPhoto(req.params.id, {
            actorRole: req.user?.role || null,
            actorUserId: req.user?.id || null,
            minAccess: 'admin'
        });

        if (!organization) {
            return sendResult(res, notFound());
        }

        return sendResult(res, organization);
    });

    const getContactPhoto = handle(async (req, res) => {
        const organization = await organizationsApplication.getById(req.params.id, {
            actorUserId: req.user?.id || null,
            minAccess: 'read'
        });

        if (!organization?.contact_photo_file_id) {
            return sendResult(res, {
                statusCode: 404,
                body: { message: 'Organization contact photo not found' }
            });
        }

        if (!organization.contact_photo_url) {
            return sendResult(res, {
                statusCode: 503,
                body: { message: 'Organization contact photo is not publicly available' }
            });
        }

        return res.redirect(organization.contact_photo_url);
    });

    return {
        getAll,
        getById,
        create,
        update,
        uploadContactPhoto,
        deleteContactPhoto,
        getContactPhoto,
        delete: deleteOne
    };
};
