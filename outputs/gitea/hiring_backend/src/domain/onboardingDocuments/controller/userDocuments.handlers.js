module.exports = ({ onboardingDocumentsService, runWrite }) => {
    const requireUser = (req, res) => {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return null;
        }

        return userId;
    };

    const getUserDocuments = async (req, res, next) => {
        try {
            const userId = requireUser(req, res);
            if (!userId) {
                return;
            }

            const documents = await onboardingDocumentsService.getUserDocuments(userId);
            res.json(documents);
        } catch (error) {
            next(error);
        }
    };

    const uploadUserDocument = async (req, res, next) => {
        try {
            const userId = requireUser(req, res);
            const { documentId } = req.params;

            if (!userId) {
                return;
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            if (!documentId) {
                return res.status(400).json({ error: 'Document ID is required' });
            }

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.uploadUserDocument',
                fallbackStatusCode: 201,
                handler: async () => onboardingDocumentsService.storeUserDocument(userId, documentId, {
                    originalName: req.file.originalname,
                    filename: req.file.originalname,
                    key: req.file.key,
                    bucket: req.file.bucket,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                })
            });

            res.status(result.statusCode).json({
                message: 'Document uploaded successfully',
                document: result.body
            });
        } catch (error) {
            next(error);
        }
    };

    const deleteUserDocument = async (req, res, next) => {
        try {
            const userId = requireUser(req, res);
            const { userDocumentId } = req.params;

            if (!userId) {
                return;
            }

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.deleteUserDocument',
                fallbackStatusCode: 200,
                handler: async () => onboardingDocumentsService.deleteUserDocument(userId, userDocumentId)
            });

            res.status(result.statusCode).json({
                message: 'Document deleted successfully',
                document: result.body
            });
        } catch (error) {
            next(error);
        }
    };

    const getUserDocumentById = async (req, res, next) => {
        try {
            const userId = requireUser(req, res);
            const { userDocumentId } = req.params;

            if (!userId) {
                return;
            }

            const document = await onboardingDocumentsService.getUserDocumentById(userId, userDocumentId);
            if (!document) {
                return res.status(404).json({ message: 'Document not found' });
            }

            res.json(document);
        } catch (error) {
            next(error);
        }
    };

    const updateUserDocumentStatusAdmin = async (req, res, next) => {
        try {
            const { userDocumentId } = req.params;
            const { status, notes, review_notes: reviewNotesBody } = req.body;
            const reviewNotes = reviewNotesBody || notes;
            const reviewedBy = req.user?.id;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be: pending, approved, or rejected'
                });
            }

            const result = await runWrite({
                req,
                scope: 'onboardingDocuments.updateUserDocumentStatus',
                fallbackStatusCode: 200,
                handler: async () => onboardingDocumentsService.updateUserDocumentStatus(userDocumentId, {
                    status,
                    reviewed_by: reviewedBy,
                    review_notes: reviewNotes
                }, {
                    actorUserId: req.user?.id || null,
                    minAccess: 'write'
                })
            });

            res.status(result.statusCode).json({
                message: 'Document status updated successfully',
                document: result.body
            });
        } catch (error) {
            next(error);
        }
    };

    return {
        getUserDocuments,
        uploadUserDocument,
        deleteUserDocument,
        getUserDocumentById,
        updateUserDocumentStatusAdmin
    };
};
