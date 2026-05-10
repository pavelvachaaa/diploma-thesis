module.exports = ({
    applicantsService,
    applicantContracts,
    attachmentHelpers,
    idempotentWrite
}) => {
    const getAllApplicantsAdmin = async (req, res, next) => {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                status = '',
                organization = ''
            } = req.query;

            const result = await applicantsService.getAllApplicants({
                actorUserId: req.user?.id || null,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                search,
                status,
                organizationName: organization
            });

            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    const getApplicantByIdAdmin = async (req, res, next) => {
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

    const createApplicantAdmin = async (req, res, next) => {
        try {
            const {
                name,
                surname,
                email,
                phone,
                address,
                city,
                zip,
                education,
                field,
                experience,
                last_employer,
                last_position,
                gdpr_consent,
                job_posting_id,
                organization_id,
                job_seeker_id
            } = req.body;

            if (!name || !surname || !email || !phone || !job_posting_id) {
                return res.status(400).json({
                    message: 'Missing required fields: name, surname, email, phone, job_posting_id'
                });
            }

            const result = await idempotentWrite.runIdempotentWrite({
                req,
                scope: 'applicants.createAdmin',
                handler: async () => {
                    const applicantData = applicantContracts.buildAdminApplicantInput({
                        name,
                        surname,
                        email,
                        phone,
                        address,
                        city,
                        zip,
                        education,
                        field,
                        experience,
                        last_employer,
                        last_position,
                        gdpr_consent,
                        job_posting_id
                    }, { organizationId: organization_id || null });

                    const applicant = await applicantsService.createApplicant(applicantData, {
                        actorUserId: req.user?.id || null,
                        minAccess: 'write'
                    });
                    const attachments = [];

                    await attachmentHelpers.appendStoredAttachmentsFromFiles(applicant.id, req.files, attachments);
                    await attachmentHelpers.appendStoredAttachmentsFromJobSeeker(
                        applicant.id,
                        job_seeker_id,
                        attachments
                    );

                    return {
                        statusCode: 201,
                        body: {
                            message: 'Applicant created successfully',
                            applicant,
                            attachments
                        }
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const updateApplicantStatusAdmin = async (req, res, next) => {
        try {
            const { status, notes, changed_by } = req.body;

            const result = await idempotentWrite.runIdempotentWrite({
                req,
                scope: 'applicants.updateStatusAdmin',
                handler: async () => {
                    const updatedApplicant = await applicantsService.updateApplicantStatus(
                        req.params.id,
                        status,
                        changed_by,
                        notes,
                        {
                            actorUserId: req.user?.id || null,
                            minAccess: 'write'
                        }
                    );

                    return {
                        statusCode: 200,
                        body: updatedApplicant
                    };
                }
            });

            res.status(result.statusCode).json(result.body);
        } catch (err) {
            next(err);
        }
    };

    const getApplicantStatusHistoryAdmin = async (req, res, next) => {
        try {
            const history = await applicantsService.getApplicantStatusHistory(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(history);
        } catch (err) {
            next(err);
        }
    };

    const getApplicantAttachmentsAdmin = async (req, res, next) => {
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

    const getApplicantsByJobIdAdmin = async (req, res, next) => {
        try {
            const applicants = await applicantsService.getApplicantsByJobId(req.params.jobId, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            res.json(applicants);
        } catch (err) {
            next(err);
        }
    };

    return {
        getAllApplicantsAdmin,
        getApplicantByIdAdmin,
        createApplicantAdmin,
        updateApplicantStatusAdmin,
        getApplicantStatusHistoryAdmin,
        getApplicantAttachmentsAdmin,
        getApplicantsByJobIdAdmin
    };
};
