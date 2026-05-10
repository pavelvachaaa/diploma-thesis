module.exports = ({ applicantsController }) => {
    const { Router } = require('express');

    const router = Router();

    // Employee routes should be minimal
    // Applicant management is handled by admin routes

    // If employees need any specific applicant-related routes, add them here
    // For now, keeping this empty as applicants are handled by admin routes

    return router;
};
