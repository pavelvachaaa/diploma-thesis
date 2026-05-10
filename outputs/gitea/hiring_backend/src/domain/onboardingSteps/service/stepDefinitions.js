module.exports = ({ onboardingStepsRepository }) => {
    const VALID_STEP_TYPES = ['info', 'ack', 'form', 'quiz', 'file'];

    const getAllSteps = async (organizationId) => onboardingStepsRepository.getAllSteps(organizationId);

    const createStep = async (data) => {
        if (!data.title || !data.step_type || !data.organization_id) {
            throw new Error('Title, step_type, and organization_id are required');
        }

        if (!VALID_STEP_TYPES.includes(data.step_type)) {
            throw new Error(`Invalid step_type. Must be one of: ${VALID_STEP_TYPES.join(', ')}`);
        }

        return onboardingStepsRepository.createStep(data);
    };

    const updateStep = async (id, data) => {
        if (data.step_type && !VALID_STEP_TYPES.includes(data.step_type)) {
            throw new Error(`Invalid step_type. Must be one of: ${VALID_STEP_TYPES.join(', ')}`);
        }

        return onboardingStepsRepository.updateStep(id, data);
    };

    const deleteStep = async (id) => onboardingStepsRepository.deleteStep(id);

    return {
        getAllSteps,
        createStep,
        updateStep,
        deleteStep
    };
};
