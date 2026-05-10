const { createContractPort } = require('@shared/contracts/runtime');
const { booleanFlag, nonEmptyString, tuple } = require('@shared/contracts/runtime/common');
const { requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/auth/application/ports/authPasswordHasher.port');

const plainPassword = nonEmptyString('password');
const passwordHash = nonEmptyString('password hash');

module.exports = ({ authPasswordHasherAdapter }) => {
    const service = requireServiceMethods(
        authPasswordHasherAdapter,
        'authPasswordHasherAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            compare: {
                input: tuple(plainPassword, passwordHash),
                output: booleanFlag(),
                impl: (plain, hash) => service.compare(plain, hash)
            },
            hash: {
                input: tuple(plainPassword),
                output: passwordHash,
                impl: (plain) => service.hash(plain)
            }
        }
    });
};
