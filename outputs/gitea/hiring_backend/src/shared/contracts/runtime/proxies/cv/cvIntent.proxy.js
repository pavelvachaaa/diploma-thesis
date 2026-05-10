const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    nullable,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/cv/application/ports/cvIntent.port');

const queuedIntentDto = nullable(objectShape({
    id: optional(entityId)
}, { allowExtra: true }));

module.exports = ({ cvService }) => {
    const service = requireServiceMethods(
        cvService,
        'cvService',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            queueApplicantAttachmentPublishIntent: {
                input: tuple(plainObject, optional(optionsObject)),
                output: queuedIntentDto,
                impl: async (payload, enqueueOptions = {}) => {
                    const result = await service.queueApplicantAttachmentPublishIntent(
                        cloneDto(payload),
                        cloneOptions(enqueueOptions)
                    );
                    return result ? cloneDto(result) : null;
                }
            },
            queueApplicantReanalysisPublishIntent: {
                input: tuple(plainObject, optional(optionsObject)),
                output: queuedIntentDto,
                impl: async (payload, enqueueOptions = {}) => {
                    const result = await service.queueApplicantReanalysisPublishIntent(
                        cloneDto(payload),
                        cloneOptions(enqueueOptions)
                    );
                    return result ? cloneDto(result) : null;
                }
            },
            queueJobSeekerCvPublishIntent: {
                input: tuple(plainObject, optional(optionsObject)),
                output: queuedIntentDto,
                impl: async (payload, enqueueOptions = {}) => {
                    const result = await service.queueJobSeekerCvPublishIntent(
                        cloneDto(payload),
                        cloneOptions(enqueueOptions)
                    );
                    return result ? cloneDto(result) : null;
                }
            },
            queueJobEmbeddingRequestIntent: {
                input: tuple(plainObject, optional(optionsObject)),
                output: queuedIntentDto,
                impl: async (payload, enqueueOptions = {}) => {
                    const result = await service.queueJobEmbeddingRequestIntent(
                        cloneDto(payload),
                        cloneOptions(enqueueOptions)
                    );
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
