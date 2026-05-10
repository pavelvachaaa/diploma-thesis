const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    nullable,
    objectShape,
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
const portDefinition = require('@core/organizations/application/ports/organizationFile.port');

const fileDto = nullable(objectShape({}, { allowExtra: true }));

module.exports = ({ organizationFileAdapter }) => {
    const service = requireServiceMethods(
        organizationFileAdapter,
        'organizationFileAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            resolveForDownload: {
                input: tuple(entityId),
                output: fileDto,
                impl: async (fileId) => {
                    const result = await service.resolveForDownload(fileId);
                    return result ? cloneDto(result) : null;
                }
            },
            createFileRecord: {
                input: tuple(plainObject, optional(optionsObject)),
                output: fileDto,
                impl: async (data, options = {}) => {
                    const result = await service.createFileRecord(cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            markRetained: {
                input: tuple(entityId, optional(optionsObject)),
                output: fileDto,
                impl: async (fileId, options = {}) => {
                    const result = await service.markRetained(fileId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
