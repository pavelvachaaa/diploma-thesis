const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    objectShape,
    optional,
    optionsObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekers/application/ports/jobSeekersAccess.port');

const dto = objectShape({}, { allowExtra: true });

module.exports = ({ jobSeekersService }) => {
    const service = requireServiceMethods(
        jobSeekersService,
        'jobSeekersService',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getJobSeekerById: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullable(dto),
                impl: async (id, options = {}) => {
                    const result = await service.getJobSeekerById(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getAttachmentsByJobSeekerId: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(dto),
                impl: async (jobSeekerId, options = {}) => cloneDtoArray(
                    await service.getAttachmentsByJobSeekerId(jobSeekerId, cloneOptions(options))
                )
            }
        }
    });
};
