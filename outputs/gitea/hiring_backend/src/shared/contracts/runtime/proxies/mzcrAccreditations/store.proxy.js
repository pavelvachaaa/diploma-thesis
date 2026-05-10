const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    nonEmptyString,
    objectShape,
    tuple,
    unknown
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/mzcrAccreditations/application/ports/mzcrAccreditationStore.port');

const plainObject = objectShape({}, { allowExtra: true });

module.exports = ({ mzcrAccreditationStoreAdapter }) => {
    const service = requireServiceMethods(
        mzcrAccreditationStoreAdapter,
        'mzcrAccreditationStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            markExpiredRunningRuns: {
                input: tuple(objectShape({
                    staleStartedBefore: unknown(),
                    failedAt: unknown()
                })),
                output: plainObject,
                impl: async (payload) => cloneDto(await service.markExpiredRunningRuns(cloneDto(payload)))
            },
            startSyncRun: {
                input: tuple(objectShape({
                    startedAt: unknown()
                })),
                output: plainObject,
                impl: async (payload) => cloneDto(await service.startSyncRun(cloneDto(payload)))
            },
            findOrganizationsBySeatLocations: {
                input: tuple(objectShape({
                    seatLocations: arrayOf(nonEmptyString('seat location'))
                })),
                output: arrayOf(plainObject),
                impl: async (payload) => cloneDtoArray(
                    await service.findOrganizationsBySeatLocations(cloneDto(payload))
                )
            },
            listAccreditations: {
                input: tuple(plainObject),
                output: plainObject,
                impl: async (payload) => cloneDto(await service.listAccreditations(cloneDto(payload)))
            },
            getAccreditationMeta: {
                input: tuple(plainObject),
                output: plainObject,
                impl: async (payload) => cloneDto(await service.getAccreditationMeta(cloneDto(payload)))
            },
            commitSuccessfulSync: {
                input: tuple(plainObject),
                output: plainObject,
                impl: async (payload) => cloneDto(await service.commitSuccessfulSync(cloneDto(payload)))
            },
            failSyncRun: {
                input: tuple(objectShape({
                    runId: nonEmptyString('sync run id'),
                    failedAt: unknown(),
                    errorMessage: nonEmptyString('error message')
                })),
                impl: async (payload) => service.failSyncRun(cloneDto(payload))
            },
            getSyncState: {
                input: tuple(),
                output: unknown(),
                impl: async () => cloneDto(await service.getSyncState())
            }
        }
    });
};
