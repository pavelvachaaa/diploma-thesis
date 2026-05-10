const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ cvAnalysisService }) => {
    const getAnalysis = handle(async (req, res) => {
        const analysis = await cvAnalysisService.getAnalysis(req.params.applicantId, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        if (!analysis) {
            const status = await cvAnalysisService.getStatus(req.params.applicantId, {
                actorUserId: req.user.id,
                minAccess: 'read'
            });
            if (status) {
                return sendResult(res, status);
            }
            return sendResult(res, { message: 'CV analysis not found for this applicant' }, 404);
        }

        return sendResult(res, analysis);
    });

    const getStatus = handle(async (req, res) => {
        const status = await cvAnalysisService.getStatus(req.params.applicantId, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        if (!status) {
            return sendResult(res, { message: 'No CV analysis record found for this applicant' }, 404);
        }

        return sendResult(res, status);
    });

    const searchBySkills = handle(async (req, res) => {
        const result = await cvAnalysisService.searchBySkills(req.query.skills, {
            actorUserId: req.user.id,
            minAccess: 'read',
            limit: req.query.limit ?? 20
        });

        return sendResult(res, result);
    });

    const getStats = handle(async (req, res) => {
        const stats = await cvAnalysisService.getStats({
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        return sendResult(res, stats);
    });

    const triggerReanalysis = handle(async (req, res) => {
        const result = await cvAnalysisService.triggerReanalysis(req.params.applicantId, {
            actorUserId: req.user.id,
            minAccess: 'write'
        });

        return sendResult(res, result);
    });

    return {
        getAnalysis,
        getStatus,
        searchBySkills,
        getStats,
        triggerReanalysis
    };
};
