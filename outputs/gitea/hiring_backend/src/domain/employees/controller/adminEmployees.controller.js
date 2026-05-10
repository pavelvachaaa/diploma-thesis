const createRunWrite = require('@shared/http/runWrite');

module.exports = ({ employeesService, commandIdempotencyService, logger }) => {
    const runWrite = createRunWrite({
        commandIdempotencyService,
        logger
    });

    const getAllEmployeesAdmin = async (req, res, next) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                role = '',
                excludeRole = '',
                organization = ''
            } = req.query;

            const employees = await employeesService.getAllEmployees({
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                organizationId: req.query.organizationId || null,
                search,
                role,
                excludeRole,
                organizationName: organization,
                actorUserId: req.user.id
            });

            res.json(employees);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeByIdAdmin = async (req, res, next) => {
        try {
            const employee = await employeesService.getEmployeeById(req.params.id, {
                actorUserId: req.user.id
            });
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.json(employee);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeAuditEventsAdmin = async (req, res, next) => {
        try {
            const {
                page = 0,
                limit = 10,
                category,
                action,
                status,
                resourceType,
                resourceId,
                dateFrom,
                dateTo
            } = req.query;

            const result = await employeesService.getEmployeeAuditEvents(req.params.id, {
                page: Number(page),
                limit: Number(limit),
                category: category || null,
                action: action || null,
                status: status || null,
                resourceType: resourceType || null,
                resourceId: resourceId || null,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null
            }, req.user);

            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeApplicantDataAdmin = async (req, res, next) => {
        try {
            const applicantData = await employeesService.getEmployeeApplicantData(req.params.id, {
                actorUserId: req.user.id
            });

            if (!applicantData) {
                return res.status(404).json({ message: 'Employee has no associated applicant data' });
            }

            res.json(applicantData);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeRolesAdmin = async (req, res, next) => {
        try {
            const roles = await employeesService.getAllRoles();
            res.json(roles);
        } catch (err) {
            next(err);
        }
    };

    const updateEmployeeRoleAdmin = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!role) {
                return res.status(400).json({ message: 'Role is required' });
            }

            const result = await runWrite({
                req,
                scope: 'employees.updateRole',
                fallbackStatusCode: 200,
                handler: async () => {
                    const updatedEmployee = await employeesService.updateEmployeeRole(id, role, req.user);
                    return {
                        message: 'Role updated successfully',
                        employee: updatedEmployee
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const createEmployeeFromApplicantAdmin = async (req, res, next) => {
        try {
            const { applicant_id, onboarding_workflow_id, start_date, notes } = req.body;

            if (!applicant_id || !onboarding_workflow_id) {
                return res.status(400).json({
                    error: 'Missing required fields: applicant_id and onboarding_workflow_id'
                });
            }

            const result = await runWrite({
                req,
                scope: 'employees.createFromApplicant',
                fallbackStatusCode: 201,
                handler: async () => employeesService.createEmployeeFromApplicant(
                    applicant_id,
                    onboarding_workflow_id,
                    start_date,
                    notes,
                    req.user.id
                )
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            if (err.message === 'Applicant not found') {
                return res.status(404).json({ error: 'Applicant not found' });
            }
            if (err.message === 'User role not found') {
                return res.status(500).json({ error: 'System configuration error: User role not found' });
            }
            next(err);
        }
    };

    const getEmployeeDocumentsAdmin = async (req, res, next) => {
        try {
            const documents = await employeesService.getEmployeeDocuments(req.params.id, {
                actorUserId: req.user.id
            });
            res.json(documents);
        } catch (err) {
            next(err);
        }
    };

    const updateDocumentStatusAdmin = async (req, res, next) => {
        try {
            const { id: employeeId, documentId } = req.params;
            const { status, notes } = req.body;

            if (!['approved', 'rejected', 'pending'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, or pending' });
            }

            const result = await runWrite({
                req,
                scope: 'employees.updateDocumentStatus',
                fallbackStatusCode: 200,
                handler: async () => {
                    const updatedDocument = await employeesService.updateDocumentStatus(
                        employeeId,
                        documentId,
                        status,
                        notes,
                        {
                            actorUserId: req.user.id,
                            minAccess: 'write'
                        }
                    );

                    if (!updatedDocument) {
                        return {
                            statusCode: 404,
                            body: { message: 'Document not found' }
                        };
                    }

                    return updatedDocument;
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const sendEmailToEmployeeAdmin = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { subject, message } = req.body;
            await employeesService.sendEmailToEmployee(id, {
                subject,
                message,
                files: req.files || [],
                requestUser: req.user || null
            }, {
                actorUserId: req.user.id
            });

            res.json({
                success: true,
                message: 'Email byl úspěšně odeslán'
            });
        } catch (err) {
            next(err);
        }
    };

    const uploadDocumentForEmployeeAdmin = async (req, res, next) => {
        try {
            const { id: employeeId, documentId } = req.params;
            const file = req.file;
            if (!file) return res.status(400).json({ error: 'No file uploaded' });

            const result = await runWrite({
                req,
                scope: 'employees.uploadDocument',
                fallbackStatusCode: 201,
                handler: async () => employeesService.storeEmployeeDocument(employeeId, documentId, {
                    filename: file.originalname,
                    originalName: file.originalname,
                    key: file.key,
                    bucket: file.bucket,
                    mimetype: file.mimetype,
                    size: file.size
                }, {
                    actorUserId: req.user.id,
                    minAccess: 'write'
                })
            });

            res.status(result.statusCode).json({
                message: 'Document uploaded successfully',
                document: result.body
            });
        } catch (err) {
            next(err);
        }
    };

    const sendTestEmailAdmin = async (req, res, next) => {
        try {
            const { email, type = 'basic' } = req.body;
            const result = await employeesService.sendTestEmail(email, type);

            if (type === 'health') {
                return res.json(result);
            }

            res.json({
                success: result.success,
                message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
                messageId: result.messageId,
                sentTo: result.to || result.sentTo,
                error: result.error
            });
        } catch (err) {
            next(err);
        }
    };

    const deleteEmployeeAdmin = async (req, res, next) => {
        try {
            const { id } = req.params;

            const result = await runWrite({
                req,
                scope: 'employees.delete',
                fallbackStatusCode: 200,
                handler: async () => {
                    const deletedEmployee = await employeesService.deleteEmployeeFully(id, req.user);
                    return {
                        message: 'Employee deleted successfully',
                        employee: deletedEmployee
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    return {
        getAllEmployeesAdmin,
        getEmployeeByIdAdmin,
        getEmployeeAuditEventsAdmin,
        getEmployeeApplicantDataAdmin,
        getEmployeeRolesAdmin,
        updateEmployeeRoleAdmin,
        createEmployeeFromApplicantAdmin,
        getEmployeeDocumentsAdmin,
        updateDocumentStatusAdmin,
        uploadDocumentForEmployeeAdmin,
        sendEmailToEmployeeAdmin,
        sendTestEmailAdmin,
        deleteEmployeeAdmin
    };
};
