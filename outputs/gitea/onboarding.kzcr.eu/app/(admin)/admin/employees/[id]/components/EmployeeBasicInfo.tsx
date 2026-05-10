'use client'

import React from 'react'
import { User, Mail, Phone, Building, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminEmployee } from '@/types/admin'

interface EmployeeBasicInfoProps {
  employee: AdminEmployee | null
  loading?: boolean
  error?: string
}

export function EmployeeBasicInfo({ employee, loading, error }: EmployeeBasicInfoProps) {
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-violet-50 text-violet-700'
      case 'admin':
        return 'bg-red-50 text-red-700'
      case 'hr':
        return 'bg-blue-50 text-blue-700'
      case 'authorized_person':
        return 'bg-amber-50 text-amber-700'
      case 'user':
        return 'bg-green-50 text-green-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super administrátor'
      case 'admin':
        return 'Administrátor'
      case 'hr':
        return 'HR'
      case 'authorized_person':
        return 'Oprávněná osoba'
      case 'user':
        return 'Zaměstnanec'
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Základní informace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || !employee) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            {error || 'Nepodařilo se načíst základní informace'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Základní informace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <h4 className="mb-1 font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </h4>
            <p className="text-sm">{employee.email}</p>
          </div>

          {employee.phone && (
            <div>
              <h4 className="mb-1 font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </h4>
              <p className="text-sm">{employee.phone}</p>
            </div>
          )}

          <div>
            <h4 className="mb-1 font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Organizace
            </h4>
            <p className="text-sm">{employee.organization_name || 'Nepřiřazena'}</p>
          </div>

          {employee.role_name && (
            <div>
              <h4 className="mb-1 font-medium">Role</h4>
              <Badge className={getRoleBadgeClass(employee.role_name)}>
                {getRoleDisplayName(employee.role_name)}
              </Badge>
            </div>
          )}

          <div>
            <h4 className="mb-1 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registrován
            </h4>
            <p className="text-sm">{formatDate(employee.created_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
