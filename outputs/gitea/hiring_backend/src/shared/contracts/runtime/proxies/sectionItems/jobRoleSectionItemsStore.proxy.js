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
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/sectionItems/application/ports/jobRoleSectionItemsStore.port');

const dto = nullable(objectShape({}, { allowExtra: true }));
const dtoArray = arrayOf(objectShape({}, { allowExtra: true }));

module.exports = ({ jobRoleSectionItemsStoreAdapter }) => {
    const service = requireServiceMethods(
        jobRoleSectionItemsStoreAdapter,
        'jobRoleSectionItemsStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getByJobRole: {
                input: tuple(entityId, optional(optionsObject)),
                output: dtoArray,
                impl: async (jobRoleId, options = {}) => cloneDtoArray(
                    await service.getByJobRole(jobRoleId, cloneOptions(options))
                )
            },
            addToJobRole: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: dto,
                impl: async (jobRoleId, data, options = {}) => {
                    const result = await service.addToJobRole(jobRoleId, cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            updateJobRoleItem: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: dto,
                impl: async (id, data, options = {}) => {
                    const result = await service.updateJobRoleItem(id, cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            removeFromJobRole: {
                input: tuple(entityId, optional(optionsObject)),
                output: dto,
                impl: async (id, options = {}) => {
                    const result = await service.removeFromJobRole(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            replaceJobRoleSectionItems: {
                input: tuple(entityId, entityId, arrayOf(plainObject), optional(optionsObject)),
                impl: (jobRoleId, sectionTypeName, items, options = {}) => service.replaceJobRoleSectionItems(
                    jobRoleId,
                    sectionTypeName,
                    cloneDtoArray(items),
                    cloneOptions(options)
                )
            }
        }
    });
};
