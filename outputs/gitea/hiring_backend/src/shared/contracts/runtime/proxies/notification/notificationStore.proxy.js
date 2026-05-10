const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    numberRange,
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
const portDefinition = require('@core/notification/application/ports/notificationStore.port');

const dto = objectShape({}, { allowExtra: true });
const dtoArray = arrayOf(dto);

module.exports = ({ notificationStoreAdapter }) => {
    const service = requireServiceMethods(
        notificationStoreAdapter,
        'notificationStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            insertNotification: {
                input: tuple(plainObject, optional(optionsObject)),
                output: dto,
                impl: async (data, options = {}) => cloneDto(
                    await service.insertNotification(cloneDto(data), cloneOptions(options))
                )
            },
            listByUser: {
                input: tuple(plainObject, optional(optionsObject)),
                output: dtoArray,
                impl: async (query, options = {}) => cloneDtoArray(
                    await service.listByUser(cloneDto(query), cloneOptions(options))
                )
            },
            unreadCount: {
                input: tuple(entityId, optional(optionsObject)),
                output: numberRange({ min: 0 }),
                impl: (userId, options = {}) => service.unreadCount(userId, cloneOptions(options))
            },
            markRead: {
                input: tuple(entityId, entityId, optional(optionsObject)),
                output: unknown(),
                impl: (id, userId, options = {}) => service.markRead(id, userId, cloneOptions(options))
            },
            markAllRead: {
                input: tuple(entityId, optional(optionsObject)),
                output: numberRange({ min: 0 }),
                impl: (userId, options = {}) => service.markAllRead(userId, cloneOptions(options))
            },
            getUsersByRoleInOrganization: {
                input: tuple(entityId, unknown(), optional(optionsObject)),
                output: arrayOf(entityId),
                impl: async (organizationId, roleName, options = {}) => cloneDtoArray(
                    await service.getUsersByRoleInOrganization(
                        organizationId,
                        cloneDto(roleName),
                        cloneOptions(options)
                    )
                )
            },
            getPreferences: {
                input: tuple(entityId, optional(optionsObject)),
                output: dto,
                impl: async (userId, options = {}) => cloneDto(
                    await service.getPreferences(userId, cloneOptions(options))
                )
            },
            updatePreferences: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: dto,
                impl: async (userId, preferences, options = {}) => cloneDto(
                    await service.updatePreferences(userId, cloneDto(preferences), cloneOptions(options))
                )
            },
            getTypePreferences: {
                input: tuple(entityId, entityId, optional(optionsObject)),
                output: dto,
                impl: async (userId, typeCode, options = {}) => cloneDto(
                    await service.getTypePreferences(userId, typeCode, cloneOptions(options))
                )
            },
            updateTypePreferences: {
                input: tuple(entityId, entityId, plainObject, optional(optionsObject)),
                output: dto,
                impl: async (userId, typeCode, preferences, options = {}) => cloneDto(
                    await service.updateTypePreferences(userId, typeCode, cloneDto(preferences), cloneOptions(options))
                )
            }
        }
    });
};
