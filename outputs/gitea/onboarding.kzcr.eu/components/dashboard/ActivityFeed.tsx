'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  Clock,
  ArrowRight,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { DashboardActivity } from '@/hooks/useDashboardStats';

interface ActivityFeedProps {
  activities: DashboardActivity[];
  loading?: boolean;
}

const activityIcons = {
  employee_created: Users,
  applicant_new: FileText,
  job_posted: Briefcase,
  document_approved: CheckCircle,
  onboarding_completed: CheckCircle
};

const activityColors = {
  employee_created: 'bg-blue-100 text-blue-700',
  applicant_new: 'bg-green-100 text-green-700',
  job_posted: 'bg-orange-100 text-orange-700',
  document_approved: 'bg-purple-100 text-purple-700',
  onboarding_completed: 'bg-emerald-100 text-emerald-700'
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'právě teď';
  if (diffInMinutes < 60) return `před ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `před ${diffInHours} h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `před ${diffInDays} d`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `před ${diffInWeeks} týd`;
  
  return time.toLocaleDateString('cs-CZ');
}

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Nedávná aktivita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            Nedávná aktivita
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            Zobrazit vše
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Žádná nedávná aktivita</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || Clock;
              const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-700';

              return (
                <div key={activity.id} className="flex items-start space-x-4 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    {activity.user && (
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {activity.user.name}
                        </Badge>
                      </div>
                    )}
                    {activity.actionUrl && (
                      <Link href={activity.actionUrl}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Zobrazit detail →
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}