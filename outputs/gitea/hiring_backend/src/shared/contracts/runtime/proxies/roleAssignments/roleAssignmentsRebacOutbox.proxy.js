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
const portDefinition = require('@core/roleAssignments/application/ports/roleAssignmentsRebacOutbox.port');

module.exports = ({ roleAssignmentsRebacOutboxAdapter }) => {
    const service = requireServiceMethods(
        roleAssignmentsRebacOutboxAdapter,
        'roleAssignmentsRebacOutboxAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            enqueueMembershipSync: {
                input: tuple(plainObject, optional(optionsObject)),
                impl: (membership, options = {}) => service.enqueueMembershipSync(
                    cloneDto(membership),
                    cloneOptions(options)
                )
            },
            enqueueMembershipDelete: {
                input: tuple(plainObject, optional(optionsObject)),
                impl: (membership, options = {}) => service.enqueueMembershipDelete(
                    cloneDto(membership),
                    cloneOptions(options)
                )
            },
            enqueueUserRoleSync: {
                input: tuple(plainObject, optional(optionsObject)),
                impl: (user, options = {}) => service.enqueueUserRoleSync(
                    cloneDto(user),
                    cloneOptions(options)
                )
            }
        }
    });
};
