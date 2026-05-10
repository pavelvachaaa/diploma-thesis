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
const portDefinition = require('@core/organizations/application/ports/organizationRebacSync.port');

module.exports = ({ organizationRebacSyncAdapter }) => {
    const service = requireServiceMethods(
        organizationRebacSyncAdapter,
        'organizationRebacSyncAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            enqueueOrganizationSync: {
                input: tuple(plainObject, optional(optionsObject)),
                impl: (organization, options = {}) => service.enqueueOrganizationSync(cloneDto(organization), cloneOptions(options))
            }
        }
    });
};
