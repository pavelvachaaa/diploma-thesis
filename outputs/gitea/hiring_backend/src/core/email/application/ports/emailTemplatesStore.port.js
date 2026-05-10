/**
 * @typedef {Object} EmailTemplatesStorePort
 * @property {(query: Object, options?: Object) => Promise<Object[]>} getAll
 * @property {(id: string, options?: Object) => Promise<Object|null>} getById
 * @property {(data: Object, options?: Object) => Promise<Object|null>} create
 * @property {(id: string, data: Object, options?: Object) => Promise<Object|null>} update
 * @property {(id: string, options?: Object) => Promise<Object|null>} remove
 */

module.exports = Object.freeze({
    portName: 'EmailTemplatesStorePort',
    methods: Object.freeze([
        'getAll',
        'getById',
        'create',
        'update',
        'remove'
    ])
});
