const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const ALLOWED_TYPES = Object.freeze(['welcome', 'interview', 'rejection', 'custom', 'notification']);

const create = (data = {}) => {
    const name = String(data.name || '').trim();
    if (!name) throw new ApplicationError('name is required', { code: ErrorCode.VALIDATION_ERROR });

    const type = String(data.type || '').trim();
    if (!type) throw new ApplicationError('type is required', { code: ErrorCode.VALIDATION_ERROR });

    const body = String(data.body || '').trim();
    if (!body) throw new ApplicationError('body is required', { code: ErrorCode.VALIDATION_ERROR });

    const organizationId = String(data.organizationId || data.organization_id || '').trim();
    if (!organizationId) throw new ApplicationError('organizationId is required', { code: ErrorCode.VALIDATION_ERROR });

    const subject = data.subject ? String(data.subject).trim() : null;
    const createdBy = data.createdBy || data.created_by || null;

    return Object.freeze({ name, type, body, organizationId, subject, createdBy });
};

module.exports = { create, ALLOWED_TYPES };
