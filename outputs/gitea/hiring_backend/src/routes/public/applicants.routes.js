module.exports = ({ applicantsController }) => {
    const { Router } = require('express');

    const router = Router();

    // Public routes for job applications
    // These routes are used by the public career site

    // No public routes needed for now
    // All applicant management is admin-only

    return router;
};
