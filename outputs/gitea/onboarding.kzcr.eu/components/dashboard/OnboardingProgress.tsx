'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  FileText, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface OnboardingProgressProps {
  stats: {
    inProgress: number;
    completed: number;
    pendingDocuments: number;
  };
  loading?: boolean;
}

export function OnboardingProgress({ stats, loading = false }: OnboardingProgressProps) {
  const total = stats.inProgress + stats.completed;
  const completionRate = total > 0 ? (stats.completed / total) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Onboarding Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            Onboarding Progress
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            <Link href="/admin/employees" className="flex items-center">
              Zobrazit vše
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Celková úspěšnost dokončení
              </span>
              <span className="text-sm text-gray-600">
                {completionRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {stats.completed} z {total} zaměstnanců dokončilo onboarding
            </p>
          </div>

          {/* Breakdown Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Probíhající onboarding
                  </p>
                  <p className="text-xs text-blue-600">
                    Aktivní procesy
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">
                  {stats.inProgress}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Dokončený onboarding
                  </p>
                  <p className="text-xs text-green-600">
                    Všechny kroky splněny
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-700">
                  {stats.completed}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-700">
                    Čekající dokumenty
                  </p>
                  <p className="text-xs text-orange-600">
                    Vyžadují pozornost
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-700">
                  {stats.pendingDocuments}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t space-y-2">
            <Link href="/admin/employees?status=onboarding">
              <Button variant="outline" size="sm" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Zobrazit zaměstnance v onboardingu
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}