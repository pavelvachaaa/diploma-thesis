const { createContractPort } = require('@shared/contracts/runtime');
const { entityId, nullable, objectShape, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/jobSeekers/application/ports/jobSeekersOrganizationLookup.port');

module.exports = ({ jobSeekersOrganizationLookupAdapter }) => {
    const service = requireServiceMethods(jobSeekersOrganizationLookupAdapter, 'jobSeekersOrganizationLookupAdapter', portDefinition.portName, portDefinition.methods);

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getById: {
                input: tuple(entityId),
                output: nullable(objectShape({}, { allowExtra: true })),
                impl: async (id) => {
                    const result = await service.getById(id);
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
