const { createContractPort } = require('@shared/contracts/runtime');
const {
    optionsObject,
    plainObject,
    objectShape,
    booleanFlag,
    tuple,
    optional,
    nullable,
    entityId
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobs/application/ports/internalUserProvisioning.port');

const provisionedUserDto = objectShape({
    user: objectShape({
        id: entityId
    }, { allowExtra: true }),
    organization: nullable(objectShape({
        id: entityId
    }, { allowExtra: true })),
    created: booleanFlag()
}, { allowExtra: true });

module.exports = ({ internalUsersApplication }) => {
    const service = requireServiceMethods(
        internalUsersApplication,
        'internalUsersApplication',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            ensureLocalUser: {
                input: tuple(plainObject, optional(optionsObject)),
                output: provisionedUserDto,
                impl: async (personInput, txOptions = {}) => {
                    const result = await service.ensureLocalUser(cloneDto(personInput), cloneOptions(txOptions));
                    return {
                        ...cloneDto(result),
                        user: cloneDto(result?.user),
                        organization: result?.organization ? cloneDto(result.organization) : null
                    };
                }
            }
        }
    });
};
