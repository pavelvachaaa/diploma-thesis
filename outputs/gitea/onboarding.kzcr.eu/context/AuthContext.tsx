'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api'; // Adjust path as needed

type AuthState = {
    loading: boolean;
    userId?: string;
    email?: string;
    fullName?: string;
    organization?: string;
    role?: string;
    roles: string[];
    isAuthenticated: boolean;
    refreshAuth: () => Promise<void>;
    setAuthenticatedUser: (user: AuthUserPayload) => void;
    logout: () => Promise<void>;
};

type AuthUserPayload = {
    userId?: string;
    email?: string;
    fullName?: string;
    organization?: string;
    role?: string;
    roles?: string[];
};

const AuthContext = createContext<AuthState>({
    loading: true,
    roles: [],
    isAuthenticated: false,
    refreshAuth: async () => { },
    setAuthenticatedUser: () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [auth, setAuth] = useState<AuthState>({
        loading: true,
        roles: [],
        isAuthenticated: false,
        refreshAuth: async () => { },
        setAuthenticatedUser: () => { },
        logout: async () => { },
    });



    const fetchAuth = async () => {
        try {
            setAuth(prev => ({ ...prev, loading: true }));

            const data = await api<any>('/auth/me');

            setAuth(prev => ({
                ...prev,
                ...data,
                loading: false,
                isAuthenticated: true,
                roles: data.roles || []
            }));
        } catch (error) {
            // Silently handle auth errors - this is expected when user is not logged in
            // Only log non-auth errors
            if (error instanceof Error && !error.message.includes('No token provided')) {
                console.error('Auth fetch error:', error);
            }
            setAuth(prev => ({
                ...prev,
                loading: false,
                isAuthenticated: false,
                roles: [],
                userId: undefined,
                email: undefined,
                fullName: undefined,
                organization: undefined,
                role: undefined
            }));
        }
    };

    const setAuthenticatedUser = (user: AuthUserPayload) => {
        setAuth(prev => ({
            ...prev,
            ...user,
            loading: false,
            isAuthenticated: true,
            roles: user.roles || []
        }));
    };

    const logout = async () => {
        try {
            await api('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAuth(prev => ({
                ...prev,
                loading: false,
                isAuthenticated: false,
                roles: [],
                userId: undefined,
                email: undefined,
                fullName: undefined,
                organization: undefined,
                role: undefined
            }));
            window.location.href = '/onboarding/login';
        }
    };

    useEffect(() => {
        fetchAuth();
    }, []);

    // Update auth state with refresh and logout functions
    useEffect(() => {
        setAuth(prev => ({
            ...prev,
            refreshAuth: fetchAuth,
            setAuthenticatedUser,
            logout: logout
        }));
    }, []);

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
