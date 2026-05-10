'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getHomePathForRoles } from '@/lib/roleUtils';

export default function RedirectAuthenticatedUser() {
    const { loading, isAuthenticated, roles } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace(getHomePathForRoles(roles));
        }
    }, [loading, isAuthenticated, roles, router]);

    return null;
}
