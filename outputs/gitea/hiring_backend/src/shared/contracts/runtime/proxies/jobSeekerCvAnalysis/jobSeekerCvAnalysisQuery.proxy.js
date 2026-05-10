const { createContractPort } = require('@shared/contracts/runtime');
const { arrayOf, numberArray, objectShape, optionsObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekerCvAnalysis/application/ports/jobSeekerCvAnalysisQuery.port');

const dto = objectShape({}, { allowExtra: true });

module.exports = ({ jobSeekerCvAnalysisService }) => {
    const service = requireServiceMethods(
        jobSeekerCvAnalysisService,
        'jobSeekerCvAnalysisService',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            findMatchingJobSeekers: {
                input: tuple(numberArray, optionsObject),
                output: arrayOf(dto),
                impl: async (embeddingVector, matchOptions = {}) =>
                    cloneDtoArray(await service.findMatchingJobSeekers([...embeddingVector], cloneOptions(matchOptions)))
            }
        }
    });
};
