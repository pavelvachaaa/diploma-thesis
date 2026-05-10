module.exports = ({ jobsHttpController, applicantsController, fileHandler }) => {
    const { Router } = require('express');
    const { createMultipleUploadMiddleware } = fileHandler;

    const router = Router();

    router.get('/', jobsHttpController.getJobs);
    router.get('/:id', jobsHttpController.getJobDetail);
    router.post('/:id/apply', createMultipleUploadMiddleware('applicant-attachments', 'attachments', 5), applicantsController.applyForJob);

    return router;
};
