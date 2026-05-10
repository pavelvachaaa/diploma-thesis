const container = require('@/container');
const logger = require('@platform/logger');
const {
    SUPER_ADMIN_ROLE,
    isAuthorizedPersonOnly
} = require('@shared/auth/roles');
const { setRequestUserContext, setRequestOrganizationContext } = require('@shared/requestContext');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const authService = container.resolve('authService');
        const user = await authService.getUserFromAuthToken(token);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const activeRoles = Array.isArray(user.roles) ? user.roles : [];
        const organizations = Array.isArray(user.roleData)
            ? [...new Set(user.roleData.map((r) => r.organization_id).filter(Boolean))]
            : [];
        const fullName = user.fullName || user.full_name || `${user.name || ''} ${user.surname || ''}`.trim();

        req.user = {
            id: user.id,
            email: user.email,
            fullName,
            organization: user.organization_name, // Primary org name (for backward compat)
            organization_id: user.organization_id?.trim() || null,
            role: user.role || user.role_name || activeRoles[0] || 'user',
            roles: activeRoles.length > 0 ? activeRoles : ["user"], // Flat array (backward compat)
            organizations: organizations, // Array of all org IDs with active roles
            roleData: Array.isArray(user.roleData) ? user.roleData : []
        };

        setRequestUserContext(req.user);
        setRequestOrganizationContext({
            organizationId: req.user.organization_id || null,
            organizationIds: req.user.organizations || []
        });
        logger.debug('Authenticated request user context', {
            userId: req.user.id,
            roleCount: req.user.roles.length,
            organizationCount: req.user.organizations.length
        });
        next();
    } catch (err) {
        if (err.code === 'UNAUTHORIZED') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        next(err);
    }
};

const requireAuth = (roles = [], options = {}) => {
    return (req, res, next) => {
        // First run the auth middleware
        authMiddleware(req, res, (err) => {
            if (err) return next(err);

            // If no specific roles required, just check if user is authenticated
            if (roles.length === 0) {
                return next();
            }

            // Check if user has super_admin role (bypass other role checks)
            const isSuperAdmin = req.user.roles.includes(SUPER_ADMIN_ROLE);

            // Super admins have access to everything unless explicitly excluded
            if (isSuperAdmin && !options.excludeSuperAdmin) {
                return next();
            }
            // Check if user has required role
            const hasRequiredRole = roles.some(role => req.user.roles.includes(role));

            if (!hasRequiredRole) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            next();
        });
    };
};

const forbidAuthorizedPersonOnly = (req, res, next) => {
    if (isAuthorizedPersonOnly(req.user)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
};

module.exports = {
    authMiddleware,
    requireAuth,
    forbidAuthorizedPersonOnly
};
