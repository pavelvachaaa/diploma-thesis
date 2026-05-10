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
const { cloneDto, cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekers/application/ports/jobSeekersStore.port');

const dto = objectShape({}, { allowExtra: true });
const nullableDto = nullable(dto);
const callbackValidator = Object.freeze({
    expected: 'transaction callback',
    parse: (value, meta) => {
        if (typeof value !== 'function') {
            throw new Error(`${meta.port}.${meta.method} expected ${meta.path} to be a transaction callback`);
        }
        return value;
    }
});

module.exports = ({ jobSeekersStoreAdapter }) => {
    const service = requireServiceMethods(
        jobSeekersStoreAdapter,
        'jobSeekersStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            withTransaction: {
                input: tuple(callbackValidator),
                impl: (work) => service.withTransaction(work)
            },
            createJobSeeker: {
                input: tuple(plainObject, optional(optionsObject)),
                output: dto,
                impl: async (data, options = {}) => cloneDto(await service.createJobSeeker(cloneDto(data), cloneOptions(options)))
            },
            createJobSeekerLocations: {
                input: tuple(entityId, arrayOf(entityId), optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (id, orgIds, options = {}) => cloneDtoArray(await service.createJobSeekerLocations(id, orgIds, cloneOptions(options)))
            },
            createJobSeekerAttachments: {
                input: tuple(entityId, arrayOf(entityId), optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (id, fileIds, options = {}) => cloneDtoArray(await service.createJobSeekerAttachments(id, fileIds, cloneOptions(options)))
            },
            getAllJobSeekers: {
                input: tuple(optional(plainObject)),
                output: dto,
                impl: async (options = {}) => cloneDto(await service.getAllJobSeekers(cloneDto(options || {})))
            },
            getJobSeekerById: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getJobSeekerById(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getDeleteMetadata: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getDeleteMetadata(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            deleteJobSeeker: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.deleteJobSeeker(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getJobSeekersByOrganization: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (organizationId, options = {}) => cloneDtoArray(await service.getJobSeekersByOrganization(organizationId, cloneOptions(options)))
            },
            getAttachmentsByJobSeekerId: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (jobSeekerId, options = {}) => cloneDtoArray(await service.getAttachmentsByJobSeekerId(jobSeekerId, cloneOptions(options)))
            },
            getAttachmentById: {
                input: tuple(entityId, entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (jobSeekerId, attachmentId, options = {}) => {
                    const result = await service.getAttachmentById(jobSeekerId, attachmentId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
