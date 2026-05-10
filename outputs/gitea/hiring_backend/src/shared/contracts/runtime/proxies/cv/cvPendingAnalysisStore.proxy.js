const { createContractPort } = require('@shared/contracts/runtime');
const {
    nullable,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/cv/application/ports/cvPendingAnalysisStore.port');

const pendingResultDto = nullable(objectShape({}, { allowExtra: true }));

module.exports = ({ cvPendingAnalysisStoreAdapter }) => {
    const service = requireServiceMethods(
        cvPendingAnalysisStoreAdapter,
        'cvPendingAnalysisStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            createApplicantPendingAnalysis: {
                input: tuple(plainObject, optional(optionsObject)),
                output: pendingResultDto,
                impl: async (payload, options = {}) => {
                    const result = await service.createApplicantPendingAnalysis(
                        cloneDto(payload),
                        cloneOptions(options)
                    );
                    return result ? cloneDto(result) : null;
                }
            },
            createJobSeekerPendingAnalysis: {
                input: tuple(plainObject, optional(optionsObject)),
                output: pendingResultDto,
                impl: async (payload, options = {}) => {
                    const result = await service.createJobSeekerPendingAnalysis(
                        cloneDto(payload),
                        cloneOptions(options)
                    );
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
