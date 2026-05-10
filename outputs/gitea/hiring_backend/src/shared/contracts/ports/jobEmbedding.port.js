const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    plainObject,
    nullable,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const jobEmbeddingStateDto = objectShape({}, { allowExtra: true });
const jobEmbeddingStatusDto = nullable(objectShape({}, { allowExtra: true }));

module.exports = ({ jobsApplication }) => {
    const {
        getOrRequestEmbedding,
        getStatus
    } = requireServiceMethods(jobsApplication, 'jobsApplication', 'JobEmbeddingPort', [
        'getOrRequestEmbedding',
        'getStatus'
    ]);

    return createContractPort({
        portName: 'JobEmbeddingPort',
        methods: {
            getOrRequestEmbedding: {
                input: tuple(plainObject),
                output: jobEmbeddingStateDto,
                impl: async (jobEmbeddingRequest) =>
                    cloneDto(await getOrRequestEmbedding(cloneDto(jobEmbeddingRequest)))
            },
            getStatus: {
                input: tuple(entityId),
                output: jobEmbeddingStatusDto,
                impl: async (jobId) => {
                    const status = await getStatus(jobId);
                    return status ? cloneDto(status) : null;
                }
            }
        }
    });
};
