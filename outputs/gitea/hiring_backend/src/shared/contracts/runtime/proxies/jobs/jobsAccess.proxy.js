const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    optionsObject,
    plainObject,
    nullable,
    optional,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobs/application/ports/jobsAccess.port');

const jobDto = nullable(plainObject);

module.exports = ({ jobsApplication }) => {
    const service = requireServiceMethods(
        jobsApplication,
        'jobsApplication',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getJobById: {
                input: tuple(entityId, optional(optionsObject)),
                output: jobDto,
                impl: async (jobId, options = {}) => {
                    const job = await service.getJobById(jobId, cloneOptions(options));
                    return job ? cloneDto(job) : null;
                }
            },
            getJobDetail: {
                input: tuple(entityId),
                output: jobDto,
                impl: async (jobId) => {
                    const job = await service.getJobDetail(jobId);
                    return job ? cloneDto(job) : null;
                }
            },
            getJobDetailAdmin: {
                input: tuple(entityId, optional(optionsObject)),
                output: jobDto,
                impl: async (jobId, options = {}) => {
                    const job = await service.getJobDetailAdmin(jobId, cloneOptions(options));
                    return job ? cloneDto(job) : null;
                }
            }
        }
    });
};
