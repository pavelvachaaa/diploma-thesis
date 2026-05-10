/**
 * @typedef {Object} SeatLocationOrganizationLookupPort
 * @property {(seatLocation: string, options?: Object) => Promise<Object|null>} getOrganizationBySeatLocation
 */

module.exports = Object.freeze({
    portName: 'SeatLocationOrganizationLookupPort',
    methods: Object.freeze([
        'getOrganizationBySeatLocation'
    ])
});
