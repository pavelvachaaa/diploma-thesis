const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    numberArray,
    objectShape,
    optional,
    optionsObject,
    plainObject,
    stringArray,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekerCvAnalysis/application/ports/jobSeekerCvAnalysisStore.port');

const dto = objectShape({}, { allowExtra: true });
const nullableDto = nullable(dto);

module.exports = ({ jobSeekerCvAnalysisStoreAdapter }) => {
    const service = requireServiceMethods(
        jobSeekerCvAnalysisStoreAdapter,
        'jobSeekerCvAnalysisStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getByJobSeekerId: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getByJobSeekerId(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getStatusByJobSeekerId: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getStatusByJobSeekerId(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            createOrUpdatePending: {
                input: tuple(plainObject, optional(optionsObject)),
                output: dto,
                impl: async (data, options = {}) => cloneDto(await service.createOrUpdatePending(cloneDto(data), cloneOptions(options)))
            },
            searchBySkills: {
                input: tuple(stringArray, optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (skills, options = {}) => cloneDtoArray(await service.searchBySkills([...skills], cloneOptions(options)))
            },
            findMatchingByEmbedding: {
                input: tuple(numberArray, optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (embedding, options = {}) => cloneDtoArray(await service.findMatchingByEmbedding([...embedding], cloneOptions(options)))
            },
            getStats: {
                input: tuple(optional(optionsObject)),
                output: dto,
                impl: async (options = {}) => cloneDto(await service.getStats(cloneOptions(options)))
            },
            saveAnalysisResult: {
                input: tuple(plainObject, optional(optionsObject)),
                output: nullableDto,
                impl: async (result, options = {}) => {
                    const saved = await service.saveAnalysisResult(cloneDto(result), cloneOptions(options));
                    return saved ? cloneDto(saved) : null;
                }
            },
            saveAnalysisFailure: {
                input: tuple(plainObject, optional(optionsObject)),
                output: nullableDto,
                impl: async (result, options = {}) => {
                    const saved = await service.saveAnalysisFailure(cloneDto(result), cloneOptions(options));
                    return saved ? cloneDto(saved) : null;
                }
            }
        }
    });
};
