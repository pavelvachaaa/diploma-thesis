'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Shield } from 'lucide-react'
import { updateUserRole } from '@/lib/api/role-assignments'
import { useAuth } from '@/context/AuthContext'
import { hasAnyRole } from '@/lib/roleUtils'

interface ChangeRoleDialogProps {
  employeeId: string
  employeeName: string
  currentRole: string
  onRoleChanged: () => void
}

const BASE_ROLE_OPTIONS = [
  { value: 'user', label: 'Zaměstnanec', description: 'Běžný uživatel s přístupem k onboardingu' },
  { value: 'authorized_person', label: 'Oprávněná osoba', description: 'Globální read-only role s přístupem k přiděleným inzerátům a pohovorům' },
  { value: 'hr', label: 'HR', description: 'HR specialista s přístupem k uchazečům a zaměstnancům' },
  { value: 'admin', label: 'Administrátor', description: 'Plný přístup k administraci organizace' },
]

export function ChangeRoleDialog({
  employeeId,
  employeeName,
  currentRole,
  onRoleChanged
}: ChangeRoleDialogProps) {
  const { roles } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const roleOptions = hasAnyRole(roles, ['super_admin'])
    ? [
        ...BASE_ROLE_OPTIONS,
        { value: 'super_admin', label: 'Super administrátor', description: 'Globální role s plným systémovým přístupem' },
      ]
    : BASE_ROLE_OPTIONS

  useEffect(() => {
    setSelectedRole(currentRole)
  }, [currentRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedRole === currentRole) {
      toast.error ('Role nebyla změněna')
      setIsOpen(false)
      return
    }

    setIsSubmitting(true)
    try {
      await updateUserRole(employeeId, { role: selectedRole })
      toast.success('Role byla úspěšně změněna')
      setIsOpen(false)
      onRoleChanged() // Trigger refresh
    } catch (error: any) {
      toast.error(error.message || 'Nepodařilo se změnit roli')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedRoleInfo = roleOptions.find(r => r.value === selectedRole)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Změnit globální roli
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Změnit globální roli uživatele</DialogTitle>
            <DialogDescription>
              Změna role pro: <strong>{employeeName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Nová role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte roli" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRoleInfo && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium mb-1">{selectedRoleInfo.label}</p>
                <p className="text-muted-foreground">{selectedRoleInfo.description}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedRole === currentRole}>
              {isSubmitting ? 'Ukládání...' : 'Změnit globální roli'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
