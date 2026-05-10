const { createContractPort } = require('@shared/contracts/runtime');
const {
    optionsObject,
    optional,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/organizations/application/ports/organizationFileGc.port');

module.exports = ({ organizationFileGcAdapter }) => {
    const service = requireServiceMethods(
        organizationFileGcAdapter,
        'organizationFileGcAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            enqueueFileGcDelete: {
                input: tuple(plainObject, optional(optionsObject)),
                impl: (payload, options = {}) => service.enqueueFileGcDelete(cloneDto(payload), cloneOptions(options))
            }
        }
    });
};
