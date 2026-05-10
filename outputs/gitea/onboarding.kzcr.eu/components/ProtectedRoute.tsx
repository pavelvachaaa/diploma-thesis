'use client';
import { useAuth } from '@/context/AuthContext';
import { hasAnyRole } from '../lib/roleUtils';
import { getAdminAccessConfig } from '@/lib/authorizedPersonAccess';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: string[];
    fallbackPath?: string;
}

export default function ProtectedRoute({
    children,
    requiredRoles = [],
    fallbackPath = '/login'
}: ProtectedRouteProps) {
    const { loading, isAuthenticated, roles } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const adminAccess = getAdminAccessConfig(roles);
    const hasRequiredRole = requiredRoles.length === 0 || hasAnyRole(roles, requiredRoles);
    const hasAdminPathAccess = !pathname.startsWith('/admin') || adminAccess.canAccessPath(pathname);

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push(fallbackPath);
                return;
            }

            if (!hasAdminPathAccess) {
                router.push(adminAccess.homePath);
                return;
            }

            if (!hasRequiredRole) {
                router.push('/unauthorized');
                return;
            }
        }
    }, [loading, isAuthenticated, hasAdminPathAccess, hasRequiredRole, router, fallbackPath, adminAccess.homePath]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!hasAdminPathAccess) {
        return null;
    }

    if (!hasRequiredRole) {
        return null;
    }

    return <>{children}</>;
}
