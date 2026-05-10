/**
 * Inbound facade port for job matching consumers.
 *
 * @typedef {Object} JobSeekerCvAnalysisQueryPort
 * @property {(embeddingVector: number[], options?: Object) => Promise<Object[]>} findMatchingJobSeekers
 */

module.exports = Object.freeze({
    portName: 'JobSeekerCvAnalysisQueryPort',
    methods: Object.freeze(['findMatchingJobSeekers'])
});
