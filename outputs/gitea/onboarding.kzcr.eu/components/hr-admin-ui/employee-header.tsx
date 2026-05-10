"use client"

import React from "react"

// Employee Header component (without search bar)
export function EmployeeHeader({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">Onboarding Portal</h1>
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </header>
  )
}