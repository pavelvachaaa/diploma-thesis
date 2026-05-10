'use client';
import { useAuth } from '@/context/AuthContext';
import { getPrimaryRole } from '../lib/roleUtils';
import { getAdminAccessConfig } from '@/lib/authorizedPersonAccess';
import { usePathname, useRouter } from 'next/navigation';
import AdminLayoutClient from './layouts/HRLayout';
import UserLayout from './layouts/UserLayout';
import PublicLayout from './layouts/PublicLayout';
import LoadingSpinner from './LoadingSpinner';
import { useEffect } from 'react';

interface RoleBasedLayoutProps {
    children: React.ReactNode;
}

const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/unauthorized',
    '/register',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/forgot-password',
    '/reset-password'
];

const isPublicRoute = (pathname: string): boolean => {
    return PUBLIC_ROUTES.some(route => {
        if (route === '/') return pathname === '/';
        return pathname.startsWith(route);
    });
};

export default function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
    const { loading, roles, isAuthenticated } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isPublic = isPublicRoute(pathname);
    const adminAccess = getAdminAccessConfig(roles);
    const canAccessCurrentPath = adminAccess.canAccessPath(pathname);
    const isAdminPath = pathname.startsWith('/admin');

    useEffect(() => {
        if (adminAccess.isAdminShellUser && isAdminPath && !canAccessCurrentPath) {
            router.replace(adminAccess.homePath);
        }
    }, [adminAccess.homePath, adminAccess.isAdminShellUser, canAccessCurrentPath, isAdminPath, router]);

    if (loading) {
        return <LoadingSpinner />;
    }

    // Používej public layout, nehlědě na přihlášenost
    if (isPublic) {
        return <PublicLayout>{children}</PublicLayout>;
    }

    if (!isAuthenticated) {
        return <PublicLayout>{children}</PublicLayout>;
    }

    const primaryRole = getPrimaryRole(roles);

    if (adminAccess.isAdminShellUser && isAdminPath && !canAccessCurrentPath) {
        return <LoadingSpinner />;
    }

    switch (primaryRole) {
        case 'super_admin':
        case 'hr':
        case 'admin':
        case 'authorized_person':
            return <AdminLayoutClient>{children}</AdminLayoutClient>;
        case 'user':
            return <UserLayout>{children}</UserLayout>;
        default:
            return <UserLayout>{children}</UserLayout>;
    }
}
