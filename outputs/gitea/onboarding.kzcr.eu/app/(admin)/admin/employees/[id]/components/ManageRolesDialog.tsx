'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Shield, Calendar, Trash2, AlertTriangle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import { hasAnyRole } from '@/lib/roleUtils'
import {
  getUserRole,
  getUserOrganizationMemberships,
  deleteOrganizationMembership,
  type OrganizationMembership,
  type UserRole,
} from '@/lib/api/role-assignments'
import { AddRoleAssignmentDialog } from './AddRoleAssignmentDialog'
import { ChangeRoleDialog } from './ChangeRoleDialog'
import { EditExpirationDialog } from './EditExpirationDialog'

interface ManageRolesDialogProps {
  employeeId: string
  employeeName: string
  onRoleChanged: () => void
}

export function ManageRolesDialog({
  employeeId,
  employeeName,
  onRoleChanged
}: ManageRolesDialogProps) {
  const { roles } = useAuth()
  const canManageRoles = hasAnyRole(roles, ['admin', 'super_admin'])

  const [isOpen, setIsOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      void loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const [role, organizationMemberships] = await Promise.all([
        getUserRole(employeeId),
        getUserOrganizationMemberships(employeeId),
      ])
      setCurrentRole(role)
      setMemberships(organizationMemberships)
    } catch (error: any) {
      toast.error(error.message || 'Nepodařilo se načíst roli a přístupy do organizací')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (membershipId: string, membership: OrganizationMembership) => {
    if (!confirm(`Opravdu chcete odebrat přístup do organizace ${membership.organization_name}?`)) {
      return
    }

    try {
      await deleteOrganizationMembership(membershipId)
      toast.success('Přístup do organizace byl úspěšně odebrán')
      await loadData()
      onRoleChanged()
    } catch (error: any) {
      toast.error(error.message || 'Nepodařilo se odebrat přístup do organizace')
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super administrátor'
      case 'admin': return 'Administrátor'
      case 'hr': return 'HR'
      case 'authorized_person': return 'Oprávněná osoba'
      case 'user': return 'Zaměstnanec'
      default: return role
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-violet-50 text-violet-700'
      case 'admin': return 'bg-red-50 text-red-700'
      case 'hr': return 'bg-blue-50 text-blue-700'
      case 'authorized_person': return 'bg-amber-50 text-amber-700'
      case 'user': return 'bg-green-50 text-green-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) <= new Date()
  }

  if (!canManageRoles) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Spravovat roli a přístupy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Správa globální role a přístupů do organizací</DialogTitle>
          <DialogDescription>
            Uživatel: <strong>{employeeName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Globální role uživatele</p>
                {currentRole ? (
                  <Badge className={getRoleBadgeClass(currentRole.role_name)}>
                    {getRoleLabel(currentRole.role_name)}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Načítání role...</span>
                )}
              </div>
              <ChangeRoleDialog
                employeeId={employeeId}
                employeeName={employeeName}
                currentRole={currentRole?.role_name || 'user'}
                onRoleChanged={async () => {
                  await loadData()
                  onRoleChanged()
                }}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Přístupy do organizací
                </p>
                <p className="text-sm text-muted-foreground">
                  Membershipy určují jen to, do kterých organizací má uživatel přístup.
                </p>
              </div>
              <AddRoleAssignmentDialog
                employeeId={employeeId}
                employeeName={employeeName}
                onSuccess={async () => {
                  await loadData()
                  onRoleChanged()
                }}
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Načítání...</div>
            ) : memberships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Žádný přístup do organizace
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organizace</TableHead>
                    <TableHead>Expirace</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell className="font-medium">
                        {membership.organization_name}
                      </TableCell>
                      <TableCell>
                        {membership.expires_at ? (
                          <div className="flex items-center gap-2">
                            {isExpired(membership.expires_at) ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Expirováno
                              </Badge>
                            ) : isExpiringSoon(membership.expires_at) ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-700 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(membership.expires_at).toLocaleDateString('cs-CZ')}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {new Date(membership.expires_at).toLocaleDateString('cs-CZ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Trvalý</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={membership.assignment_type === 'auto' ? 'secondary' : 'outline'}>
                          {membership.assignment_type === 'auto' ? 'Auto (SSO)' : 'Manuální'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditExpirationDialog
                            assignmentId={membership.id}
                            currentExpiration={membership.expires_at}
                            organizationName={membership.organization_name}
                            onSuccess={async () => {
                              await loadData()
                              onRoleChanged()
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(membership.id, membership)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
