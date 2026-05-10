// components/PublicRoute.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PublicRouteProps {
    children: React.ReactNode;
    redirectIfAuthenticated?: boolean;
    redirectPath?: string;
}

export default function PublicRoute({
    children,
    redirectIfAuthenticated = false,
    redirectPath = '/dashboard' // TODO: based on role
}: PublicRouteProps) {
    const { loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isAuthenticated && redirectIfAuthenticated) {
            router.push(redirectPath);
        }
    }, [loading, isAuthenticated, redirectIfAuthenticated, router, redirectPath]);

    if (loading) {
        return <LoadingSpinner />;
    }

    // If we should redirect authenticated users and user is authenticated, don't render
    if (redirectIfAuthenticated && isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}