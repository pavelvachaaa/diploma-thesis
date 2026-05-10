const { AsyncLocalStorage } = require('node:async_hooks');
const crypto = require('node:crypto');

const requestContextStorage = new AsyncLocalStorage();

const toArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [value];
};

const startRequestContext = (req, res, next) => {
    const requestIdHeader = req.get('x-request-id');
    const requestId = requestIdHeader && requestIdHeader.trim()
        ? requestIdHeader.trim()
        : crypto.randomUUID();

    res.setHeader('x-request-id', requestId);

    const initialContext = {
        requestId,
        requestStartAt: Date.now(),
        source: 'api',
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent') || null,
        userId: null,
        userEmail: null,
        userRoles: [],
        organizationId: null,
        organizationIds: []
    };

    requestContextStorage.run(initialContext, next);
};

const getRequestContext = () => {
    return requestContextStorage.getStore() || {};
};

const updateRequestContext = (patch = {}) => {
    const context = requestContextStorage.getStore();
    if (!context) return;
    Object.assign(context, patch);
};

const setRequestUserContext = (user) => {
    if (!user) return;

    updateRequestContext({
        userId: user.id || null,
        userEmail: user.email || null,
        userRoles: toArray(user.roles),
        organizationId: user.organization_id || null,
        organizationIds: toArray(user.organizations)
    });
};

const setRequestOrganizationContext = ({ organizationId = null, organizationIds = null } = {}) => {
    updateRequestContext({
        organizationId,
        organizationIds: Array.isArray(organizationIds) ? organizationIds : []
    });
};

module.exports = {
    startRequestContext,
    getRequestContext,
    updateRequestContext,
    setRequestUserContext,
    setRequestOrganizationContext
};
