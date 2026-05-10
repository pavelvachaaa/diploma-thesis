/**
 * @typedef {Object} CvPublishOutboxPort
 * @property {(intent: Object, options?: Object) => Promise<Object|null>} enqueue
 */

module.exports = Object.freeze({
    portName: 'CvPublishOutboxPort',
    methods: Object.freeze([
        'enqueue'
    ])
});
