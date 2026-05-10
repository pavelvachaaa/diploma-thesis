module.exports = ({ onboardingDocumentsService, runWrite, ensureRequestValid }) => {
    const getAll = async (req, res, next) => {
        try {
            const options = {
                page: parseInt(req.query.page, 10) || 0,
                limit: parseInt(req.query.limit, 10) || 50,
                search: req.query.q,
                organizationId: req.query.org || req.query.organizationId || null,
                typeId: req.query.type,
                required: req.query.required ? req.query.required === 'true' : undefined,
                actorUserId: req.user?.id || null
            };

            const result = await onboardingDocumentsService.getAll(options);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    const getById = async (req, res, next) => {
        try {
            const document = await onboardingDocumentsService.getById(req.params.id, {
                actorUserId: req.user?.id || null
            });
            if (!document) {
                return res.status(404).json({ message: 'Onboarding document not found' });
            }

            res.json(document);
        } catch (error) {
            next(error);
        }
    };

    const getByOrganization = async (req, res, next) => {
        try {
            const documents = await onboardingDocumentsService.getByOrganization(req.params.organizationId, {
                actorUserId: req.user?.id || null
            });
            res.json(documents);
        } catch (error) {
            next(error);
        }
    };

    const create = async (req, res, next) => {
        try {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const fileData = req.file
                ? {
                    file_name: req.file.originalname,
                    file_path: req.file.key,
                    bucket: req.file.bucket,
                    mime_type: req.file.mimetype,
                    file_size: req.file.size,
                    checksum_sha256: req.file.checksum_sha256 || null,
                    uploaded_at: new Date()
                }
                : {};

            const documentData = {
                ...req.body,
                ...fileData,
                organization_id: req.body.organization_id || req.user?.organization_id || null
            };

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.create',
                fallbackStatusCode: 201,
                handler: async () => onboardingDocumentsService.create(documentData, {
                    actorUserId: req.user?.id || null,
                    minAccess: 'write'
                })
            });
            res.status(result.statusCode).json(result.body);
        } catch (error) {
            next(error);
        }
    };

    const update = async (req, res, next) => {
        try {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.update',
                fallbackStatusCode: 200,
                handler: async () => {
                    const document = await onboardingDocumentsService.update(req.params.id, req.body, {
                        actorUserId: req.user?.id || null,
                        minAccess: 'write'
                    });
                    if (!document) {
                        return {
                            statusCode: 404,
                            body: { message: 'Onboarding document not found' }
                        };
                    }

                    return document;
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (error) {
            next(error);
        }
    };

    const deleteOne = async (req, res, next) => {
        try {
            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.delete',
                fallbackStatusCode: 200,
                handler: async () => {
                    const document = await onboardingDocumentsService.delete(req.params.id, {
                        actorUserId: req.user?.id || null,
                        minAccess: 'write'
                    });
                    if (!document) {
                        return {
                            statusCode: 404,
                            body: { message: 'Onboarding document not found' }
                        };
                    }

                    return { message: 'Onboarding document deleted successfully' };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (error) {
            next(error);
        }
    };

    const getDocumentsByJobRole = async (req, res, next) => {
        try {
            const documents = await onboardingDocumentsService.getDocumentsByJobRole(req.params.jobRoleId, {
                actorUserId: req.user?.id || null
            });
            res.json(documents);
        } catch (error) {
            next(error);
        }
    };

    const assignToJobRole = async (req, res, next) => {
        try {
            const { jobRoleId } = req.params;
            const { documentId, isMandatory = true } = req.body;

            const assignment = await onboardingDocumentsService.assignToJobRole(jobRoleId, documentId, isMandatory, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!assignment) {
                return res.status(404).json({ message: 'Document or job role not found' });
            }
            res.status(201).json(assignment);
        } catch (error) {
            next(error);
        }
    };

    const updateJobRoleAssignment = async (req, res, next) => {
        try {
            const { jobRoleId, documentId } = req.params;
            const { isMandatory } = req.body;

            const assignment = await onboardingDocumentsService.updateJobRoleAssignment(jobRoleId, documentId, isMandatory, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!assignment) {
                return res.status(404).json({ message: 'Document assignment not found' });
            }

            res.json(assignment);
        } catch (error) {
            next(error);
        }
    };

    const removeFromJobRole = async (req, res, next) => {
        try {
            const { jobRoleId, documentId } = req.params;

            const assignment = await onboardingDocumentsService.removeFromJobRole(jobRoleId, documentId, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!assignment) {
                return res.status(404).json({ message: 'Document assignment not found' });
            }

            res.json({ message: 'Document removed from job role successfully' });
        } catch (error) {
            next(error);
        }
    };

    return {
        getAll,
        getById,
        getByOrganization,
        create,
        update,
        delete: deleteOne,
        getDocumentsByJobRole,
        assignToJobRole,
        updateJobRoleAssignment,
        removeFromJobRole
    };
};
