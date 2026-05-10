const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    objectShape,
    optional,
    optionsObject,
    plainObject,
    stringArray,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/cvAnalysis/application/ports/cvAnalysisStore.port');

const dto = objectShape({}, { allowExtra: true });
const nullableDto = nullable(dto);

module.exports = ({ cvAnalysisStoreAdapter }) => {
    const service = requireServiceMethods(
        cvAnalysisStoreAdapter,
        'cvAnalysisStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getByApplicantId: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getByApplicantId(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getByAttachmentId: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getByAttachmentId(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            searchBySkills: {
                input: tuple(stringArray, optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (skills, options = {}) => cloneDtoArray(await service.searchBySkills([...skills], cloneOptions(options)))
            },
            getStats: {
                input: tuple(optional(optionsObject)),
                output: dto,
                impl: async (options = {}) => cloneDto(await service.getStats(cloneOptions(options)))
            },
            getApplicantAttachmentInfo: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getApplicantAttachmentInfo(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            createOrUpdatePending: {
                input: tuple(plainObject, optional(optionsObject)),
                output: dto,
                impl: async (data, options = {}) => cloneDto(await service.createOrUpdatePending(cloneDto(data), cloneOptions(options)))
            },
            getStatusByApplicantId: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (id, options = {}) => {
                    const result = await service.getStatusByApplicantId(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
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
