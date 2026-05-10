/**
 * @typedef {Object} CvAnalysisStorePort
 * @property {(applicantId: string, options?: Object) => Promise<Object|null>} getByApplicantId
 * @property {(attachmentId: string, options?: Object) => Promise<Object|null>} getByAttachmentId
 * @property {(skills: string[], options?: Object) => Promise<Object[]>} searchBySkills
 * @property {(options?: Object) => Promise<Object>} getStats
 * @property {(applicantId: string, options?: Object) => Promise<Object|null>} getApplicantAttachmentInfo
 * @property {(data: Object, options?: Object) => Promise<Object>} createOrUpdatePending
 * @property {(applicantId: string, options?: Object) => Promise<Object|null>} getStatusByApplicantId
 * @property {(result: Object, options?: Object) => Promise<Object|null>} saveAnalysisResult
 * @property {(result: Object, options?: Object) => Promise<Object|null>} saveAnalysisFailure
 */

module.exports = Object.freeze({
    portName: 'CvAnalysisStorePort',
    methods: Object.freeze([
        'getByApplicantId',
        'getByAttachmentId',
        'searchBySkills',
        'getStats',
        'getApplicantAttachmentInfo',
        'createOrUpdatePending',
        'getStatusByApplicantId',
        'saveAnalysisResult',
        'saveAnalysisFailure'
    ])
});
