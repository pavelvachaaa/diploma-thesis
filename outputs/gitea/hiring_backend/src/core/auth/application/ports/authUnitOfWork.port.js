/**
 * @typedef {Object} AuthUnitOfWorkPort
 * @property {(work: (client: Object) => Promise<*>, options?: Object) => Promise<*>} runInTransaction
 */

module.exports = Object.freeze({
    portName: 'AuthUnitOfWorkPort',
    methods: Object.freeze([
        'runInTransaction'
    ])
});
