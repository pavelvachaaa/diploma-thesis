/**
 * @typedef {Object} JobSeekerCvAnalysisUnitOfWorkPort
 * @property {(work: Function, options?: Object) => Promise<*>} runInTransaction
 */

module.exports = Object.freeze({
    portName: 'JobSeekerCvAnalysisUnitOfWorkPort',
    methods: Object.freeze(['runInTransaction'])
});
