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
const portDefinition = require('@core/auth/application/ports/authMembershipSync.port');

const nullableDto = nullable(objectShape({}, { allowExtra: true }));

module.exports = ({ authMembershipSyncAdapter }) => {
    const service = requireServiceMethods(
        authMembershipSyncAdapter,
        'authMembershipSyncAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            queueMembershipSync: {
                input: tuple(plainObject, optional(optionsObject)),
                output: nullableDto,
                impl: async (payload, options = {}) => {
                    const result = await service.queueMembershipSync(cloneDto(payload), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
