module.exports = ({ organizationsHttpController, fileHandler }) => {
    const { Router } = require('express');
    const { authMiddleware, requireAuth } = require('@middlewares/auth.middleware');
    const { SUPER_ADMIN_ONLY_ROLES } = require('@shared/auth/roles');
    const { ADMIN_CAPABILITIES, getAdminCapabilityRoles } = require('@shared/auth/adminCapabilities');
    const resourceAccessAudit = require('@middlewares/resourceAccessAudit.middleware');
    const { body, query } = require('express-validator');
    const { createUploadMiddleware } = fileHandler;

    const router = Router();
    const uploadContactPhoto = createUploadMiddleware('organization-contact-photos');

    router.use(authMiddleware);

    router.get('/',
        requireAuth(getAdminCapabilityRoles(ADMIN_CAPABILITIES.ORGANIZATIONS_LOOKUP)),
        [
            query('page').optional().isInt({ min: 0 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
            query('search').optional().isString().trim()
        ],
        organizationsHttpController.getAll
    );

    router.get('/:id',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        resourceAccessAudit('organization'),
        organizationsHttpController.getById
    );

    router.post('/',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        [
            body('name').isString().trim().notEmpty().withMessage('Organization name is required'),
            body('seat_location').optional().isString().trim(),
            body('address').optional().isString().trim(),
            body('contact_email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email address required'),
            body('contact_name').optional().isString().trim(),
            body('contact_phone').optional().isString().trim(),
            body('contact_linkedin_url')
                .optional({ values: 'falsy' })
                .isURL({
                    require_protocol: true,
                    protocols: ['http', 'https'],
                    require_valid_protocol: true
                })
                .withMessage('Valid absolute LinkedIn URL required')
        ],
        resourceAccessAudit('organization'),
        organizationsHttpController.create
    );

    router.put('/:id',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        [
            body('name').optional().isString().trim().notEmpty(),
            body('seat_location').optional().isString().trim(),
            body('address').optional().isString().trim(),
            body('contact_email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email address required'),
            body('contact_name').optional().isString().trim(),
            body('contact_phone').optional().isString().trim(),
            body('contact_linkedin_url')
                .optional({ values: 'falsy' })
                .isURL({
                    require_protocol: true,
                    protocols: ['http', 'https'],
                    require_valid_protocol: true
                })
                .withMessage('Valid absolute LinkedIn URL required')
        ],
        resourceAccessAudit('organization'),
        organizationsHttpController.update
    );

    router.put('/:id/contact-photo',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        uploadContactPhoto,
        resourceAccessAudit('organization'),
        organizationsHttpController.uploadContactPhoto
    );

    router.delete('/:id/contact-photo',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        resourceAccessAudit('organization'),
        organizationsHttpController.deleteContactPhoto
    );

    router.delete('/:id',
        requireAuth(SUPER_ADMIN_ONLY_ROLES),
        resourceAccessAudit('organization'),
        organizationsHttpController.delete
    );

    return router;
};
