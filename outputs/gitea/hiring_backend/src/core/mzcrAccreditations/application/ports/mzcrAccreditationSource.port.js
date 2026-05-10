/**
 * @typedef {Object} MzcrAccreditationSourcePort
 * @property {(payload: { catalog: string }) => Promise<Object[]>} fetchCatalog
 * @property {(payload: { category: string, targetIco: string }) => Promise<Object[]>} fetchAccreditations
 * @property {(payload: { workplaceId: number }) => Promise<Object|null>} fetchWorkplace
 */

module.exports = Object.freeze({
    portName: 'MzcrAccreditationSourcePort',
    methods: Object.freeze([
        'fetchCatalog',
        'fetchAccreditations',
        'fetchWorkplace'
    ])
});
