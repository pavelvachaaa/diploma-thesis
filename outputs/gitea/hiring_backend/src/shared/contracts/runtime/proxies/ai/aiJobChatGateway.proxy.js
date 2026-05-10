const { createContractPort } = require('@shared/contracts/runtime');
const {
    objectShape,
    optional,
    optionsObject,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/ai/application/ports/aiJobChatGateway.port');

const callbacksShape = objectShape({
}, { allowExtra: true, cloneResult: false });

module.exports = ({ aiJobChatGatewayAdapter }) => {
    const service = requireServiceMethods(
        aiJobChatGatewayAdapter,
        'aiJobChatGatewayAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            streamChat: {
                input: tuple(plainObject, callbacksShape, optional(optionsObject)),
                output: optional(plainObject),
                impl: async (command, callbacks, options = {}) => service.streamChat(
                    cloneDto(command),
                    callbacks,
                    options
                )
            },
            refineText: {
                input: tuple(plainObject, callbacksShape, optional(optionsObject)),
                output: optional(plainObject),
                impl: async (command, callbacks, options = {}) => service.refineText(
                    cloneDto(command),
                    callbacks,
                    options
                )
            },
            extractJob: {
                input: tuple(plainObject),
                output: plainObject,
                impl: async (command) => cloneDto(await service.extractJob(cloneDto(command)))
            }
        }
    });
};
