import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DashboardStats {
  employees: {
    total: number;
    recent: number; // added in last 30 days
    byStatus: Record<string, number>;
  };
  applicants: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
    recent: number; // applied in last 7 days
  };
  jobs: {
    total: number;
    active: number;
    draft: number;
    closed: number;
  };
  onboarding: {
    inProgress: number;
    completed: number;
    pendingDocuments: number;
  };
  notifications: {
    unread: number;
  };
}

interface DashboardActivity {
  id: string;
  type: 'employee_created' | 'applicant_new' | 'job_posted' | 'document_approved' | 'onboarding_completed';
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
  user?: {
    name: string;
    email: string;
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    employees: { total: 0, recent: 0, byStatus: {} },
    applicants: { total: 0, active: 0, byStatus: {}, recent: 0 },
    jobs: { total: 0, active: 0, draft: 0, closed: 0 },
    onboarding: { inProgress: 0, completed: 0, pendingDocuments: 0 },
    notifications: { unread: 0 }
  });
  
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [
        employeesResponse,
        applicantsResponse, 
        jobsResponse,
        notificationsResponse
      ] = await Promise.all([
        // Get employees with pagination to get total count
        api('/admin/employees?limit=1'),
        // Get applicants with pagination to get total count
        api('/admin/applicants?limit=1'),
        // Get jobs with pagination to get total count
        api('/admin/jobs?limit=1'),
        // Get notifications unread count
        api('/notifications/unread_count').catch(() => ({ count: 0 }))
      ]);

      // Process employee stats
      const employeeStats = {
        total: employeesResponse.pagination?.total || employeesResponse.data?.length || 0,
        recent: 0, // Would need backend endpoint for recent employees
        byStatus: {}
      };

      // Process applicant stats
      const applicantStats = {
        total: applicantsResponse.pagination?.total || applicantsResponse.data?.length || 0,
        active: 0, // Would calculate from status data
        byStatus: {},
        recent: 0 // Would need backend endpoint for recent applicants
      };

      // Process job stats  
      const jobStats = {
        total: jobsResponse.pagination?.total || jobsResponse.data?.length || 0,
        active: jobsResponse.data?.filter((job: any) => job.status === 'active')?.length || 0,
        draft: jobsResponse.data?.filter((job: any) => job.status === 'draft')?.length || 0,
        closed: jobsResponse.data?.filter((job: any) => job.status === 'closed')?.length || 0
      };

      // Mock onboarding stats (would need dedicated endpoint)
      const onboardingStats = {
        inProgress: Math.floor(employeeStats.total * 0.15),
        completed: Math.floor(employeeStats.total * 0.85),
        pendingDocuments: Math.floor(employeeStats.total * 0.08)
      };

      setStats({
        employees: employeeStats,
        applicants: applicantStats,
        jobs: jobStats,
        onboarding: onboardingStats,
        notifications: {
          unread: notificationsResponse.count || 0
        }
      });

      // Generate mock recent activity based on real data
      const activities: DashboardActivity[] = [];
      
      // Add recent employees if we have any
      if (employeesResponse.data) {
        employeesResponse.data.slice(0, 3).forEach((employee: any, index: number) => {
          activities.push({
            id: `employee-${employee.id}`,
            type: 'employee_created',
            title: 'Nový zaměstnanec vytvořen',
            description: `${employee.name} ${employee.surname || ''} byl přidán do systému`,
            timestamp: new Date(Date.now() - (index * 60 * 60 * 1000)).toISOString(),
            actionUrl: `/admin/employees/${employee.id}`,
            user: { name: employee.name, email: employee.email }
          });
        });
      }

      // Add recent applicants if we have any
      if (applicantsResponse.data) {
        applicantsResponse.data.slice(0, 2).forEach((applicant: any, index: number) => {
          activities.push({
            id: `applicant-${applicant.id}`,
            type: 'applicant_new',
            title: 'Nová přihláška',
            description: `${applicant.name} ${applicant.surname || ''} se přihlásil na pozici`,
            timestamp: new Date(Date.now() - ((index + 3) * 45 * 60 * 1000)).toISOString(),
            actionUrl: `/admin/applicants/${applicant.id}`,
            user: { name: applicant.name, email: applicant.email }
          });
        });
      }

      // Sort activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRecentActivity(activities.slice(0, 10));

    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst statistiky');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refetch: fetchDashboardStats
  };
}

export type { DashboardStats, DashboardActivity };