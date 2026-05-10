const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nonEmptyString,
    nullable,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    tuple,
    unknown
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/roleAssignments/application/ports/roleAssignmentsStore.port');

const dto = nullable(objectShape({}, { allowExtra: true }));
const requiredDto = objectShape({}, { allowExtra: true });
const dtoArray = arrayOf(objectShape({}, { allowExtra: true }));
const expiresAtValue = optional(nullable(unknown()));

module.exports = ({ roleAssignmentsStoreAdapter }) => {
    const service = requireServiceMethods(
        roleAssignmentsStoreAdapter,
        'roleAssignmentsStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getUserRole: {
                input: tuple(entityId, optional(optionsObject)),
                output: dto,
                impl: async (userId, options = {}) => {
                    const result = await service.getUserRole(userId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            updateUserRole: {
                input: tuple(entityId, nonEmptyString('role name'), optional(optionsObject)),
                output: requiredDto,
                impl: async (userId, roleName, options = {}) => cloneDto(
                    await service.updateUserRole(userId, roleName, cloneOptions(options))
                )
            },
            getUserOrganizationMemberships: {
                input: tuple(entityId, optional(optionsObject)),
                output: dtoArray,
                impl: async (userId, options = {}) => cloneDtoArray(
                    await service.getUserOrganizationMemberships(userId, cloneOptions(options))
                )
            },
            createOrganizationMembership: {
                input: tuple(plainObject, optional(optionsObject)),
                output: requiredDto,
                impl: async (data, options = {}) => cloneDto(
                    await service.createOrganizationMembership(cloneDto(data), cloneOptions(options))
                )
            },
            updateOrganizationMembershipExpiration: {
                input: tuple(entityId, expiresAtValue, entityId, optional(optionsObject)),
                output: requiredDto,
                impl: async (membershipId, expiresAt, updatedBy, options = {}) => cloneDto(
                    await service.updateOrganizationMembershipExpiration(
                        membershipId,
                        expiresAt,
                        updatedBy,
                        cloneOptions(options)
                    )
                )
            },
            deleteOrganizationMembership: {
                input: tuple(entityId, optional(optionsObject)),
                output: requiredDto,
                impl: async (membershipId, options = {}) => cloneDto(
                    await service.deleteOrganizationMembership(membershipId, cloneOptions(options))
                )
            },
            getOrganizationMembershipById: {
                input: tuple(entityId, optional(optionsObject)),
                output: dto,
                impl: async (membershipId, options = {}) => {
                    const result = await service.getOrganizationMembershipById(membershipId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
