module.exports = ({ cvAnalysisController }) => {
    const { Router } = require('express');
    const { requireAuth } = require('@middlewares/auth.middleware');

    const router = Router();

    router.use(requireAuth(['admin', 'hr']));

    router.get('/stats', cvAnalysisController.getStats);
    router.get('/skills-search', cvAnalysisController.searchBySkills);
    router.post('/:applicantId/reanalyze', cvAnalysisController.triggerReanalysis);
    router.get('/:applicantId/status', cvAnalysisController.getStatus);
    router.get('/:applicantId', cvAnalysisController.getAnalysis);

    return router;
};
