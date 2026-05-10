const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    nonEmptyString,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    stringArray,
    tuple,
    unknown
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/sectionItems/application/ports/sectionItemsCatalogStore.port');

const dto = nullable(objectShape({}, { allowExtra: true }));
const requiredDto = objectShape({}, { allowExtra: true });
const dtoArray = arrayOf(objectShape({}, { allowExtra: true }));
const paginatedDto = objectShape({
    data: dtoArray,
    pagination: objectShape({}, { allowExtra: true })
}, { allowExtra: true });

module.exports = ({ sectionItemsCatalogStoreAdapter }) => {
    const service = requireServiceMethods(
        sectionItemsCatalogStoreAdapter,
        'sectionItemsCatalogStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getAllSectionTypes: {
                input: tuple(optional(optionsObject)),
                output: dtoArray,
                impl: async (options = {}) => cloneDtoArray(
                    await service.getAllSectionTypes(cloneOptions(options))
                )
            },
            getAll: {
                input: tuple(optional(plainObject)),
                output: paginatedDto,
                impl: async (options = {}) => {
                    const result = await service.getAll(cloneDto(options || {}));
                    return {
                        ...cloneDto(result),
                        data: cloneDtoArray(result?.data || []),
                        pagination: cloneDto(result?.pagination || {})
                    };
                }
            },
            getBySectionType: {
                input: tuple(nonEmptyString('section type name'), optional(optionsObject)),
                output: dtoArray,
                impl: async (sectionTypeName, options = {}) => cloneDtoArray(
                    await service.getBySectionType(sectionTypeName, cloneOptions(options))
                )
            },
            ensureCatalogItems: {
                input: tuple(nonEmptyString('section type name'), stringArray, optional(optionsObject)),
                output: dtoArray,
                impl: async (sectionTypeName, texts = [], options = {}) => cloneDtoArray(
                    await service.ensureCatalogItems(sectionTypeName, cloneDtoArray(texts), cloneOptions(options))
                )
            },
            getById: {
                input: tuple(entityId, optional(optionsObject)),
                output: dto,
                impl: async (id, options = {}) => {
                    const result = await service.getById(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            create: {
                input: tuple(plainObject, optional(optionsObject)),
                output: requiredDto,
                impl: async (data, options = {}) => cloneDto(
                    await service.create(cloneDto(data), cloneOptions(options))
                )
            },
            update: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: dto,
                impl: async (id, data, options = {}) => {
                    const result = await service.update(id, cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            delete: {
                input: tuple(entityId, optional(optionsObject)),
                output: dto,
                impl: async (id, options = {}) => {
                    const result = await service.delete(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            updateOrderIndex: {
                input: tuple(entityId, unknown(), optional(optionsObject)),
                impl: (id, orderIndex, options = {}) => service.updateOrderIndex(
                    id,
                    orderIndex,
                    cloneOptions(options)
                )
            }
        }
    });
};
