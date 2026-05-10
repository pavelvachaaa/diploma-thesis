const { createContractPort } = require('@shared/contracts/runtime');
const { nullable, objectShape, optionsObject, optional, plainObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekers/application/ports/jobSeekersFileGc.port');

module.exports = ({ jobSeekersFileGcAdapter }) => {
    const service = requireServiceMethods(jobSeekersFileGcAdapter, 'jobSeekersFileGcAdapter', portDefinition.portName, portDefinition.methods);

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            enqueueDelete: {
                input: tuple(plainObject, optional(optionsObject)),
                output: nullable(objectShape({}, { allowExtra: true })),
                impl: async (payload, options = {}) => {
                    const result = await service.enqueueDelete(cloneDto(payload), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
