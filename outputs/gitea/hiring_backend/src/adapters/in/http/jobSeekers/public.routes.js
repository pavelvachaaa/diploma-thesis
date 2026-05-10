const { CV_MIME_TYPES, JOB_SEEKER_ATTACHMENT_MIME_TYPES } = require('@shared/cv/fileTypes');

module.exports = ({ jobSeekersHttpController, fileHandler }) => {
    const { Router } = require('express');
    const { createFieldsUploadMiddleware } = fileHandler;

    const router = Router();

    router.post('/',
        createFieldsUploadMiddleware('job-seekers', [
            { name: 'cv', maxCount: 1 },
            { name: 'attachments', maxCount: 4 }
        ], {
            fieldAllowedTypes: {
                cv: [...CV_MIME_TYPES],
                attachments: [...JOB_SEEKER_ATTACHMENT_MIME_TYPES]
            }
        }),
        jobSeekersHttpController.submitJobSeekerForm
    );

    return router;
};
