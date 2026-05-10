/**
 * @typedef {Object} AuthPasswordHasherPort
 * @property {(plain: string, hash: string) => Promise<boolean>} compare
 * @property {(plain: string) => Promise<string>} hash
 */

module.exports = Object.freeze({
    portName: 'AuthPasswordHasherPort',
    methods: Object.freeze([
        'compare',
        'hash'
    ])
});
