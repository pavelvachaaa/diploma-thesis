'use client'

import { ArrowLeft, Users, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Employee } from '@/lib/api/employees'
import { SendEmailDialog } from './SendEmailDialog'
import { ManageRolesDialog } from './ManageRolesDialog'
import { useAuth } from '@/context/AuthContext'
import { hasAnyRole } from '@/lib/roleUtils'
import { DeleteEmployeeButton } from '@/components/hr-admin-ui/DeleteEmployeeButton'

interface EmployeeHeaderProps {
  employee: Employee | null
  loading?: boolean
  error?: string | null
  onRefresh: () => void
}

export function EmployeeHeader({ employee, loading, error, onRefresh }: EmployeeHeaderProps) {
  const { roles } = useAuth()
  const canChangeRoles = hasAnyRole(roles, ['admin', 'super_admin'])

  if (loading) {
    return (
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-20 bg-gray-200 rounded"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/admin/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět
          </Button>
        </Link>
        <div className="text-red-600">
          {error || 'Zaměstnanec nebyl nalezen'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link href="/admin/employees">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {employee.name} {employee.surname}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Zaměstnanec
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex flex-wrap justify-end gap-2">
          <SendEmailDialog
            employeeId={employee.id}
            employeeName={`${employee.name} ${employee.surname}`}
            employeeEmail={employee.email}
          />
          {canChangeRoles && (
            <ManageRolesDialog
              employeeId={employee.id}
              employeeName={`${employee.name} ${employee.surname}`}
              onRoleChanged={onRefresh}
            />
          )}
          <DeleteEmployeeButton
            employeeId={employee.id}
            employeeName={`${employee.name} ${employee.surname}`}
            redirectPath="/admin/employees"
          />
        </div>
        <div className="flex items-center space-x-2">
          {employee.is_active ? (
            <>
              <UserCheck className="h-5 w-5 text-green-500" />
              <span className="text-green-700 text-sm font-medium">Aktivní</span>
            </>
          ) : (
            <>
              <UserX className="h-5 w-5 text-red-500" />
              <span className="text-red-700 text-sm font-medium">Neaktivní</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
