/**
 * @typedef {Object} CvIntentPort
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} queueApplicantAttachmentPublishIntent
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} queueApplicantReanalysisPublishIntent
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} queueJobSeekerCvPublishIntent
 * @property {(payload: Object, options?: Object) => Promise<Object|null>} queueJobEmbeddingRequestIntent
 */

module.exports = Object.freeze({
    portName: 'CvIntentPort',
    methods: Object.freeze([
        'queueApplicantAttachmentPublishIntent',
        'queueApplicantReanalysisPublishIntent',
        'queueJobSeekerCvPublishIntent',
        'queueJobEmbeddingRequestIntent'
    ])
});
