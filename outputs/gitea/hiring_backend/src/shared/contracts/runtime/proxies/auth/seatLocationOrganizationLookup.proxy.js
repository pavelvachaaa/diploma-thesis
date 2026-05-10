const { createContractPort } = require('@shared/contracts/runtime');
const {
    nonEmptyString,
    optionsObject,
    objectShape,
    tuple,
    optional,
    nullable,
    entityId
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/auth/application/ports/seatLocationOrganizationLookup.port');

const organizationDto = nullable(objectShape({
    id: entityId,
    name: optional(nonEmptyString('organization name')),
    seat_location: optional(nonEmptyString('seat location'))
}, { allowExtra: true }));

module.exports = ({ internalUsersApplication }) => {
    const service = requireServiceMethods(
        internalUsersApplication,
        'internalUsersApplication',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getOrganizationBySeatLocation: {
                input: tuple(nonEmptyString('seat location'), optional(optionsObject)),
                output: organizationDto,
                impl: async (seatLocation, options = {}) => {
                    const result = await service.getOrganizationBySeatLocation(seatLocation, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
