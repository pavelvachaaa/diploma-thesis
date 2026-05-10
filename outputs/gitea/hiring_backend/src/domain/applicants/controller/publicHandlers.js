module.exports = ({
    applicantsService,
    jobsService,
    fileDownload,
    applicantContracts,
    attachmentHelpers,
    idempotentWrite
}) => {
    const { downloadFile } = fileDownload;

    const applyForJob = async (req, res, next) => {
        try {
            const jobId = req.params.id;
            const {
                firstName,
                lastName,
                email,
                phone,
                address,
                city,
                zip,
                education,
                field,
                experience,
                lastEmployer,
                lastPosition,
                gdprConsent
            } = req.body;

            if (!firstName || !lastName || !email || !phone || !gdprConsent) {
                return res.status(400).json({
                    message: 'Missing required fields: firstName, lastName, email, phone, gdprConsent'
                });
            }

            const job = await jobsService.getJobDetail(jobId);
            if (!job) {
                return res.status(404).json({ message: 'Job not found' });
            }

            const result = await idempotentWrite.runIdempotentWrite({
                req,
                scope: 'applicants.applyForJob',
                handler: async () => {
                    const applicantData = applicantContracts.buildPublicApplicationInput({
                        firstName,
                        lastName,
                        email,
                        phone,
                        address,
                        city,
                        zip,
                        education,
                        field,
                        experience,
                        lastEmployer,
                        lastPosition,
                        gdprConsent
                    }, {
                        jobPostingId: jobId,
                        organizationId: job.organization_id
                    });

                    const applicant = await applicantsService.createApplicant(applicantData);
                    const attachments = [];
                    await attachmentHelpers.appendStoredAttachmentsFromFiles(applicant.id, req.files, attachments);

                    return {
                        statusCode: 201,
                        body: {
                            message: 'Application submitted successfully',
                            applicant,
                            attachments,
                            job: {
                                id: job.id,
                                title: job.title,
                                organization_name: job.organization_name,
                                department: job.department,
                                contract_type_label: job.contract_type_label
                            }
                        }
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const getJobApplications = async (req, res, next) => {
        try {
            const applications = await applicantsService.getApplicantsByJobId(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(applications);
        } catch (err) {
            next(err);
        }
    };

    const getApplicantById = async (req, res, next) => {
        try {
            const applicant = await applicantsService.getApplicantById(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            if (!applicant) {
                return res.status(404).json({ message: 'Applicant not found' });
            }
            res.json(applicant);
        } catch (err) {
            next(err);
        }
    };

    const downloadAttachment = async (req, res, next) => {
        try {
            const attachment = await applicantsService.getAttachmentById(req.params.attachmentId, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            if (!attachment) {
                return res.status(404).json({ message: 'Attachment not found' });
            }

            await downloadFile(res, {
                file_path: attachment.file_path,
                original_name: attachment.original_filename,
                mime_type: attachment.mime_type,
                bucket: attachment.bucket || null
            }, req.user, 'applicant-attachment', {
                resourceId: req.params.attachmentId,
                metadata: {
                    applicantId: attachment.applicant_id || null
                }
            });
        } catch (err) {
            next(err);
        }
    };

    const getApplicantAttachments = async (req, res, next) => {
        try {
            const attachments = await applicantsService.getAttachmentsByApplicantId(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(attachments);
        } catch (err) {
            next(err);
        }
    };

    const updateApplicantStatus = async (req, res, next) => {
        try {
            const { applicantId } = req.params;
            const { statusName, notes } = req.body;

            if (!statusName) {
                return res.status(400).json({
                    message: 'Missing required field: statusName'
                });
            }

            const result = await idempotentWrite.runIdempotentWrite({
                req,
                scope: 'applicants.updateStatus',
                handler: async () => {
                    const updatedApplicant = await applicantsService.updateApplicantStatus(
                        applicantId,
                        statusName,
                        req.user?.id || null,
                        notes,
                        {
                            actorUserId: req.user?.id || null,
                            minAccess: 'write'
                        }
                    );

                    return {
                        statusCode: 200,
                        body: {
                            message: 'Status updated successfully',
                            applicant: updatedApplicant
                        }
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const getApplicantStatusHistory = async (req, res, next) => {
        try {
            const statusHistory = await applicantsService.getApplicantStatusHistory(req.params.applicantId, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(statusHistory);
        } catch (err) {
            next(err);
        }
    };

    const getAllStatuses = async (_req, res, next) => {
        try {
            const statuses = await applicantsService.getAllStatuses();
            res.json(statuses);
        } catch (err) {
            next(err);
        }
    };

    const getJobApplicants = async (req, res, next) => {
        try {
            const applicants = await applicantsService.getApplicantsByJobId(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(applicants);
        } catch (err) {
            next(err);
        }
    };

    return {
        applyForJob,
        getJobApplications,
        getApplicantById,
        downloadAttachment,
        getApplicantAttachments,
        updateApplicantStatus,
        getApplicantStatusHistory,
        getAllStatuses,
        getJobApplicants
    };
};
