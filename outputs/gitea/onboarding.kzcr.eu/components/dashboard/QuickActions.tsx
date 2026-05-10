'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getAdminAccessConfig } from '@/lib/authorizedPersonAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Briefcase,
  Settings,
  ClipboardList,
  Bell,
  CalendarCheck,
  ShieldCheck,
  Database,
  Zap
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Pracovní nabídky',
    description: 'Správa nabídek a stavu',
    href: '/admin/jobs',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    title: 'Databáze zájemců',
    description: 'Org přehled zájemců',
    href: '/admin/seekers',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    title: 'Uchazeči',
    description: 'Procházet uchazeče',
    href: '/admin/applicants',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100'
  },
  {
    title: 'Pohovory',
    description: 'Kalendář a plánování',
    href: '/admin/interviews',
    icon: CalendarCheck,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 hover:bg-violet-100'
  },
  {
    title: 'Onboarding',
    description: 'Workflow a formuláře',
    href: '/admin/workflows',
    icon: ClipboardList,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    title: 'Dokumenty',
    description: 'Správa dokumentů',
    href: '/admin/onboarding-documents',
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100'
  },
  {
    title: 'Pracovní role',
    description: 'Role a specifikace',
    href: '/admin/job-roles',
    icon: ShieldCheck,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100'
  },
  {
    title: 'Notifikace',
    description: 'Přehled upozornění',
    href: '/admin/notifications',
    icon: Bell,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100'
  },
  {
    title: 'Nastavení notifikací',
    description: 'Osobní preference',
    href: '/admin/settings/notifications',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100'
  },
  {
    title: 'Audit logy',
    description: 'Systémový dohled',
    href: '/admin/audit-events',
    icon: Database,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 hover:bg-amber-100'
  }
];

export function QuickActions() {
  const { roles } = useAuth();
  const adminAccess = getAdminAccessConfig(roles);
  const visibleActions = QUICK_ACTIONS
    .filter((action) => adminAccess.canAccessPath(action.href))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-gray-600" />
          Rychlé akce
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {visibleActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="ghost"
                  className={`w-full h-auto p-4 flex items-center gap-3 justify-start ${action.bgColor} border border-transparent hover:border-gray-200 transition-all duration-200 min-h-[60px]`}
                >
                  <div className={`flex-shrink-0 ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className={`font-medium text-sm ${action.color} truncate`}>
                      {action.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
