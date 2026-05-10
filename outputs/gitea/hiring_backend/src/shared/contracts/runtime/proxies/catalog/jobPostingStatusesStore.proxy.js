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
const portDefinition = require('@core/catalog/application/ports/jobPostingStatusesStore.port');

const catalogDto = nullable(objectShape({}, { allowExtra: true }));
const catalogArrayDto = arrayOf(objectShape({}, { allowExtra: true }));

module.exports = ({ jobPostingStatusesStoreAdapter }) => {
    const service = requireServiceMethods(
        jobPostingStatusesStoreAdapter,
        'jobPostingStatusesStoreAdapter',
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
            getByCode: {
                input: tuple(entityId),
                output: catalogDto,
                impl: async (code) => {
                    const result = await service.getByCode(code);
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
                impl: async (code, data) => {
                    const result = await service.update(code, cloneDto(data));
                    return result ? cloneDto(result) : null;
                }
            },
            delete: {
                input: tuple(entityId),
                output: catalogDto,
                impl: async (code) => {
                    const result = await service.delete(code);
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
