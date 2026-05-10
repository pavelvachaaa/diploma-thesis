/**
 * @typedef {Object} CvPendingAnalysisStorePort
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} createApplicantPendingAnalysis
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} createJobSeekerPendingAnalysis
 */

module.exports = Object.freeze({
    portName: 'CvPendingAnalysisStorePort',
    methods: Object.freeze([
        'createApplicantPendingAnalysis',
        'createJobSeekerPendingAnalysis'
    ])
});
