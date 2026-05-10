/**
 * @typedef {Object} JobSeekerCvAnalysisStorePort
 * @property {(jobSeekerId: string, options?: Object) => Promise<Object|null>} getByJobSeekerId
 * @property {(jobSeekerId: string, options?: Object) => Promise<Object|null>} getStatusByJobSeekerId
 * @property {(data: Object, options?: Object) => Promise<Object>} createOrUpdatePending
 * @property {(skills: string[], options?: Object) => Promise<Object[]>} searchBySkills
 * @property {(embedding: number[], options?: Object) => Promise<Object[]>} findMatchingByEmbedding
 * @property {(options?: Object) => Promise<Object>} getStats
 * @property {(result: Object, options?: Object) => Promise<Object|null>} saveAnalysisResult
 * @property {(result: Object, options?: Object) => Promise<Object|null>} saveAnalysisFailure
 */

module.exports = Object.freeze({
    portName: 'JobSeekerCvAnalysisStorePort',
    methods: Object.freeze([
        'getByJobSeekerId',
        'getStatusByJobSeekerId',
        'createOrUpdatePending',
        'searchBySkills',
        'findMatchingByEmbedding',
        'getStats',
        'saveAnalysisResult',
        'saveAnalysisFailure'
    ])
});
