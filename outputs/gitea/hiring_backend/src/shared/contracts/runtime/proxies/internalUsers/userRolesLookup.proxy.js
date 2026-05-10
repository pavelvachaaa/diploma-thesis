const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nonEmptyString,
    optional,
    optionsObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/internalUsers/application/ports/userRolesLookup.port');

module.exports = ({ userRolesLookupAdapter }) => {
    const service = requireServiceMethods(
        userRolesLookupAdapter,
        'userRolesLookupAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getUserRoles: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(nonEmptyString('role name')),
                impl: async (userId, options = {}) => cloneDtoArray(
                    await service.getUserRoles(userId, cloneOptions(options))
                )
            }
        }
    });
};
