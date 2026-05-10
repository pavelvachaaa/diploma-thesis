"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION

// Sidebar item type
export interface SidebarNavItem {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  subItems?: { href: string; label: string }[]
  badge?: React.ReactNode
}

// Sidebar component
export function Sidebar({
  logo,
  navItems,
  bottomLink,
}: {
  logo?: React.ReactNode
  navItems: SidebarNavItem[]
  bottomLink?: React.ReactNode
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(() => {
    const idx = navItems.findIndex(item => item.active && item.subItems)
    return idx >= 0 ? idx : null
  })

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="flex h-16 items-center border-b border-gray-200 px-4 flex-shrink-0">
        {logo}
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1 p-4">
        {navItems.map((item, idx) => (
          <div key={item.href}>
{item.subItems ? (
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  item.active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="text-gray-500">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge}
                <svg
                  className={`ml-auto h-4 w-4 transition-transform ${openIndex === idx ? "rotate-180" : ""}`}
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  item.active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <span className="text-gray-500">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge}
              </Link>
            )}
            {item.subItems && openIndex === idx && (
              <div className="ml-6 mt-1 space-y-1">
                {item.subItems.map((sub) => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                    <span>{sub.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      {bottomLink && (
        <div className="flex-shrink-0 w-full border-t border-gray-200 p-4">
          {bottomLink}
          <p className="mt-3 text-xs text-gray-400">Verze {appVersion}</p>
        </div>
      )}
    </aside>
  )
}
