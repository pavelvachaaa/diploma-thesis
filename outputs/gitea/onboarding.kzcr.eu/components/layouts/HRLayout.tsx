"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { getAssetPath } from "@/lib/basePath"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import NotificationBell from "@/components/notifications/NotificationBell"
import { useAuth } from "@/context/AuthContext"
import { AdminProvider } from "@/context/AdminContext"
import { Sidebar, AdminHeader, type SidebarNavItem } from "@/components/hr-admin-ui"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  UserCheck,
  FileText,
  Bell,
  Settings,
  Workflow,
  Key,
  MessageSquare,
  MessageCircleQuestionIcon,
  CalendarCheck,
  Building,
  Database,
  MailWarning,
  BadgeCheck,
  Award,
} from "lucide-react"
import LogoutButton from "../LogoutButton"

const NAV_ICON_MAP = {
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  seekers: <Users className="h-5 w-5" />,
  "contact-inquiries": <MailWarning className="h-5 w-5" />,
  specifications: <MessageCircleQuestionIcon className="h-5 w-5" />,
  employees: <Users className="h-5 w-5" />,
  applicants: <UserPlus className="h-5 w-5" />,
  qualifications: <BadgeCheck className="h-5 w-5" />,
  accreditations: <Award className="h-5 w-5" />,
  interviews: <CalendarCheck className="h-5 w-5" />,
  jobs: <Briefcase className="h-5 w-5" />,
  "job-roles": <UserCheck className="h-5 w-5" />,
  organizations: <Building className="h-5 w-5" />,
  documents: <FileText className="h-5 w-5" />,
  onboarding: <Workflow className="h-5 w-5" />,
  notifications: <Bell className="h-5 w-5" />,
  chat: <MessageSquare className="h-5 w-5" />,
  audit: <Database className="h-5 w-5" />,
  outbox: <MailWarning className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  "change-password": <Key className="h-5 w-5" />,
} as const


// Main reusable layout
export default function AdminLayoutClient({
  children,
  sidebarNav,
  headerContent,
}: {
  children: React.ReactNode
  sidebarNav?: SidebarNavItem[]
  headerContent?: React.ReactNode
}) {
  const pathname = usePathname()
  const { fullName, email, organization, roles } = useAuth()
  const adminAccess = getAdminAccessConfig(roles)

  const resolvedSidebarNav: SidebarNavItem[] = adminAccess.navItems.map((item) => ({
    href: item.href,
    icon: NAV_ICON_MAP[item.key],
    label: item.label,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
    subItems: item.subItems,
  }))

  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          logo={
            <Link href={adminAccess.homePath} className="flex items-center gap-2">
              <Image src={getAssetPath("/logo.png")} alt="Krajská zdravotní" width={150} height={40} className="h-8 w-auto" />
            </Link>
          }
          navItems={sidebarNav || resolvedSidebarNav}
          bottomLink={
            <LogoutButton></LogoutButton>
          }
        />
        <div className="ml-64 flex min-w-0 flex-1 flex-col">
          <AdminHeader>
            {headerContent || (
              <>
                {adminAccess.capabilities.ui.showNotificationBell && <NotificationBell />}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {fullName
                        ? fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                        : email
                          ? email.substring(0, 2).toUpperCase()
                          : 'U'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{fullName || email || 'Uživatel'}</p>
                    <p className="text-xs text-gray-500">{organization || 'HR Administrátor'}</p>
                  </div>
                </div>
              </>
            )}
          </AdminHeader>
          <main className="min-w-0 flex-1 p-6">{children}</main>
        </div>
      </div>
    </AdminProvider>
  )
}
