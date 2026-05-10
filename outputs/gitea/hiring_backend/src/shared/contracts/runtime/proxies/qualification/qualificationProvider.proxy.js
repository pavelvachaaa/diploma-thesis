const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    nonEmptyString,
    nullable,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/qualification/application/ports/qualificationProvider.port');

const qualificationItemDto = objectShape({}, { allowExtra: true });
const providerResultDto = objectShape({
    worker: nullable(objectShape({}, { allowExtra: true })),
    workers: arrayOf(objectShape({}, { allowExtra: true })),
    qualifications: objectShape({
        odborneZpusobilosti: arrayOf(qualificationItemDto),
        specializovaneZpusobilosti: arrayOf(qualificationItemDto),
        zvlastniOdborneZpusobilosti: arrayOf(qualificationItemDto)
    }, { allowExtra: true }),
    counts: objectShape({}, { allowExtra: true }),
    upstream: objectShape({}, { allowExtra: true })
}, { allowExtra: true });

module.exports = ({ qualificationProviderAdapter }) => {
    const service = requireServiceMethods(
        qualificationProviderAdapter,
        'qualificationProviderAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            lookupByWorkerNumber: {
                input: tuple(objectShape({
                    workerNumber: nonEmptyString('worker number')
                })),
                output: providerResultDto,
                impl: async ({ workerNumber }) => cloneDto(
                    await service.lookupByWorkerNumber({ workerNumber })
                )
            },
            lookupByBirthNumber: {
                input: tuple(objectShape({
                    birthNumber: nonEmptyString('birth number')
                })),
                output: providerResultDto,
                impl: async ({ birthNumber }) => cloneDto(
                    await service.lookupByBirthNumber({ birthNumber })
                )
            }
        }
    });
};
