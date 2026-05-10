const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    optionsObject,
    objectShape,
    arrayOf,
    optional,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const jobPermissionSyncDto = objectShape({}, { allowExtra: true });
const jobAssignmentDto = objectShape({
    userId: entityId
}, { allowExtra: true });

const toJobAssignments = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((entry) => {
        if (typeof entry === 'string') {
            return { userId: entry };
        }

        return cloneDto(entry);
    });
};

module.exports = ({ rebacService }) => {
    const {
        syncJobPostingPermissions,
        replaceDirectJobAssignments,
        getDirectJobAssignments
    } = requireServiceMethods(rebacService, 'rebacService', 'JobPermissionPort', [
        'syncJobPostingPermissions',
        'replaceDirectJobAssignments',
        'getDirectJobAssignments'
    ]);

    return createContractPort({
        portName: 'JobPermissionPort',
        methods: {
            syncJobPostingPermissions: {
                input: tuple(entityId, optional(optionsObject)),
                output: jobPermissionSyncDto,
                impl: async (jobId, txOptions = {}) =>
                    cloneDto(await syncJobPostingPermissions(jobId, cloneOptions(txOptions)))
            },
            replaceDirectJobAssignments: {
                input: tuple(entityId, arrayOf(entityId), optional(optionsObject)),
                output: arrayOf(jobAssignmentDto),
                impl: async (jobId, userIds = [], txOptions = {}) =>
                    toJobAssignments(await replaceDirectJobAssignments(jobId, [...userIds], cloneOptions(txOptions)))
            },
            getDirectJobAssignments: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(jobAssignmentDto),
                impl: async (jobId, txOptions = {}) =>
                    toJobAssignments(await getDirectJobAssignments(jobId, cloneOptions(txOptions)))
            }
        }
    });
};
