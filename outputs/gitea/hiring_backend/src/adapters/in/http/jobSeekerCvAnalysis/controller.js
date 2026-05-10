const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ jobSeekerCvAnalysisService, jobSeekersAccessPort }) => {
    const getAnalysis = handle(async (req, res) => {
        const analysis = await jobSeekerCvAnalysisService.getAnalysis(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        if (!analysis) {
            const status = await jobSeekerCvAnalysisService.getStatus(req.params.id, {
                actorUserId: req.user.id,
                minAccess: 'read'
            });
            if (status) {
                return sendResult(res, status);
            }
            return sendResult(res, { message: 'CV analysis not found for this job seeker' }, 404);
        }

        return sendResult(res, analysis);
    });

    const getStatus = handle(async (req, res) => {
        const status = await jobSeekerCvAnalysisService.getStatus(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        if (!status) {
            return sendResult(res, { message: 'No CV analysis record found for this job seeker' }, 404);
        }

        return sendResult(res, status);
    });

    const triggerReanalysis = handle(async (req, res) => {
        const jobSeeker = await jobSeekersAccessPort.getJobSeekerById(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'write'
        });

        if (!jobSeeker) {
            return sendResult(res, { message: 'Job seeker not found' }, 404);
        }

        const result = await jobSeekerCvAnalysisService.triggerReanalysis(req.params.id, jobSeeker);

        return sendResult(res, result);
    });

    const searchBySkills = handle(async (req, res) => {
        const result = await jobSeekerCvAnalysisService.searchBySkills(req.query.skills, {
            actorUserId: req.user.id,
            minAccess: 'read',
            limit: req.query.limit ?? 20
        });

        return sendResult(res, result);
    });

    const getStats = handle(async (req, res) => {
        const stats = await jobSeekerCvAnalysisService.getStats({
            actorUserId: req.user.id,
            minAccess: 'read'
        });

        return sendResult(res, stats);
    });

    return {
        getAnalysis,
        getStatus,
        triggerReanalysis,
        searchBySkills,
        getStats
    };
};
