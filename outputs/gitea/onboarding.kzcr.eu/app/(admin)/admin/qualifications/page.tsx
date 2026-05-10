"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_SHELL_ROLES } from "@/lib/authorizedPersonAccess"
import QualificationLookupPanel from "./components/QualificationLookupPanel"

export default function AdminQualificationsPage() {
  return (
    <ProtectedRoute requiredRoles={[...ADMIN_SHELL_ROLES]}>
      <QualificationLookupPanel />
    </ProtectedRoute>
  )
}
