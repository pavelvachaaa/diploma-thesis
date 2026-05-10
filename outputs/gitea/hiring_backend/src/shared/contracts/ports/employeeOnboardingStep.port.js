const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const employeeStepDetailDto = objectShape({}, { allowExtra: true });
const employeeStepStateDto = objectShape({
    userStep: objectShape({
        id: entityId
    }, { allowExtra: true })
}, { allowExtra: true });

module.exports = ({ onboardingStepsService }) => {
    const {
        getStepDetailsForEmployee,
        startStep,
        completeStep
    } = requireServiceMethods(onboardingStepsService, 'onboardingStepsService', 'EmployeeOnboardingStepPort', [
        'getStepDetailsForEmployee',
        'startStep',
        'completeStep'
    ]);

    return createContractPort({
        portName: 'EmployeeOnboardingStepPort',
        methods: {
            getStepDetailsForEmployee: {
                input: tuple(entityId, entityId),
                output: employeeStepDetailDto,
                impl: async (userStepId, employeeId) =>
                    cloneDto(await getStepDetailsForEmployee(userStepId, employeeId))
            },
            startStep: {
                input: tuple(entityId, entityId),
                output: employeeStepStateDto,
                impl: async (userStepId, userId) =>
                    cloneDto(await startStep(userStepId, userId))
            },
            completeStep: {
                input: tuple(entityId, entityId),
                output: employeeStepStateDto,
                impl: async (userStepId, userId) =>
                    cloneDto(await completeStep(userStepId, userId))
            }
        }
    });
};
