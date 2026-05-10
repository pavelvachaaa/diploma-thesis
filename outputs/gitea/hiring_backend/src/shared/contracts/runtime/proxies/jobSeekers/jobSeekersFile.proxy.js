const { createContractPort } = require('@shared/contracts/runtime');
const { entityId, nullable, objectShape, optionsObject, optional, plainObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekers/application/ports/jobSeekersFile.port');

module.exports = ({ jobSeekersFileAdapter }) => {
    const service = requireServiceMethods(jobSeekersFileAdapter, 'jobSeekersFileAdapter', portDefinition.portName, portDefinition.methods);

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            createFileRecord: {
                input: tuple(plainObject, optional(optionsObject)),
                output: objectShape({}, { allowExtra: true }),
                impl: async (payload, options = {}) => cloneDto(await service.createFileRecord(cloneDto(payload), cloneOptions(options)))
            },
            markRetained: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullable(objectShape({}, { allowExtra: true })),
                impl: async (fileId, options = {}) => {
                    const result = await service.markRetained(fileId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
