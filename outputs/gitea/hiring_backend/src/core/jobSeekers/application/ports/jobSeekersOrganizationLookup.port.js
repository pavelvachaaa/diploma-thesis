/**
 * @typedef {Object} JobSeekersOrganizationLookupPort
 * @property {(id: string) => Promise<Object|null>} getById
 */

module.exports = Object.freeze({
    portName: 'JobSeekersOrganizationLookupPort',
    methods: Object.freeze([
        'getById'
    ])
});
