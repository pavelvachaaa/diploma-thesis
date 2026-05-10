const { createContractPort } = require('@shared/contracts/runtime');
const {
    objectShape,
    optional,
    optionsObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/operations/application/ports/operationsAuditStore.port');

const auditPageDto = objectShape({}, { allowExtra: true });

module.exports = ({ operationsAuditStoreAdapter }) => {
    const service = requireServiceMethods(
        operationsAuditStoreAdapter,
        'operationsAuditStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getEvents: {
                input: tuple(optional(optionsObject)),
                output: auditPageDto,
                impl: async (options = {}) => cloneDto(await service.getEvents(cloneOptions(options)))
            },
            getEmployeeEvents: {
                input: tuple(optional(optionsObject)),
                output: auditPageDto,
                impl: async (options = {}) => cloneDto(await service.getEmployeeEvents(cloneOptions(options)))
            }
        }
    });
};
