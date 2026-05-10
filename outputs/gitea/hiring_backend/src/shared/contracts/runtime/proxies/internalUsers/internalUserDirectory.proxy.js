const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    nonEmptyString,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDtoArray,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/internalUsers/application/ports/internalUserDirectory.port');

const searchInputDto = objectShape({
    query: nonEmptyString('query')
}, { allowExtra: false });
const directoryResultArrayDto = arrayOf(objectShape({}, { allowExtra: true }));

module.exports = ({ internalUserDirectoryAdapter }) => {
    const service = requireServiceMethods(
        internalUserDirectoryAdapter,
        'internalUserDirectoryAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            searchUsers: {
                input: tuple(searchInputDto),
                output: directoryResultArrayDto,
                impl: async (payload) => cloneDtoArray(await service.searchUsers(payload))
            }
        }
    });
};
