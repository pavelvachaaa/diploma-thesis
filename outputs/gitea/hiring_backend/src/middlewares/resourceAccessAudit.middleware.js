const logger = require('@platform/logger');

module.exports = (resourceType) => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        const startTime = Date.now();

        res.json = function jsonWithAudit(data) {
            const duration = Date.now() - startTime;

            logger.info('[RESOURCE-AUDIT]', {
                timestamp: new Date().toISOString(),
                userId: req.user?.id,
                userEmail: req.user?.email,
                userOrgId: req.user?.organization_id,
                roles: req.user?.roles,
                isSuperAdmin: Array.isArray(req.user?.roles) && req.user.roles.includes('super_admin'),
                method: req.method,
                path: req.path,
                resourceType,
                resourceId: req.params.id,
                statusCode: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            return originalJson(data);
        };

        next();
    };
};
