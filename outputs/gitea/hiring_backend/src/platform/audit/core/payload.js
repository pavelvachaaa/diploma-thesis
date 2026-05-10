const { getRequestContext } = require('@shared/requestContext');
const {
    safeJson,
    sanitizeForAudit,
    enforceStateSizeLimit,
    shouldCaptureState
} = require('./sanitize');

module.exports = ({ event = {} }) => {
    const context = getRequestContext();
    const status = event.status ?? 'success';
    const resourceType = event.resourceType ?? null;
    const includeState = shouldCaptureState(event, resourceType, status);
    const beforeState = includeState
        ? enforceStateSizeLimit(sanitizeForAudit(safeJson(event.beforeState, null)))
        : null;
    const afterState = includeState
        ? enforceStateSizeLimit(sanitizeForAudit(safeJson(event.afterState, null)))
        : null;

    return {
        request_id: event.requestId ?? context.requestId ?? null,
        source: event.source ?? context.source ?? 'api',
        category: event.category ?? 'system',
        action: event.action ?? 'unknown',
        status,
        actor_user_id: event.actorUserId ?? context.userId ?? null,
        actor_email: event.actorEmail ?? context.userEmail ?? null,
        actor_roles: event.actorRoles ?? context.userRoles ?? null,
        organization_id: event.organizationId ?? context.organizationId ?? null,
        method: event.method ?? context.method ?? null,
        path: event.path ?? context.path ?? null,
        resource_type: resourceType,
        resource_id: event.resourceId ?? null,
        target: event.target ?? null,
        status_code: event.statusCode ?? null,
        ip: event.ip ?? context.ip ?? null,
        user_agent: event.userAgent ?? context.userAgent ?? null,
        metadata: sanitizeForAudit(safeJson(event.metadata, {})),
        before_state: beforeState,
        after_state: afterState,
        error_message: event.errorMessage ?? null
    };
};
