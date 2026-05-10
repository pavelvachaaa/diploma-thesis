'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAdminAccessConfig } from '@/lib/authorizedPersonAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Sparkles,
  ArrowRight,
  Mail,
  Settings,
  Users
} from 'lucide-react';

interface WelcomeBannerProps {
  onDismiss?: () => void;
  userStats?: {
    isNewUser: boolean;
    unreadNotifications: number;
    pendingTasks: number;
  };
}

export function WelcomeBanner({ onDismiss, userStats }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { roles } = useAuth();
  const adminAccess = getAdminAccessConfig(roles);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const isNewUser = userStats?.isNewUser ?? true;
  const canViewNotifications = adminAccess.canAccessPath('/admin/notifications');
  const hasNotifications = canViewNotifications && (userStats?.unreadNotifications ?? 0) > 0;
  const hasPendingTasks = (userStats?.pendingTasks ?? 0) > 0;
  const primaryActionHref = adminAccess.canAccessPath('/admin/employees')
    ? '/admin/employees'
    : adminAccess.canAccessPath('/admin/workflows')
      ? '/admin/workflows'
      : '/admin/jobs';
  const secondaryActionHref = adminAccess.canAccessPath('/admin/seekers')
    ? '/admin/seekers'
    : '/admin/applicants';
  const settingsHref = adminAccess.capabilities.ui.showSettingsRoot
    ? '/admin/settings'
    : '/admin/settings/notifications';

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isNewUser ? 'Vítejte v administraci KZČR!' : 'Přehled vašich úkolů'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isNewUser
                    ? 'Začněte se správou agendy podle vaší role'
                    : `${hasNotifications || hasPendingTasks ? 'Máte nepřečtené notifikace a úkoly' : 'Vše je v pořádku'}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {hasNotifications && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {userStats!.unreadNotifications} notifikací
                </Badge>
              )}

              {hasPendingTasks && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {userStats!.pendingTasks} čekajících úkolů
                </Badge>
              )}

              {isNewUser && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Nový uživatel
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {isNewUser ? (
                <>
                  <Link href={primaryActionHref}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      {adminAccess.canAccessPath('/admin/employees')
                        ? 'Správa zaměstnanců'
                        : adminAccess.canAccessPath('/admin/workflows')
                          ? 'Onboarding'
                          : 'Pracovní nabídky'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>

                  <Link href={secondaryActionHref}>
                    <Button variant="outline" size="sm">
                      {adminAccess.canAccessPath('/admin/seekers') ? 'Databáze zájemců' : 'Uchazeči'}
                    </Button>
                  </Link>

                  {adminAccess.canAccessPath(settingsHref) && (
                    <Link href={settingsHref}>
                      <Button variant="ghost" size="sm" className="text-gray-600">
                        <Settings className="w-4 h-4 mr-1" />
                        {adminAccess.capabilities.ui.showSettingsRoot ? 'Nastavení' : 'Notifikace'}
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {hasNotifications && (
                    <Link href="/admin/notifications">
                      <Button size="sm" variant="default">
                        Zobrazit notifikace
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}

                  {hasPendingTasks && adminAccess.canAccessPath('/admin/employees') && (
                    <Link href="/admin/employees?status=pending">
                      <Button size="sm" variant="outline">
                        Dokončit úkoly
                      </Button>
                    </Link>
                  )}

                  <Link href="/admin/dashboard">
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      Obnovit přehled
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
