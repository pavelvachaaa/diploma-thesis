/**
 * @typedef {Object} CvAnalysisUnitOfWorkPort
 * @property {(work: Function, options?: Object) => Promise<*>} runInTransaction
 */

module.exports = Object.freeze({
    portName: 'CvAnalysisUnitOfWorkPort',
    methods: Object.freeze(['runInTransaction'])
});
