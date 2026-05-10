module.exports = ({ onboardingDocumentsService, runWrite, ensureRequestValid }) => {
    const createTemplate = async (req, res, next) => {
        try {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const templateData = {
                ...req.body,
                is_template: true,
                status: 'draft',
                template_file_id: null,
                uploaded_at: null
            };

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.createTemplate',
                fallbackStatusCode: 201,
                handler: async () => onboardingDocumentsService.create(templateData, {
                    actorUserId: req.user?.id || null,
                    minAccess: 'write'
                })
            });
            res.status(result.statusCode).json(result.body);
        } catch (error) {
            next(error);
        }
    };

    const uploadTemplateFile = async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const fileData = {
                file_name: req.file.originalname,
                file_path: req.file.key,
                bucket: req.file.bucket,
                mime_type: req.file.mimetype,
                file_size: req.file.size,
                checksum_sha256: req.file.checksum_sha256 || null,
                uploaded_at: new Date()
            };

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.uploadTemplateFile',
                fallbackStatusCode: 200,
                handler: async () => {
                    const document = await onboardingDocumentsService.update(id, fileData, {
                        actorUserId: req.user?.id || null,
                        minAccess: 'write'
                    });
                    if (!document) {
                        return {
                            statusCode: 404,
                            body: { message: 'Document template not found' }
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

    const getWorkflowDocuments = async (req, res, next) => {
        try {
            const { id: workflowId } = req.params;
            const documents = await onboardingDocumentsService.getWorkflowDocuments(workflowId, {
                actorUserId: req.user?.id || null
            });
            res.json(documents);
        } catch (error) {
            next(error);
        }
    };

    const attachDocumentToWorkflow = async (req, res, next) => {
        try {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const { id: workflowId } = req.params;
            const { document_id, is_mandatory = false, order_index = 0 } = req.body;

            const attachment = await onboardingDocumentsService.attachDocumentToWorkflow(
                workflowId,
                document_id,
                is_mandatory,
                order_index,
                {
                    actorUserId: req.user?.id || null,
                    minAccess: 'write'
                }
            );
            if (!attachment) {
                return res.status(404).json({ message: 'Document or workflow not found' });
            }
            res.status(201).json(attachment);
        } catch (error) {
            next(error);
        }
    };

    const updateWorkflowDocumentAttachment = async (req, res, next) => {
        try {
            const { workflowId, documentId } = req.params;
            const { is_mandatory, order_index } = req.body;

            const attachment = await onboardingDocumentsService.updateWorkflowDocumentAttachment(
                workflowId,
                documentId,
                { is_mandatory, order_index },
                {
                    actorUserId: req.user?.id || null,
                    minAccess: 'write'
                }
            );
            if (!attachment) {
                return res.status(404).json({ message: 'Document attachment not found' });
            }

            res.json(attachment);
        } catch (error) {
            next(error);
        }
    };

    const removeDocumentFromWorkflow = async (req, res, next) => {
        try {
            const { workflowId, documentId } = req.params;

            const attachment = await onboardingDocumentsService.removeDocumentFromWorkflow(workflowId, documentId, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!attachment) {
                return res.status(404).json({ message: 'Document attachment not found' });
            }

            res.json({ message: 'Document removed from workflow successfully' });
        } catch (error) {
            next(error);
        }
    };

    const getStepDocuments = async (req, res, next) => {
        try {
            const { stepId } = req.params;
            const documents = await onboardingDocumentsService.getStepDocuments(stepId, {
                actorUserId: req.user?.id || null
            });
            res.json(documents);
        } catch (error) {
            next(error);
        }
    };

    const attachDocumentToStep = async (req, res, next) => {
        try {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const { stepId } = req.params;
            const { document_id, is_mandatory = false } = req.body;

            const attachment = await onboardingDocumentsService.attachDocumentToStep(
                stepId,
                document_id,
                is_mandatory,
                {
                    actorUserId: req.user?.id || null,
                    minAccess: 'write'
                }
            );
            if (!attachment) {
                return res.status(404).json({ message: 'Document or step not found' });
            }
            res.status(201).json(attachment);
        } catch (error) {
            next(error);
        }
    };

    const removeDocumentFromStep = async (req, res, next) => {
        try {
            const { stepId, documentId } = req.params;
            await onboardingDocumentsService.removeDocumentFromStep(stepId, documentId, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    const markDocumentAsRead = async (req, res, next) => {
        try {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const { stepId } = req.params;
            const { document_id } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const result = await onboardingDocumentsService.markDocumentAsRead(userId, stepId, document_id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    return {
        createTemplate,
        uploadTemplateFile,
        getWorkflowDocuments,
        attachDocumentToWorkflow,
        updateWorkflowDocumentAttachment,
        removeDocumentFromWorkflow,
        getStepDocuments,
        attachDocumentToStep,
        removeDocumentFromStep,
        markDocumentAsRead
    };
};
