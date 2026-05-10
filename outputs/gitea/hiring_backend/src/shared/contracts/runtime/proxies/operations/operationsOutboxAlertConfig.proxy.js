const { createContractPort } = require('@shared/contracts/runtime');
const { objectShape, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/operations/application/ports/operationsOutboxAlertConfig.port');

module.exports = ({ operationsOutboxAlertConfigAdapter }) => {
    const service = requireServiceMethods(
        operationsOutboxAlertConfigAdapter,
        'operationsOutboxAlertConfigAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getAlertThresholds: {
                input: tuple(),
                output: objectShape({}, { allowExtra: true }),
                impl: async () => cloneDto(await service.getAlertThresholds())
            }
        }
    });
};
