const ELEVATED_ADMIN_ROLES = ['super_admin', 'admin', 'hr']

export const getPrimaryRole = (roles: string[]): string => {
    // Priority order: super_admin > admin > hr > authorized_person > user
    if (roles.includes('super_admin')) return 'super_admin';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('hr')) return 'hr';
    if (roles.includes('authorized_person')) return 'authorized_person';
    if (roles.includes('user')) return 'user';
    return 'user'; // default fallback
};

export const hasElevatedAdminRole = (roles: string[]): boolean => {
    return ELEVATED_ADMIN_ROLES.some(role => roles.includes(role));
};

export const isAuthorizedPersonOnly = (roles: string[]): boolean => {
    return roles.includes('authorized_person') && !hasElevatedAdminRole(roles);
};

export const getHomePathForRoles = (roles: string[]): string => {
    if (hasElevatedAdminRole(roles)) return '/admin/dashboard';
    if (roles.includes('authorized_person')) return '/admin/jobs';
    return '/employee/dashboard';
};

export const hasRole = (userRoles: string[], requiredRole: string): boolean => {
    return userRoles.includes(requiredRole);
};

export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
    // Super admin has access to everything
    if (userRoles.includes('super_admin')) return true;
    return requiredRoles.some(role => userRoles.includes(role));
};
