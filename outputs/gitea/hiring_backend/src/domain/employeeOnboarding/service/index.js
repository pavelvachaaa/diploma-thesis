module.exports = ({
    employeeOnboardingRepository,
    employeeOnboardingStepPort,
    onboardingTemplateQueryPort
}) => {
    const getDashboardData = async (userId) => employeeOnboardingRepository.getDashboardData(userId);

    const getOnboardingSteps = async (userId) => employeeOnboardingRepository.getOnboardingSteps(userId);

    const startStep = async (userId, userStepId) => employeeOnboardingStepPort.startStep(userStepId, userId);

    const completeStep = async (userId, userStepId) => employeeOnboardingStepPort.completeStep(userStepId, userId);

    const getRequiredDocuments = async (userId) => employeeOnboardingRepository.getRequiredDocuments(userId);

    const getProgress = async (userId) => employeeOnboardingRepository.getProgress(userId);

    const getDashboardDataForEmployee = async (employeeId) => employeeOnboardingRepository.getDashboardData(employeeId);

    const getOnboardingStepsForEmployee = async (employeeId) => employeeOnboardingRepository.getOnboardingSteps(employeeId);

    const getProgressForEmployee = async (employeeId) => employeeOnboardingRepository.getProgress(employeeId);

    const getTemplateForDownload = async (templateFile) =>
        onboardingTemplateQueryPort.getOnboardingTemplateByFilename(templateFile);

    return {
        getDashboardData,
        getOnboardingSteps,
        startStep,
        completeStep,
        getRequiredDocuments,
        getProgress,
        getDashboardDataForEmployee,
        getOnboardingStepsForEmployee,
        getProgressForEmployee,
        getTemplateForDownload
    };
};
