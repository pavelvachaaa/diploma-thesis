/**
 * @typedef {Object} EmailPreferencesLookupPort
 * @property {(userId: string) => Promise<Object>} getPreferences
 * @property {(userId: string, typeCode: string) => Promise<Object>} getTypePreferences
 */

module.exports = Object.freeze({
    portName: 'EmailPreferencesLookupPort',
    methods: Object.freeze([
        'getPreferences',
        'getTypePreferences'
    ])
});
