const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    stringArray,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/catalog/application/ports/jobRolesStore.port');

const jobRoleDto = nullable(objectShape({}, { allowExtra: true }));
const jobRoleArrayDto = arrayOf(objectShape({}, { allowExtra: true }));
const paginatedJobRolesDto = objectShape({
    data: jobRoleArrayDto,
    pagination: objectShape({}, { allowExtra: true })
}, { allowExtra: true });

module.exports = ({ jobRolesStoreAdapter }) => {
    const service = requireServiceMethods(
        jobRolesStoreAdapter,
        'jobRolesStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getAll: {
                input: tuple(optional(plainObject)),
                output: paginatedJobRolesDto,
                impl: async (options = {}) => {
                    const result = await service.getAll(cloneDto(options || {}));
                    return {
                        ...cloneDto(result),
                        data: cloneDtoArray(result?.data),
                        pagination: cloneDto(result?.pagination || {})
                    };
                }
            },
            getById: {
                input: tuple(entityId, optional(optionsObject)),
                output: jobRoleDto,
                impl: async (id, options = {}) => {
                    const result = await service.getById(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getByOrganization: {
                input: tuple(entityId, optional(optionsObject)),
                output: jobRoleArrayDto,
                impl: async (organizationId, options = {}) => cloneDtoArray(
                    await service.getByOrganization(organizationId, cloneOptions(options))
                )
            },
            create: {
                input: tuple(plainObject, optional(optionsObject)),
                output: jobRoleDto,
                impl: async (data, options = {}) => {
                    const result = await service.create(cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            update: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: jobRoleDto,
                impl: async (id, data, options = {}) => {
                    const result = await service.update(id, cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            delete: {
                input: tuple(entityId, optional(optionsObject)),
                output: jobRoleDto,
                impl: async (id, options = {}) => {
                    const result = await service.delete(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getAllClassifications: {
                input: tuple(),
                output: jobRoleArrayDto,
                impl: async () => cloneDtoArray(await service.getAllClassifications())
            },
            getUniqueNames: {
                input: tuple(),
                output: stringArray,
                impl: async () => cloneDtoArray(await service.getUniqueNames())
            }
        }
    });
};
