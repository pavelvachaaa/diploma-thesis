
"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { getAssetPath } from "@/lib/basePath"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import NotificationBell from "@/components/notifications/NotificationBell"
import { useAuth } from "@/context/AuthContext"
import { Sidebar, EmployeeHeader, type SidebarNavItem } from "@/components/hr-admin-ui"
import LogoutButton from "../LogoutButton"
import {
  FileText,
  User,
  Bell,
  BookOpen,
  Shield,
  Clipboard,
  CheckCircle,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  LayoutDashboard,
} from "lucide-react"

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { fullName, email, organization } = useAuth()

    // Mock reminders count - you can replace this with actual data
    const remindersCount = 0 // Replace with actual reminder count logic

    // Employee navigation items
    const employeeNavItems: SidebarNavItem[] = [
        {
            href: "/employee/dashboard",
            icon:  <LayoutDashboard className="h-5 w-5" />,
            label: "Hlavní",
            active: pathname === "/employee/dashboard",
        },
        {
            href: "/dashboard/profile",
            icon: <User className="h-4 w-4" />,
            label: "Profil",
            active: pathname === "/dashboard/profile",
        },
        {
            href: "/employee/notifications",
            icon: <Bell className="h-4 w-4" />,
            label: "Notifikace",
            active: pathname === "/employee/notifications",
            badge: remindersCount > 0 ? (
                <Badge variant="destructive" className="ml-auto">
                    {remindersCount}
                </Badge>
            ) : null,
        },
        {
            href: "/employee/chat",
            icon: <MessageSquare className="h-4 w-4" />,
            label: "Chat s HR",
            active: pathname.startsWith("/employee/chat"),
        },
        {
            href: "/employee/settings",
            icon: <Settings className="h-4 w-4" />,
            label: "Nastavení",
            active: pathname.startsWith("/employee/settings") || pathname === "/employee/change-password",
            subItems: [
                { href: "/employee/settings", label: "Přehled nastavení" },
                { href: "/employee/settings/notifications", label: "Notifikace" },
                { href: "/employee/change-password", label: "Změnit heslo" },
            ],
        },
    ]

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                logo={
                    <Link href="/employee" className="flex items-center gap-2">
                        <Image src={getAssetPath("/logo.png")} alt="Krajská zdravotní" width={150} height={40} className="h-8 w-auto" />
                    </Link>
                }
                navItems={employeeNavItems}
                bottomLink={<LogoutButton />}
            />
            <div className="ml-64 flex flex-1 flex-col">
                <EmployeeHeader>
                    <NotificationBell />
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
                            <p className="text-xs text-gray-500">{organization || 'Zaměstnanec'}</p>
                        </div>
                    </div>
                </EmployeeHeader>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}
