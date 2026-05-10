module.exports = ({
    applicantsService,
    logger
}) => {
    const sendEmailToApplicantAdmin = async (req, res, next) => {
        try {
            const applicant = await applicantsService.getApplicantById(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'read'
            });
            if (!applicant) {
                return res.status(404).json({ message: 'Applicant not found' });
            }

            const response = await applicantsService.sendEmailToApplicant(req.params.id, {
                message: req.body?.message,
                senderUser: req.user,
                files: req.files || []
            });

            return res.status(response.statusCode).json(response.body);
        } catch (err) {
            logger.error('Send applicant email error', {
                error: err.message,
                applicantId: req.params.id
            });
            next(err);
        }
    };

    const scheduleInterviewAdmin = async (req, res, next) => {
        try {
            const applicant = await applicantsService.getApplicantById(req.params.id, {
                actorUserId: req.user?.id || null,
                minAccess: 'write'
            });
            if (!applicant) {
                return res.status(404).json({ message: 'Applicant not found' });
            }

            const response = await applicantsService.scheduleInterviewInvitation(req.params.id, {
                dateTime: req.body?.dateTime,
                location: req.body?.location,
                locationType: req.body?.locationType,
                participants: req.body?.participants,
                notes: req.body?.notes
            });

            return res.status(response.statusCode).json(response.body);
        } catch (err) {
            logger.error('Schedule interview error', {
                error: err.message,
                applicantId: req.params.id
            });
            next(err);
        }
    };

    return {
        sendEmailToApplicantAdmin,
        scheduleInterviewAdmin
    };
};
