/**
 * @typedef {Object} MzcrAccreditationStorePort
 * @property {(payload: { staleStartedBefore: Date, failedAt: Date }) => Promise<{ failed: number }>} markExpiredRunningRuns
 * @property {(payload: { startedAt: Date }) => Promise<{ id: string, status: string, startedAt: string|Date }>} startSyncRun
 * @property {(payload: { seatLocations: string[] }) => Promise<Array<{ id: string, seatLocation: string }>>} findOrganizationsBySeatLocations
 * @property {(payload: { page: number, limit: number, organizationId?: string|null, validity: string, specialtyType?: string|null, q?: string|null, actorUserId?: string|null }) => Promise<Object>} listAccreditations
 * @property {(payload: { actorUserId?: string|null }) => Promise<{ specialtyTypes: Array<{ value: string, label: string }> }>} getAccreditationMeta
 * @property {(payload: { runId: string, syncedAt: Date, catalogs: Object, accreditations: Object[], summary: Object }) => Promise<Object>} commitSuccessfulSync
 * @property {(payload: { runId: string, failedAt: Date, errorMessage: string }) => Promise<void>} failSyncRun
 * @property {() => Promise<Object|null>} getSyncState
 */

module.exports = Object.freeze({
    portName: 'MzcrAccreditationStorePort',
    methods: Object.freeze([
        'markExpiredRunningRuns',
        'startSyncRun',
        'findOrganizationsBySeatLocations',
        'listAccreditations',
        'getAccreditationMeta',
        'commitSuccessfulSync',
        'failSyncRun',
        'getSyncState'
    ])
});
