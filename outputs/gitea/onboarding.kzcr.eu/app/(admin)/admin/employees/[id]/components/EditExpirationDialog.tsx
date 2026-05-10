'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateOrganizationMembershipExpiration } from '@/lib/api/role-assignments'

interface EditExpirationDialogProps {
  assignmentId: string
  currentExpiration: string | null
  organizationName: string
  onSuccess: () => void
}

export function EditExpirationDialog({
  assignmentId,
  currentExpiration,
  organizationName,
  onSuccess
}: EditExpirationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expiresAt, setExpiresAt] = useState(
    currentExpiration ? new Date(currentExpiration).toISOString().slice(0, 16) : ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await updateOrganizationMembershipExpiration(assignmentId, {
        expiresAt: expiresAt || null,
      })
      toast.success('Expirace byla úspěšně aktualizována')
      setIsOpen(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Nepodařilo se aktualizovat expiraci')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upravit expiraci přístupu</DialogTitle>
            <DialogDescription>
              Organizace <strong>{organizationName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Datum expirace</Label>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ukládání...' : 'Uložit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
