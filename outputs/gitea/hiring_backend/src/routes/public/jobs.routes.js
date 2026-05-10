module.exports = ({ jobsController, applicantsController, fileHandler }) => {
    const { Router } = require('express');
    const { createMultipleUploadMiddleware } = fileHandler;

    const router = Router();

    // Public routes for career site (kariera.kzcr.eu)
    // These show only ACTIVE jobs to public

    router.get('/', jobsController.getJobs);

    router.get('/:id', jobsController.getJobDetail);

    router.post('/:id/apply', createMultipleUploadMiddleware('applicant-attachments', 'attachments', 5), applicantsController.applyForJob);

    return router;
};
