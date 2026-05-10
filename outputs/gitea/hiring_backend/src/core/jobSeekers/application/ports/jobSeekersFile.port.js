/**
 * @typedef {Object} JobSeekersFilePort
 * @property {(payload: Object, options?: Object) => Promise<Object>} createFileRecord
 * @property {(fileId: string, options?: Object) => Promise<Object|null>} markRetained
 */

module.exports = Object.freeze({
    portName: 'JobSeekersFilePort',
    methods: Object.freeze([
        'createFileRecord',
        'markRetained'
    ])
});
