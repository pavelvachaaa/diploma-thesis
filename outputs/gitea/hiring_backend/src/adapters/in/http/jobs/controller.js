const { handle, sendResult } = require('@shared/http/controller');

module.exports = ({ jobsApplication }) => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

    const getJobsAdmin = handle(async (req, res) => {
        const { page = 0, sortBy, sortOrder, ...raw } = req.query;
        const filters = {
            organizationId: raw.org || raw.organization_id || null,
            role: raw.role || raw.job_role_id,
            classification: raw.classification,
            roles: raw.roles ? raw.roles.split(',').map((v) => v.trim()).filter(Boolean) : null,
            contractType: raw.contractType || raw.contract_type,
            contractTypes: raw.contractTypes
                ? raw.contractTypes.split(',').map((v) => v.trim()).filter(Boolean)
                : null,
            q: raw.q || raw.search,
            salaryMin: raw.salaryMin || raw.salary_min,
            salaryMax: raw.salaryMax || raw.salary_max,
            status: raw.status
        };
        const sort = sortBy ? { sortBy, sortOrder: sortOrder || 'asc' } : null;
        const jobs = await jobsApplication.getJobsAdmin({
            actorUserId: req.user.id,
            page: Number(page),
            filters,
            sort
        });
        sendResult(res, jobs);
    });

    const getJobs = handle(async (req, res) => {
        const { page = 0, ...raw } = req.query;
        let orgFilter = raw.org || raw.organization_id;
        let seatLocationFilter;
        if (!orgFilter && raw.location) {
            if (isUuid(raw.location)) {
                orgFilter = raw.location;
            } else {
                seatLocationFilter = String(raw.location).trim().toUpperCase();
            }
        }
        const filters = {
            org: orgFilter,
            location: seatLocationFilter,
            role: raw.role || raw.job_role_id,
            classification: raw.classification,
            roles: raw.roles ? raw.roles.split(',').map((v) => v.trim()).filter(Boolean) : null,
            contractType: raw.contractType || raw.contract_type,
            contractTypes: raw.contractTypes
                ? raw.contractTypes.split(',').map((v) => v.trim()).filter(Boolean)
                : null,
            q: raw.q || raw.search,
            salaryMin: raw.salaryMin || raw.salary_min,
            salaryMax: raw.salaryMax || raw.salary_max,
            status: raw.status,
            accredited: raw.accredited
        };
        const jobs = await jobsApplication.getJobs({ page: Number(page), filters });
        sendResult(res, jobs);
    });

    const getJobDetail = handle(async (req, res) => {
        const job = await jobsApplication.getJobDetail(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        sendResult(res, job);
    });

    const getJobDetailAdmin = handle(async (req, res) => {
        const job = await jobsApplication.getJobDetailAdmin(req.params.id, {
            actorUserId: req.user.id,
            minAccess: 'read'
        });
        if (!job) return res.status(404).json({ message: 'Job not found' });
        sendResult(res, job);
    });

    const createJob = handle(async (req, res) => {
        const job = await jobsApplication.createJob(req.body, req.user || null);
        res.status(201).json(job);
    });

    const updateJob = handle(async (req, res) => {
        const job = await jobsApplication.updateJob(req.params.id, req.body, req.user.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        sendResult(res, job);
    });

    const duplicateJob = handle(async (req, res) => {
        const newJob = await jobsApplication.duplicateJob(req.params.id, req.user?.id);
        res.status(201).json(newJob);
    });

    const deleteJob = handle(async (req, res) => {
        const job = await jobsApplication.deleteJob(req.params.id, req.user.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.status(204).send();
    });

    const getMatchingJobSeekers = handle(async (req, res) => {
        const result = await jobsApplication.getMatchingJobSeekers(
            req.params.id,
            { limit: req.body?.limit, threshold: req.body?.threshold },
            null,
            req.user?.id || null
        );
        if (!result) return res.status(404).json({ message: 'Job not found' });
        if (result.isProcessing) {
            return res.status(202).json({
                job_id: result.job_id,
                job_title: result.job_title,
                status: result.status,
                message: result.message,
                matches: result.matches
            });
        }
        const { isProcessing, ...payload } = result;
        sendResult(res, payload);
    });

    const getJobEmbeddingStatus = handle(async (req, res) => {
        const status = await jobsApplication.getJobEmbeddingStatus(req.params.id, req.user?.id || null);
        sendResult(res, status);
    });

    const updateAuthorizedPeople = handle(async (req, res) => {
        const authorizedPeople = Array.isArray(req.body?.authorizedPeople)
            ? req.body.authorizedPeople
            : [];
        const result = await jobsApplication.updateAuthorizedPeople(
            req.params.id,
            authorizedPeople,
            req.user?.id || null
        );
        sendResult(res, { authorized_people: result });
    });

    return {
        getJobsAdmin,
        getJobs,
        getJobDetail,
        getJobDetailAdmin,
        createJob,
        updateJob,
        duplicateJob,
        deleteJob,
        getMatchingJobSeekers,
        getJobEmbeddingStatus,
        updateAuthorizedPeople
    };
};
