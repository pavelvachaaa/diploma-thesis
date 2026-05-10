const { createContractPort } = require('@shared/contracts/runtime');
const {
    nonEmptyString,
    nullable,
    objectShape,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/auth/application/ports/authIdentityProvider.port');

const dto = objectShape({}, { allowExtra: true });
const nullableDto = nullable(dto);

module.exports = ({ authIdentityProviderAdapter }) => {
    const service = requireServiceMethods(
        authIdentityProviderAdapter,
        'authIdentityProviderAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            decodeIdTokenClaims: {
                input: tuple(nonEmptyString('id token')),
                output: nullableDto,
                impl: (idToken) => {
                    const result = service.decodeIdTokenClaims(idToken);
                    return result ? cloneDto(result) : null;
                }
            },
            exchangeAuthorizationCode: {
                input: tuple(plainObject),
                output: dto,
                impl: async (payload) => cloneDto(await service.exchangeAuthorizationCode(cloneDto(payload)))
            },
            fetchUcpUserInfo: {
                input: tuple(plainObject),
                output: dto,
                impl: async (payload) => cloneDto(await service.fetchUcpUserInfo(cloneDto(payload)))
            },
            verifyCiscoToken: {
                input: tuple(plainObject),
                output: dto,
                impl: async (payload) => cloneDto(await service.verifyCiscoToken(cloneDto(payload)))
            }
        }
    });
};
