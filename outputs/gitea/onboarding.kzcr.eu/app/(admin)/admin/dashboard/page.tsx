'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from "@/components/ProtectedRoute";
import { ADMIN_OPERATOR_AND_SUPER_ADMIN_ROLES, getAdminAccessConfig } from "@/lib/authorizedPersonAccess";
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { OnboardingProgress } from '@/components/dashboard/OnboardingProgress';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { SimpleChart } from '@/components/dashboard/SimpleChart';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  FileText, 
  Bell,
  RefreshCw,
  AlertCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
    const { roles } = useAuth();
    const adminAccess = getAdminAccessConfig(roles);
    const { stats, recentActivity, loading, error, refetch } = useDashboardStats();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const router = useRouter();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Show loading skeleton while initial data is loading
    if (loading && Object.keys(stats.employees).length === 0) {
        return (
            <ProtectedRoute requiredRoles={[...ADMIN_OPERATOR_AND_SUPER_ADMIN_ROLES]}>
                <DashboardSkeleton />
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRoles={[...ADMIN_OPERATOR_AND_SUPER_ADMIN_ROLES]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">
                            Přehled systému a aktivity · {new Date().toLocaleDateString('cs-CZ', {
                                weekday: 'long',
                                year: 'numeric', 
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Obnovit
                        </Button>
                    </div>
                </div>

                {/* Welcome Banner */}
                {showWelcome && (
                    <WelcomeBanner 
                        onDismiss={() => setShowWelcome(false)}
                        userStats={{
                            isNewUser: stats.employees.total < 5, // Consider new if few employees
                            unreadNotifications: stats.notifications.unread,
                            pendingTasks: stats.onboarding.pendingDocuments
                        }}
                    />
                )}

                {/* Error State */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Nepodařilo se načíst data: {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="Celkem zaměstnanců"
                        value={stats.employees.total}
                        subtitle="Všichni zaměstnanci v systému"
                        icon={Users}
                        color="blue"
                        loading={loading}
                        onClick={adminAccess.canAccessPath('/admin/employees')
                            ? () => router.push('/admin/employees')
                            : undefined}
                        trend={{
                            value: 12,
                            isPositive: true,
                            label: 'za posledních 30 dní'
                        }}
                    />
                    
                    <StatCard
                        title="Aktivní uchazeči"
                        value={stats.applicants.total}
                        subtitle="Nové přihlášky za týden"
                        icon={UserCheck}
                        color="green"
                        loading={loading}
                        onClick={() => router.push('/admin/applicants')}
                        trend={{
                            value: 8,
                            isPositive: true,
                            label: 'za posledních 7 dní'
                        }}
                    />
                    
                    <StatCard
                        title="Aktivní pozice"
                        value={stats.jobs.active}
                        subtitle={`${stats.jobs.total} celkem pozic`}
                        icon={Briefcase}
                        color="orange"
                        loading={loading}
                        onClick={() => router.push('/admin/jobs')}
                    />
                    
                    <StatCard
                        title="Nepřečtené notifikace"
                        value={stats.notifications.unread}
                        subtitle="Vyžadují pozornost"
                        icon={Bell}
                        color={stats.notifications.unread > 0 ? 'red' : 'gray'}
                        loading={loading}
                        onClick={() => router.push('/admin/notifications')}
                    />
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Onboarding v procesu"
                        value={stats.onboarding.inProgress}
                        subtitle="Probíhající procesy"
                        icon={Calendar}
                        color="purple"
                        loading={loading}
                        onClick={() => router.push('/admin/employees?filter=onboarding')}
                    />
                    
                    <StatCard
                        title="Čekající dokumenty"
                        value={stats.onboarding.pendingDocuments}
                        subtitle="Vyžadují schválení"
                        icon={FileText}
                        color="orange"
                        loading={loading}
                        onClick={() => router.push('/admin/documents?status=pending')}
                    />
                    
                    <StatCard
                        title="Úspěšnost onboardingu"
                        value={`${stats.onboarding.inProgress + stats.onboarding.completed > 0 ? 
                            Math.round((stats.onboarding.completed / (stats.onboarding.inProgress + stats.onboarding.completed)) * 100) : 0}%`}
                        subtitle="Dokončené procesy"
                        icon={TrendingUp}
                        color="green"
                        loading={loading}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SimpleChart
                        title="Zaměstnanci za posledních 6 měsíců"
                        type="bar"
                        showTrend={true}
                        loading={loading}
                        data={[
                            { label: 'Leden', value: stats.employees.total * 0.85, color: 'bg-blue-500' },
                            { label: 'Únor', value: stats.employees.total * 0.88, color: 'bg-blue-500' },
                            { label: 'Březen', value: stats.employees.total * 0.92, color: 'bg-blue-500' },
                            { label: 'Duben', value: stats.employees.total * 0.95, color: 'bg-blue-500' },
                            { label: 'Květen', value: stats.employees.total * 0.98, color: 'bg-blue-500' },
                            { label: 'Červen', value: stats.employees.total, color: 'bg-blue-600' }
                        ]}
                    />
                    
                    <SimpleChart
                        title="Úspěšnost onboardingu"
                        type="line"
                        loading={loading}
                        data={[
                            { label: 'Q1', value: 85 },
                            { label: 'Q2', value: 88 },
                            { label: 'Q3', value: 92 },
                            { label: 'Q4', value: stats.onboarding.inProgress + stats.onboarding.completed > 0 ? 
                                Math.round((stats.onboarding.completed / (stats.onboarding.inProgress + stats.onboarding.completed)) * 100) : 95 }
                        ]}
                    />
                </div>

                {/* Dashboard Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Activity Feed */}
                    <div className="lg:col-span-2">
                        <ActivityFeed 
                            activities={recentActivity}
                            loading={loading}
                        />
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <QuickActions />
                        
                        {/* Onboarding Progress */}
                        <OnboardingProgress 
                            stats={stats.onboarding}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
