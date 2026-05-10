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
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/operations/application/ports/operationsOutboxGateway.port');

const dto = objectShape({}, { allowExtra: true });

module.exports = ({ operationsOutboxGatewayAdapter }) => {
    const service = requireServiceMethods(
        operationsOutboxGatewayAdapter,
        'operationsOutboxGatewayAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            inspectSummary: {
                input: tuple(optional(optionsObject)),
                output: dto,
                impl: async (filters = {}) => cloneDto(await service.inspectSummary(cloneOptions(filters)))
            },
            listEvents: {
                input: tuple(optional(optionsObject)),
                output: dto,
                impl: async (filters = {}) => cloneDto(await service.listEvents(cloneOptions(filters)))
            },
            previewReplayDead: {
                input: tuple(optional(plainObject), optional(plainObject)),
                output: dto,
                impl: async (selection = {}, options = {}) => cloneDto(
                    await service.previewReplayDead(cloneDto(selection), cloneDto(options))
                )
            },
            replayDead: {
                input: tuple(optional(plainObject), optional(plainObject)),
                output: dto,
                impl: async (selection = {}, options = {}) => cloneDto(
                    await service.replayDead(cloneDto(selection), cloneDto(options))
                )
            }
        }
    });
};
