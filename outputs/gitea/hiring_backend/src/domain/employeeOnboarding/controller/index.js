module.exports = ({ employeeOnboardingService }) => {
    const getDashboard = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const dashboardData = await employeeOnboardingService.getDashboardData(userId);
            res.json(dashboardData);
        } catch (error) {
            next(error);
        }
    };

    const getSteps = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const steps = await employeeOnboardingService.getOnboardingSteps(userId);
            res.json(steps);
        } catch (error) {
            next(error);
        }
    };

    const startStep = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const { userStepId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const result = await employeeOnboardingService.startStep(userId, userStepId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    const completeStep = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const { userStepId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const result = await employeeOnboardingService.completeStep(userId, userStepId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    const getProgress = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const progress = await employeeOnboardingService.getProgress(userId);
            res.json(progress);
        } catch (error) {
            next(error);
        }
    };

    return {
        getDashboard,
        getSteps,
        startStep,
        completeStep,
        getProgress
    };
};
