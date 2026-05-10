const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nonEmptyString,
    nullable,
    objectShape,
    optionsObject,
    plainObject,
    stringArray,
    tuple,
    optional
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/internalUsers/application/ports/internalUsersStore.port');

const userDto = nullable(objectShape({}, { allowExtra: true }));
const organizationDto = nullable(objectShape({}, { allowExtra: true }));
const userArrayDto = arrayOf(objectShape({}, { allowExtra: true }));
const organizationArrayDto = arrayOf(objectShape({}, { allowExtra: true }));

module.exports = ({ internalUsersStoreAdapter }) => {
    const service = requireServiceMethods(
        internalUsersStoreAdapter,
        'internalUsersStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            findLocalUserByEmail: {
                input: tuple(nonEmptyString('email'), optional(optionsObject)),
                output: userDto,
                impl: async (email, options = {}) => {
                    const result = await service.findLocalUserByEmail(email, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            findLocalUsersByEmails: {
                input: tuple(stringArray, optional(optionsObject)),
                output: userArrayDto,
                impl: async (emails, options = {}) => cloneDtoArray(
                    await service.findLocalUsersByEmails([...emails], cloneOptions(options))
                )
            },
            getOrganizationBySeatLocation: {
                input: tuple(nonEmptyString('seat location'), optional(optionsObject)),
                output: organizationDto,
                impl: async (seatLocation, options = {}) => {
                    const result = await service.getOrganizationBySeatLocation(seatLocation, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getOrganizationsBySeatLocations: {
                input: tuple(stringArray, optional(optionsObject)),
                output: organizationArrayDto,
                impl: async (seatLocations, options = {}) => cloneDtoArray(
                    await service.getOrganizationsBySeatLocations([...seatLocations], cloneOptions(options))
                )
            },
            createLocalInternalUser: {
                input: tuple(plainObject, optional(optionsObject)),
                output: userDto,
                impl: async (userData, options = {}) => {
                    const result = await service.createLocalInternalUser(cloneDto(userData), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            updateLocalUserProfile: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: userDto,
                impl: async (userId, profile, options = {}) => {
                    const result = await service.updateLocalUserProfile(userId, cloneDto(profile), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
