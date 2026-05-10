const { createHttpError } = require('./shared');

module.exports = ({ calendarService, logger }) => {
    const getAll = async (req, res, next) => {
        try {
            const {
                applicantId,
                createdBy,
                status,
                startDate,
                endDate,
                page = 0,
                limit = 50,
                org
            } = req.query;

            const filters = {
                organizationId: org || null,
                applicantId,
                createdBy,
                status,
                startDate,
                endDate,
                page: parseInt(page),
                limit: parseInt(limit),
                actorUserId: req.user.id,
                minAccess: 'read'
            };

            const interviews = await calendarService.getInterviews(filters);

            res.json(interviews);
        } catch (error) {
            logger.error('Failed to get interviews', {
                error: error.message,
                userId: req.user?.id
            });
            next(error);
        }
    };

    const getById = async (req, res, next) => {
        try {
            const { id } = req.params;

            const interview = await calendarService.getInterviewById(id, {
                actorUserId: req.user.id,
                minAccess: 'read'
            });

            if (!interview) {
                throw createHttpError(404, 'Interview not found');
            }

            res.json(interview);
        } catch (error) {
            logger.error('Failed to get interview', {
                error: error.message,
                interviewId: req.params.id,
                userId: req.user?.id
            });
            next(error);
        }
    };

    const getStatusHistory = async (req, res, next) => {
        try {
            const { id } = req.params;

            const history = await calendarService.getStatusHistory(id, {
                actorUserId: req.user.id,
                minAccess: 'read'
            });

            res.json(history);
        } catch (error) {
            logger.error('Failed to get status history', {
                error: error.message,
                interviewId: req.params.id,
                userId: req.user?.id
            });
            next(error);
        }
    };

    return {
        getAll,
        getById,
        getStatusHistory
    };
};
