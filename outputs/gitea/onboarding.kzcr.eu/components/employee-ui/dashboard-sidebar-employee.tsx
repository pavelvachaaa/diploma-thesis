"use client"

import Link from "next/link"
import {
    User,
    FileText,
    LogOut,
    Bell,
    Settings,
    BookOpen,
    Shield,
    Clipboard,
    CheckCircle,
    Calendar,
    MessageSquare,
    Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import LogoutButton from "../LogoutButton"

interface DashboardSidebarProps {
    currentPath: string
    remindersCount: number
    onCloseMobile?: () => void
}

export function DashboardSidebar({ currentPath, remindersCount, onCloseMobile }: DashboardSidebarProps) {
    const isActive = (path: string) => {
        return currentPath === path || currentPath.startsWith(`${path}/`)
    }

    const menuItems = [
        {
            href: "/dashboard",
            icon: <FileText className="h-4 w-4" />,
            label: "Dokumenty",
        },
        {
            href: "/dashboard/profile",
            icon: <User className="h-4 w-4" />,
            label: "Profil",
        },
        {
            href: "/dashboard/notifications",
            icon: <Bell className="h-4 w-4" />,
            label: "Notifikace",
            badge:
                remindersCount > 0 ? (
                    <Badge variant="destructive" className="ml-auto">
                        {remindersCount}
                    </Badge>
                ) : null,
        },
        {
            href: "/dashboard/guide",
            icon: <BookOpen className="h-4 w-4" />,
            label: "Průvodce",
        },
        {
            href: "/dashboard/training",
            icon: <Shield className="h-4 w-4" />,
            label: "Školení BOZP",
        },
        {
            href: "/dashboard/workplace",
            icon: <Clipboard className="h-4 w-4" />,
            label: "Pracoviště",
        },
        {
            href: "/dashboard/checklist",
            icon: <CheckCircle className="h-4 w-4" />,
            label: "Checklist",
        },
        {
            href: "/dashboard/mentoring",
            icon: <Users className="h-4 w-4" />,
            label: "Mentoring",
        },
        {
            href: "/dashboard/hr-chat",
            icon: <MessageSquare className="h-4 w-4" />,
            label: "Chat s HR",
        },
        {
            href: "/dashboard/shifts",
            icon: <Calendar className="h-4 w-4" />,
            label: "Kalendář směn",
        },
        {
            href: "/dashboard/settings",
            icon: <Settings className="h-4 w-4" />,
            label: "Nastavení",
        },
    ]

    return (
        <div className="flex h-full flex-col">
            <nav className="flex-1 overflow-auto p-4">
                <ul className="grid gap-1">
                    {menuItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive(item.href) ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"
                                    }`}
                                onClick={onCloseMobile}
                            >
                                {item.icon}
                                {item.label}
                                {item.badge}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="border-t p-4">
                <LogoutButton></LogoutButton>
            </div>
        </div>
    )
}
