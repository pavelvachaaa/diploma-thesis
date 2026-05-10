const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    objectShape,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/catalog/application/ports/documentTypesStore.port');

const catalogDto = nullable(objectShape({}, { allowExtra: true }));
const catalogArrayDto = arrayOf(objectShape({}, { allowExtra: true }));

module.exports = ({ documentTypesStoreAdapter }) => {
    const service = requireServiceMethods(
        documentTypesStoreAdapter,
        'documentTypesStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getAll: {
                input: tuple(),
                output: catalogArrayDto,
                impl: async () => cloneDtoArray(await service.getAll())
            },
            getById: {
                input: tuple(entityId),
                output: catalogDto,
                impl: async (id) => {
                    const result = await service.getById(id);
                    return result ? cloneDto(result) : null;
                }
            },
            create: {
                input: tuple(plainObject),
                output: catalogDto,
                impl: async (data) => {
                    const result = await service.create(cloneDto(data));
                    return result ? cloneDto(result) : null;
                }
            },
            update: {
                input: tuple(entityId, plainObject),
                output: catalogDto,
                impl: async (id, data) => {
                    const result = await service.update(id, cloneDto(data));
                    return result ? cloneDto(result) : null;
                }
            },
            delete: {
                input: tuple(entityId),
                output: catalogDto,
                impl: async (id) => {
                    const result = await service.delete(id);
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
