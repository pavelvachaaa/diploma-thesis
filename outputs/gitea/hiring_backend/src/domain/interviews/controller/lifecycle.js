const createRunWrite = require('@shared/http/runWrite');
const { handle, sendResult, writeAndSend } = require('@shared/http/controller');
const {
    createHttpError
} = require('./shared');
const { ensureRequestValid } = require('@shared/http/validation');

module.exports = ({
    calendarService,
    applicantsService,
    commandIdempotencyService,
    logger
}) => {
    const runWrite = createRunWrite({
        commandIdempotencyService,
        logger
    });

    const handleLifecycle = (failureMessage, buildContext, handler) => handle(async (req, res, next) => {
        try {
            return await handler(req, res, next);
        } catch (error) {
            logger.error(failureMessage, {
                error: error.message,
                ...(typeof buildContext === 'function' ? buildContext(req, error) : {})
            });
            throw error;
        }
    });

    const create = handleLifecycle(
        'Failed to create interview',
        (req) => ({ userId: req.user?.id }),
        async (req, res) => {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const {
                applicant_id,
                job_posting_id,
                title,
                description,
                scheduled_at,
                duration_minutes,
                location_type,
                location,
                online_meeting_link,
                notes,
                participants = []
            } = req.body;

            const applicant = await applicantsService.getApplicantById(applicant_id, {
                actorUserId: req.user.id,
                minAccess: 'write'
            });

            if (!applicant) {
                return sendResult(res, {
                    statusCode: 404,
                    body: {
                        error: 'Applicant not found'
                    }
                });
            }

            if (!applicant.job_posting_id) {
                return sendResult(res, {
                    statusCode: 404,
                    body: {
                        error: 'Applicant is not linked to a job posting'
                    }
                });
            }

            return writeAndSend({
                req,
                res,
                scope: 'interviews.create',
                fallbackStatusCode: 201,
                runWrite,
                handler: async () => {
                    if (job_posting_id && job_posting_id !== applicant.job_posting_id) {
                        throw createHttpError(400, 'job_posting_id must match the applicant parent job posting');
                    }

                    const interviewData = {
                        applicant_id,
                        job_posting_id: applicant.job_posting_id,
                        organization_id: applicant.organization_id,
                        created_by: req.user.id,
                        title,
                        description,
                        scheduled_at,
                        duration_minutes: duration_minutes || 60,
                        location_type: location_type || 'other',
                        location,
                        online_meeting_link,
                        notes
                    };

                    const interview = await calendarService.createInterview(interviewData, participants, {
                        actorUserId: req.user.id,
                        minAccess: 'write'
                    });

                    logger.info('Interview created via API', {
                        interviewId: interview.id,
                        userId: req.user.id,
                        applicantId: applicant.id
                    });

                    return interview;
                }
            });
        }
    );

    const update = handleLifecycle(
        'Failed to update interview',
        (req) => ({
            interviewId: req.params.id,
            userId: req.user?.id
        }),
        async (req, res) => {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const { id } = req.params;
            const {
                title,
                description,
                scheduled_at,
                duration_minutes,
                location_type,
                location,
                online_meeting_link,
                notes
            } = req.body;

            const updateData = {};

            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
            if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
            if (location_type !== undefined) updateData.location_type = location_type;
            if (location !== undefined) updateData.location = location;
            if (online_meeting_link !== undefined) updateData.online_meeting_link = online_meeting_link;
            if (notes !== undefined) updateData.notes = notes;

            return writeAndSend({
                req,
                res,
                scope: 'interviews.update',
                fallbackStatusCode: 200,
                runWrite,
                handler: async () => {
                    const interview = await calendarService.updateInterview(id, updateData, req.user.id, {
                        actorUserId: req.user.id,
                        minAccess: 'write'
                    });

                    if (!interview) {
                        throw createHttpError(404, 'Interview not found');
                    }

                    logger.info('Interview updated via API', {
                        interviewId: id,
                        userId: req.user.id
                    });

                    return interview;
                }
            });
        }
    );

    const cancel = handleLifecycle(
        'Failed to cancel interview',
        (req) => ({
            interviewId: req.params.id,
            userId: req.user?.id
        }),
        async (req, res) => {
            const { id } = req.params;
            const { reason, sendNotification = true, customEmailBody } = req.body;

            if (!reason || reason.trim() === '') {
                return sendResult(res, {
                    statusCode: 400,
                    body: {
                        error: 'Cancellation reason is required'
                    }
                });
            }

            if (!ensureRequestValid(req, res)) {
                return;
            }

            return writeAndSend({
                req,
                res,
                scope: 'interviews.cancel',
                fallbackStatusCode: 200,
                runWrite,
                handler: async () => {
                    const interview = await calendarService.cancelInterview(id, reason, req.user.id, {
                        actorUserId: req.user.id,
                        minAccess: 'write',
                        sendNotification: sendNotification !== false,
                        customEmailBody: customEmailBody || undefined
                    });

                    if (!interview) {
                        throw createHttpError(404, 'Interview not found');
                    }

                    logger.info('Interview cancelled via API', {
                        interviewId: id,
                        userId: req.user.id,
                        reason
                    });

                    return {
                        message: 'Interview cancelled successfully',
                        interview
                    };
                }
            });
        }
    );

    const complete = handleLifecycle(
        'Failed to complete interview',
        (req) => ({
            interviewId: req.params.id,
            userId: req.user?.id
        }),
        async (req, res) => {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const { id } = req.params;
            const { notes } = req.body;

            return writeAndSend({
                req,
                res,
                scope: 'interviews.complete',
                fallbackStatusCode: 200,
                runWrite,
                handler: async () => {
                    const interview = await calendarService.markCompleted(id, notes, req.user.id, {
                        actorUserId: req.user.id,
                        minAccess: 'write'
                    });

                    if (!interview) {
                        throw createHttpError(404, 'Interview not found');
                    }

                    logger.info('Interview marked as completed', {
                        interviewId: id,
                        userId: req.user.id
                    });

                    return interview;
                }
            });
        }
    );

    const markNoShow = handleLifecycle(
        'Failed to mark interview as no-show',
        (req) => ({
            interviewId: req.params.id,
            userId: req.user?.id
        }),
        async (req, res) => {
            if (!ensureRequestValid(req, res)) {
                return;
            }

            const { id } = req.params;
            const { notes } = req.body;

            return writeAndSend({
                req,
                res,
                scope: 'interviews.noShow',
                fallbackStatusCode: 200,
                runWrite,
                handler: async () => {
                    const interview = await calendarService.markNoShow(id, notes, req.user.id, {
                        actorUserId: req.user.id,
                        minAccess: 'write'
                    });

                    if (!interview) {
                        throw createHttpError(404, 'Interview not found');
                    }

                    logger.info('Interview marked as no-show', {
                        interviewId: id,
                        userId: req.user.id
                    });

                    return interview;
                }
            });
        }
    );

    const resendInvitation = handleLifecycle(
        'Failed to resend invitation',
        (req) => ({
            interviewId: req.params.id,
            userId: req.user?.id
        }),
        async (req, res) => {
            const { id } = req.params;
            const { target, participantId } = req.body;

            if (!target || !['applicant', 'participant'].includes(target)) {
                return sendResult(res, {
                    statusCode: 400,
                    body: {
                        error: 'Invalid target. Must be "applicant" or "participant"'
                    }
                });
            }

            if (target === 'participant' && !participantId) {
                return sendResult(res, {
                    statusCode: 400,
                    body: {
                        error: 'participantId is required when target is "participant"'
                    }
                });
            }

            if (!ensureRequestValid(req, res)) {
                return;
            }

            return writeAndSend({
                req,
                res,
                scope: 'interviews.resendInvitation',
                fallbackStatusCode: 200,
                runWrite,
                handler: async () => {
                    const payload = await calendarService.resendInvitation(id, { target, participantId }, {
                        actorUserId: req.user.id,
                        minAccess: 'write'
                    });

                    logger.info('Invitation resent', {
                        interviewId: id,
                        target,
                        participantId,
                        userId: req.user.id
                    });

                    return payload;
                }
            });
        }
    );

    return {
        create,
        update,
        cancel,
        complete,
        markNoShow,
        resendInvitation
    };
};
