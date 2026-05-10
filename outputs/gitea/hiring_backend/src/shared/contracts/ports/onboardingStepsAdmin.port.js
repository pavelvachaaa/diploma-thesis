const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    optionsObject,
    plainObject,
    objectShape,
    arrayOf,
    optional,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');

const stepDefinitionDto = objectShape({
    id: entityId
}, { allowExtra: true });
const deletedEntityDto = objectShape({
    id: entityId
}, { allowExtra: true });

module.exports = ({ onboardingStepsService }) => {
    const {
        getAllSteps,
        createStep,
        updateStep,
        deleteStep
    } = requireServiceMethods(onboardingStepsService, 'onboardingStepsService', 'OnboardingStepsAdminPort', [
        'getAllSteps',
        'createStep',
        'updateStep',
        'deleteStep'
    ]);

    return createContractPort({
        portName: 'OnboardingStepsAdminPort',
        methods: {
            getAllSteps: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(stepDefinitionDto),
                impl: async (organizationId, accessOptions = {}) =>
                    cloneDtoArray(await getAllSteps(organizationId, cloneOptions(accessOptions)))
            },
            createStep: {
                input: tuple(plainObject, optional(optionsObject)),
                output: stepDefinitionDto,
                impl: async (stepDefinition, accessOptions = {}) =>
                    cloneDto(await createStep(cloneDto(stepDefinition), cloneOptions(accessOptions)))
            },
            updateStep: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: stepDefinitionDto,
                impl: async (stepId, patch, accessOptions = {}) =>
                    cloneDto(await updateStep(stepId, cloneDto(patch), cloneOptions(accessOptions)))
            },
            deleteStep: {
                input: tuple(entityId, optional(optionsObject)),
                output: deletedEntityDto,
                impl: async (stepId, accessOptions = {}) =>
                    cloneDto(await deleteStep(stepId, cloneOptions(accessOptions)))
            }
        }
    });
};
