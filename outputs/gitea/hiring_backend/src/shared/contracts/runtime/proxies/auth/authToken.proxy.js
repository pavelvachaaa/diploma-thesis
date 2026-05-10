const { createContractPort } = require('@shared/contracts/runtime');
const { nonEmptyString, objectShape, plainObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/auth/application/ports/authToken.port');

const jwtToken = nonEmptyString('auth token');

module.exports = ({ authTokenAdapter }) => {
    const service = requireServiceMethods(
        authTokenAdapter,
        'authTokenAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            signToken: {
                input: tuple(plainObject),
                output: jwtToken,
                impl: (payload) => service.signToken(cloneDto(payload))
            },
            verifyToken: {
                input: tuple(jwtToken),
                output: objectShape({}, { allowExtra: true }),
                impl: (token) => cloneDto(service.verifyToken(token))
            }
        }
    });
};
