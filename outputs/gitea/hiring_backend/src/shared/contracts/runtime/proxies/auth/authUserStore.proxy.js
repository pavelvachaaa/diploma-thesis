const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    nonEmptyString,
    nullable,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    stringArray,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneDtoArray, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/auth/application/ports/authUserStore.port');

const dto = objectShape({}, { allowExtra: true });
const nullableDto = nullable(dto);
const oauthCreateResult = objectShape({}, { allowExtra: true });

module.exports = ({ authUserStoreAdapter }) => {
    const service = requireServiceMethods(
        authUserStoreAdapter,
        'authUserStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            findByEmailAndProvider: {
                input: tuple(optional(nonEmptyString('email')), optional(optionsObject)),
                output: nullableDto,
                impl: async (email, options = {}) => {
                    const result = await service.findByEmailAndProvider(email, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getUserRoles: {
                input: tuple(entityId, optional(optionsObject)),
                output: stringArray,
                impl: async (userId, options = {}) => cloneDtoArray(await service.getUserRoles(userId, cloneOptions(options)))
            },
            createOAuthUser: {
                input: tuple(plainObject, optional(optionsObject)),
                output: oauthCreateResult,
                impl: async (userData, options = {}) => cloneDto(await service.createOAuthUser(cloneDto(userData), cloneOptions(options)))
            },
            updateUserFromOAuth: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: nullableDto,
                impl: async (userId, oauthData, options = {}) => {
                    const result = await service.updateUserFromOAuth(userId, cloneDto(oauthData), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            findById: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (userId, options = {}) => {
                    const result = await service.findById(userId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            updateUserPassword: {
                input: tuple(entityId, nonEmptyString('password hash'), optional(optionsObject)),
                output: nullableDto,
                impl: async (userId, passwordHash, options = {}) => {
                    const result = await service.updateUserPassword(userId, passwordHash, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getUserWithRoles: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullableDto,
                impl: async (userId, options = {}) => {
                    const result = await service.getUserWithRoles(userId, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
