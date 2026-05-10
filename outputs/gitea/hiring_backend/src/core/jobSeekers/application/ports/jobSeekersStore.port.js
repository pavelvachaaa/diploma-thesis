/**
 * @typedef {Object} JobSeekersStorePort
 * @property {(work: (client: Object) => Promise<*>) => Promise<*>} withTransaction
 * @property {(data: Object, options?: Object) => Promise<Object>} createJobSeeker
 * @property {(jobSeekerId: string, organizationIds: string[], options?: Object) => Promise<Object[]>} createJobSeekerLocations
 * @property {(jobSeekerId: string, fileIds: string[], options?: Object) => Promise<Object[]>} createJobSeekerAttachments
 * @property {(options?: Object) => Promise<Object>} getAllJobSeekers
 * @property {(id: string, options?: Object) => Promise<Object|null>} getJobSeekerById
 * @property {(id: string, options?: Object) => Promise<Object|null>} getDeleteMetadata
 * @property {(id: string, options?: Object) => Promise<Object|null>} deleteJobSeeker
 * @property {(organizationId: string, options?: Object) => Promise<Object[]>} getJobSeekersByOrganization
 * @property {(jobSeekerId: string, options?: Object) => Promise<Object[]>} getAttachmentsByJobSeekerId
 * @property {(jobSeekerId: string, attachmentId: string, options?: Object) => Promise<Object|null>} getAttachmentById
 */

module.exports = Object.freeze({
    portName: 'JobSeekersStorePort',
    methods: Object.freeze([
        'createJobSeeker',
        'createJobSeekerLocations',
        'createJobSeekerAttachments',
        'getAllJobSeekers',
        'getJobSeekerById',
        'getDeleteMetadata',
        'deleteJobSeeker',
        'getJobSeekersByOrganization',
        'getAttachmentsByJobSeekerId',
        'getAttachmentById',
        'withTransaction'
    ])
});
