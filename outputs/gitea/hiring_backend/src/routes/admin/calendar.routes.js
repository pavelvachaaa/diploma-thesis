module.exports = ({ calendarController, fileHandler }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');
    const {
        ADMIN_HR_AUTHORIZED_PERSON_ROLES,
        ADMIN_HR_ROLES
    } = require('@shared/auth/roles');
    const { createUploadMiddleware } = fileHandler;
    const { body, query } = require('express-validator');

    const router = Router();

    /**
     * Calendar/Interview routes for admin users
     * All routes require admin or hr role
     * All routes are organization-scoped
     */

    /**
     * @route   GET /admin/interviews
     * @desc    Get all interviews with filters
     * @access  Admin/HR (organization-scoped)
     */
    router.get(
        '/',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        [
            query('page').optional().isInt({ min: 0 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
            query('status').optional().isIn(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']),
            query('applicantId').optional().isUUID(),
            query('createdBy').optional().isUUID(),
            query('startDate').optional().isISO8601(),
            query('endDate').optional().isISO8601()
        ],
        calendarController.getAll
    );

    /**
     * @route   POST /admin/interviews
     * @desc    Create a new interview
     * @access  Admin/HR (organization-scoped)
     */
    router.post(
        '/',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('applicant_id').isUUID().withMessage('Valid applicant_id is required'),
            body('job_posting_id').optional().isUUID(),
            body('title').isString().trim().notEmpty().withMessage('Title is required'),
            body('description').optional().isString(),
            body('scheduled_at').isISO8601().withMessage('Valid scheduled_at date is required'),
            body('duration_minutes').optional().isInt({ min: 15, max: 480 }).toInt(),
            body('location_type').optional().isIn(['office', 'online', 'department', 'other']).withMessage('Invalid location_type'),
            body('location').optional().isString().trim(),
            body('online_meeting_link').optional().isURL(),
            body('notes').optional().isString(),
            body('participants').optional().isArray(),
            body('participants.*.user_id').optional().isUUID(),
            body('participants.*.external_email').optional().isEmail(),
            body('participants.*.external_name').optional().isString(),
            body('participants.*.role').optional().isIn(['organizer', 'interviewer', 'observer'])
        ],
        calendarController.create
    );

    /**
     * @route   GET /admin/interviews/:id
     * @desc    Get interview by ID
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.get(
        '/:id',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        calendarController.getById
    );

    /**
     * @route   PUT /admin/interviews/:id
     * @desc    Update interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.put(
        '/:id',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('title').optional().isString().trim().notEmpty(),
            body('description').optional().isString(),
            body('scheduled_at').optional().isISO8601(),
            body('duration_minutes').optional().isInt({ min: 15, max: 480 }).toInt(),
            body('location_type').optional().isIn(['office', 'online', 'department', 'other']),
            body('location').optional().isString().trim(),
            body('online_meeting_link')
                .optional()
                .if((value, { req }) => req.body.location_type === 'online')
                .isURL()
                .withMessage('A valid URL is required when the location is online'), body('notes').optional().isString()
        ],
        calendarController.update
    );

    /**
     * @route   DELETE /admin/interviews/:id
     * @desc    Cancel interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.delete(
        '/:id',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('reason').isString().trim().notEmpty().withMessage('Cancellation reason is required')
        ],
        calendarController.cancel
    );

    /**
     * @route   POST /admin/interviews/:id/complete
     * @desc    Mark interview as completed
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.post(
        '/:id/complete',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('notes').optional().isString()
        ],
        calendarController.complete
    );

    /**
     * @route   POST /admin/interviews/:id/no-show
     * @desc    Mark interview as no-show
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.post(
        '/:id/no-show',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('notes').optional().isString()
        ],
        calendarController.markNoShow
    );

    /**
     * @route   POST /admin/interviews/:id/confirm
     * @desc    Confirm attendance for current user
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.post(
        '/:id/confirm',
        requireAuth(ADMIN_HR_ROLES),
        calendarController.confirmAttendance
    );

    /**
     * @route   POST /admin/interviews/:id/participants
     * @desc    Add participant to interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.post(
        '/:id/participants',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('user_id').optional().isUUID(),
            body('external_email').optional().isEmail(),
            body('external_name').optional().isString().trim(),
            body('role').optional().isIn(['organizer', 'interviewer', 'observer'])
        ],
        calendarController.addParticipant
    );

    /**
     * @route   DELETE /admin/interviews/:id/participants/:participantId
     * @desc    Remove participant from interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.delete(
        '/:id/participants/:participantId',
        requireAuth(ADMIN_HR_ROLES),
        calendarController.removeParticipant
    );

    /**
     * @route   POST /admin/interviews/:id/attachments
     * @desc    Upload attachment to interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.post(
        '/:id/attachments',
        requireAuth(ADMIN_HR_ROLES),
        createUploadMiddleware('interview-attachments', 'file'),
        calendarController.uploadAttachment
    );

    /**
     * @route   GET /admin/interviews/:id/attachments/:attachmentId
     * @desc    Download attachment from interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.get(
        '/:id/attachments/:attachmentId',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        calendarController.downloadAttachment
    );

    /**
     * @route   DELETE /admin/interviews/:id/attachments/:attachmentId
     * @desc    Delete attachment from interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.delete(
        '/:id/attachments/:attachmentId',
        requireAuth(ADMIN_HR_ROLES),
        calendarController.deleteAttachment
    );

    /**
     * @route   GET /admin/interviews/:id/history
     * @desc    Get status history for interview
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.get(
        '/:id/history',
        requireAuth(ADMIN_HR_AUTHORIZED_PERSON_ROLES),
        calendarController.getStatusHistory
    );

    /**
     * @route   POST /admin/interviews/:id/resend-invitation
     * @desc    Resend invitation email to applicant or participant
     * @access  Admin/HR (organization-scoped, ownership required)
     */
    router.post(
        '/:id/resend-invitation',
        requireAuth(ADMIN_HR_ROLES),
        [
            body('target').isIn(['applicant', 'participant']).withMessage('Target must be "applicant" or "participant"'),
            body('participantId').optional().isUUID().withMessage('participantId must be a valid UUID')
        ],
        calendarController.resendInvitation
    );

    return router;
};
