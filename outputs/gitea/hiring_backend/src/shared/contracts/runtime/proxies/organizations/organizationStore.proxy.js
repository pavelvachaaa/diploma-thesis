const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
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
const portDefinition = require('@core/organizations/application/ports/organizationStore.port');

const organizationDto = nullable(objectShape({}, { allowExtra: true }));
const organizationArrayDto = arrayOf(objectShape({}, { allowExtra: true }));
const organizationListDto = objectShape({
    data: organizationArrayDto,
    pagination: objectShape({}, { allowExtra: true })
}, { allowExtra: true });

const normalizeList = (result) => ({
    ...cloneDto(result),
    data: cloneDto(result?.data || []),
    pagination: cloneDto(result?.pagination || {})
});

module.exports = ({ organizationStoreAdapter }) => {
    const service = requireServiceMethods(
        organizationStoreAdapter,
        'organizationStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getAll: {
                input: tuple(optional(plainObject)),
                output: organizationListDto,
                impl: async (options = {}) => normalizeList(await service.getAll(cloneDto(options || {})))
            },
            getById: {
                input: tuple(entityId, optional(optionsObject)),
                output: organizationDto,
                impl: async (id, options = {}) => {
                    const result = await service.getById(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            create: {
                input: tuple(plainObject, optional(optionsObject)),
                output: organizationDto,
                impl: async (data, options = {}) => {
                    const result = await service.create(cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            update: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: organizationDto,
                impl: async (id, data, options = {}) => {
                    const result = await service.update(id, cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            updateContactPhoto: {
                input: tuple(entityId, entityId, optional(optionsObject)),
                output: organizationDto,
                impl: async (id, fileId, options = {}) => {
                    const result = await service.updateContactPhoto(id, fileId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            clearContactPhoto: {
                input: tuple(entityId, optional(optionsObject)),
                output: organizationDto,
                impl: async (id, options = {}) => {
                    const result = await service.clearContactPhoto(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            delete: {
                input: tuple(entityId, optional(optionsObject)),
                output: organizationDto,
                impl: async (id, options = {}) => {
                    const result = await service.delete(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
