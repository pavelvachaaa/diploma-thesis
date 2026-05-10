module.exports = ({ employeesService }) => {
    const getEmployeeOnboardingDashboardAdmin = async (req, res, next) => {
        try {
            const dashboardData = await employeesService.getEmployeeOnboardingDashboard(req.params.id, {
                actorUserId: req.user.id
            });

            if (!dashboardData) {
                return res.status(404).json({ message: 'Employee onboarding data not found' });
            }

            res.json(dashboardData);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeOnboardingStepsAdmin = async (req, res, next) => {
        try {
            const steps = await employeesService.getEmployeeOnboardingSteps(req.params.id, {
                actorUserId: req.user.id
            });
            res.json(steps);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeOnboardingProgressAdmin = async (req, res, next) => {
        try {
            const progress = await employeesService.getEmployeeOnboardingProgress(req.params.id, {
                actorUserId: req.user.id
            });
            res.json(progress);
        } catch (err) {
            next(err);
        }
    };

    const getEmployeeStepResponsesAdmin = async (req, res, next) => {
        try {
            const { id: employeeId, stepId } = req.params;
            const stepDetails = await employeesService.getEmployeeOnboardingStepResponses(employeeId, stepId, {
                actorUserId: req.user.id
            });

            if (!stepDetails) {
                return res.status(404).json({ message: 'Step not found or not completed by employee' });
            }

            res.json(stepDetails);
        } catch (err) {
            next(err);
        }
    };

    return {
        getEmployeeOnboardingDashboardAdmin,
        getEmployeeOnboardingStepsAdmin,
        getEmployeeOnboardingProgressAdmin,
        getEmployeeStepResponsesAdmin
    };
};
