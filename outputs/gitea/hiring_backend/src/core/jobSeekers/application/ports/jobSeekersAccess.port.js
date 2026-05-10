/**
 * Inbound facade port — exposes a narrow surface of the jobSeekers application
 * to other bounded contexts (e.g. applicants module pulling a candidate's CV
 * + attachments). The implementer is the jobSeekers application itself.
 *
 * through explicit *Port tokens, not direct *Service injection. Other modules
 * inject `jobSeekersAccessPort`, never `jobSeekersService` directly.
 *
 * @typedef {Object} JobSeekersAccessPort
 * @property {(id: string, options?: Object) => Promise<Object|null>} getJobSeekerById
 * @property {(jobSeekerId: string, options?: Object) => Promise<Object[]>} getAttachmentsByJobSeekerId
 */

module.exports = Object.freeze({
    portName: 'JobSeekersAccessPort',
    methods: Object.freeze([
        'getJobSeekerById',
        'getAttachmentsByJobSeekerId'
    ])
});
