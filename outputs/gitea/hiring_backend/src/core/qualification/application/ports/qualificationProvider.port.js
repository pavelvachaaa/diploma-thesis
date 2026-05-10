/**
 * @typedef {Object} QualificationProviderPort
 * @property {(payload: { workerNumber: string }) => Promise<{ worker: Object|null, workers: Object[], qualifications: Object, counts: Object, upstream: Object }>} lookupByWorkerNumber
 * @property {(payload: { birthNumber: string }) => Promise<{ worker: Object|null, workers: Object[], qualifications: Object, counts: Object, upstream: Object }>} lookupByBirthNumber
 */

module.exports = Object.freeze({
    portName: 'QualificationProviderPort',
    methods: Object.freeze([
        'lookupByWorkerNumber',
        'lookupByBirthNumber'
    ])
});
