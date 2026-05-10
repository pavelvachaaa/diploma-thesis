/**
 * @typedef {Object} JobSeekersFileGcPort
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} enqueueDelete
 */

module.exports = Object.freeze({
    portName: 'JobSeekersFileGcPort',
    methods: Object.freeze([
        'enqueueDelete'
    ])
});
