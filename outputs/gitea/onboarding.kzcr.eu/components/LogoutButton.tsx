'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
    const { logout, loading } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
            <LogOut className="h-4 w-4" />
            {loading ? 'Odhlašování...' : 'Odhlásit se'}
        </button>
    );
}
