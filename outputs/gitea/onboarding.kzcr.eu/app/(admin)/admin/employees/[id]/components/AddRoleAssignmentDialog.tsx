'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createOrganizationMembership } from '@/lib/api/role-assignments'
import { getAllOrganizations, type Organization } from '@/lib/api/organizations'

interface AddRoleAssignmentDialogProps {
  employeeId: string
  employeeName: string
  onSuccess: () => void
}

export function AddRoleAssignmentDialog({
  employeeId,
  employeeName,
  onSuccess
}: AddRoleAssignmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizationId, setOrganizationId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadOrganizations()
    }
  }, [isOpen])

  const loadOrganizations = async () => {
    setLoadingOrgs(true)
    try {
      const response = await getAllOrganizations({ limit: 100 })
      setOrganizations(response.data)
    } catch (error: any) {
      toast.error(error.message || 'Nepodařilo se načíst organizace')
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organizationId) {
      toast.error('Organizace je povinná')
      return
    }

    setIsSubmitting(true)
    try {
      await createOrganizationMembership(employeeId, {
        organizationId,
        expiresAt: expiresAt || null,
        notes: notes || undefined,
      })
      toast.success('Přístup do organizace byl úspěšně přidán')
      setIsOpen(false)
      onSuccess()
      setOrganizationId('')
      setExpiresAt('')
      setNotes('')
    } catch (error: any) {
      toast.error(error.message || 'Nepodařilo se přidat přístup do organizace')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Přidat organizaci
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Přidat přístup do organizace</DialogTitle>
            <DialogDescription>
              Uživatel: <strong>{employeeName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organizace *</Label>
              <Select
                value={organizationId}
                onValueChange={setOrganizationId}
                disabled={loadingOrgs}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingOrgs ? 'Načítání...' : 'Vyberte organizaci'} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        {org.seat_location && (
                          <div className="text-xs text-muted-foreground">{org.seat_location}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Datum expirace (volitelné)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ponechte prázdné pro trvalý přístup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky (volitelné)</Label>
              <Textarea
                id="notes"
                placeholder="Důvod přidání přístupu, kontext, ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={isSubmitting || !organizationId}>
              {isSubmitting ? 'Ukládání...' : 'Přidat přístup'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
