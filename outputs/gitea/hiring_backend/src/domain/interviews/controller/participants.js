const { createHttpError } = require('./shared');

module.exports = ({ calendarService, logger }) => {
    const addParticipant = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { user_id, external_email, external_name, role } = req.body;

            if (!user_id && (!external_email || !external_name)) {
                return res.status(400).json({
                    error: 'Must provide either user_id or both external_email and external_name'
                });
            }

            const participants = [{
                user_id,
                external_email,
                external_name,
                role: role || 'interviewer'
            }];

            const added = await calendarService.addParticipants(id, participants, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });

            logger.info('Participant added to interview', {
                interviewId: id,
                userId: req.user.id,
                participantId: added[0].id
            });

            res.status(201).json(added[0]);
        } catch (error) {
            logger.error('Failed to add participant', {
                error: error.message,
                interviewId: req.params.id,
                userId: req.user?.id
            });
            next(error);
        }
    };

    const removeParticipant = async (req, res, next) => {
        try {
            const { id, participantId } = req.params;

            const success = await calendarService.removeParticipant(id, participantId, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });

            if (!success) {
                throw createHttpError(404, 'Participant not found');
            }

            logger.info('Participant removed from interview', {
                interviewId: id,
                participantId,
                userId: req.user.id
            });

            res.json({ message: 'Participant removed successfully' });
        } catch (error) {
            logger.error('Failed to remove participant', {
                error: error.message,
                interviewId: req.params.id,
                participantId: req.params.participantId,
                userId: req.user?.id
            });
            next(error);
        }
    };

    const confirmAttendance = async (req, res, next) => {
        try {
            const { id } = req.params;

            const participant = await calendarService.confirmAttendance(id, req.user.id, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });

            if (!participant) {
                throw createHttpError(404, 'Participant not found');
            }

            logger.info('Attendance confirmed', {
                interviewId: id,
                userId: req.user.id
            });

            res.json(participant);
        } catch (error) {
            logger.error('Failed to confirm attendance', {
                error: error.message,
                interviewId: req.params.id,
                userId: req.user?.id
            });
            next(error);
        }
    };

    return {
        addParticipant,
        removeParticipant,
        confirmAttendance
    };
};
