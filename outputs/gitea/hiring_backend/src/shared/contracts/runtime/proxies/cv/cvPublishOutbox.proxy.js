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
const portDefinition = require('@core/cv/application/ports/cvPublishOutbox.port');

const queuedIntentDto = nullable(objectShape({}, { allowExtra: true }));

module.exports = ({ cvPublishOutboxAdapter }) => {
    const service = requireServiceMethods(
        cvPublishOutboxAdapter,
        'cvPublishOutboxAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            enqueue: {
                input: tuple(plainObject, optional(optionsObject)),
                output: queuedIntentDto,
                impl: async (intent, options = {}) => {
                    const result = await service.enqueue(cloneDto(intent), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
