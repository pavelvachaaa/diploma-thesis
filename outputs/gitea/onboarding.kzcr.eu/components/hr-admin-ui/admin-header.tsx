"use client"

import React from "react"
import { Input } from "@/components/ui/input"

// Header component
export function AdminHeader({
  searchPlaceholder = "Vyhledat zaměstnance...",
  children,
}: {
  searchPlaceholder?: string
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="relative w-96">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full rounded-full border-gray-300 pl-10 pr-4"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </header>
  )
}