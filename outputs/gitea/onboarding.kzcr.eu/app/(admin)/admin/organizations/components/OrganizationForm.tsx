'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, Upload } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import toast from 'react-hot-toast'
import {
  createOrganizationAction,
  updateOrganizationAction
} from '../actions'
import {
  deleteOrganizationContactPhoto,
  type Organization,
  uploadOrganizationContactPhoto
} from '@/lib/api/organizations'

const MAX_CONTACT_PHOTO_SIZE = 5 * 1024 * 1024

const getUploadErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return 'Nepodařilo se nahrát fotku'
  }

  if (error.message.includes('413') || error.message.toLowerCase().includes('body exceeded')) {
    return 'Fotka je příliš velká. Maximální velikost je 5 MB.'
  }

  return error.message || 'Nepodařilo se nahrát fotku'
}

interface OrganizationFormProps {
  mode: 'create' | 'edit'
  organization?: Organization
}

export default function OrganizationForm({
  mode,
  organization
}: OrganizationFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoInputKey, setPhotoInputKey] = useState(0)

  const handleCancel = () => {
    if (mode === 'edit' && organization) {
      router.push(`/admin/organizations/${organization.id}`)
    } else {
      router.push('/admin/organizations')
    }
  }

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    seat_location: organization?.seat_location || '',
    address: organization?.address || '',
    contact_email: organization?.contact_email || '',
    contact_name: organization?.contact_name || '',
    contact_phone: organization?.contact_phone || '',
    contact_linkedin_url: organization?.contact_linkedin_url || '',
  })

  const currentPhotoUrl = mode === 'edit'
    ? organization?.contact_photo_url || null
    : null
  const initials = (formData.contact_name || formData.name || 'HR')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Název organizace je povinný')
      return
    }

    startTransition(async () => {
      const result = mode === 'create'
        ? await createOrganizationAction(formData)
        : await updateOrganizationAction(organization!.id, formData)

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'Organizace byla úspěšně vytvořena'
            : 'Organizace byla úspěšně upravena'
        )
        router.push(`/admin/organizations/${result.data.id}`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handlePhotoUpload = () => {
    if (!organization) return
    const file = photoFiles[0]

    if (!file) {
      toast.error('Nejprve vyberte fotku')
      return
    }

    if (file.size > MAX_CONTACT_PHOTO_SIZE) {
      toast.error('Fotka je příliš velká. Maximální velikost je 5 MB.')
      return
    }

    startTransition(async () => {
      try {
        const payload = new FormData()
        payload.append('file', file)

        await uploadOrganizationContactPhoto(organization.id, payload)
        toast.success('Fotka byla úspěšně nahrána')
        setPhotoFiles([])
        setPhotoInputKey((value) => value + 1)
        router.refresh()
      } catch (error) {
        toast.error(getUploadErrorMessage(error))
      }
    })
  }

  const handlePhotoDelete = () => {
    if (!organization?.contact_photo_file_id) return

    startTransition(async () => {
      try {
        await deleteOrganizationContactPhoto(organization.id)
        toast.success('Fotka byla odstraněna')
        setPhotoFiles([])
        setPhotoInputKey((value) => value + 1)
        router.refresh()
      } catch (error) {
        toast.error(getUploadErrorMessage(error))
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Základní informace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Název organizace <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Např. Nemocnice Brno"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seat_location">Kód sídla</Label>
              <Input
                id="seat_location"
                value={formData.seat_location}
                onChange={(e) => setFormData({ ...formData, seat_location: e.target.value })}
                placeholder="Např. BRN, PHA"
                maxLength={3}
                disabled={isPending}
              />
              <p className="text-sm text-gray-500">Maximálně 3 znaky</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Např. Jihlavská 20, 625 00 Brno"
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">HR kontakt</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Např. Jana Nováková"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="Např. 723 191530"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Kontaktní e-mail</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="Např. hr@nemocnice.cz"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_linkedin_url">LinkedIn URL</Label>
                <Input
                  id="contact_linkedin_url"
                  type="url"
                  value={formData.contact_linkedin_url}
                  onChange={(e) => setFormData({ ...formData, contact_linkedin_url: e.target.value })}
                  placeholder="https://www.linkedin.com/in/..."
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {isPending
                  ? mode === 'create' ? 'Vytváření...' : 'Ukládání...'
                  : mode === 'create' ? 'Vytvořit organizaci' : 'Uložit změny'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                Zrušit
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {mode === 'edit' && organization && (
        <Card>
          <CardHeader>
            <CardTitle>Fotka HR kontaktu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border border-slate-200">
                {currentPhotoUrl && <AvatarImage src={currentPhotoUrl} alt={formData.contact_name || formData.name} />}
                <AvatarFallback className="text-lg font-semibold text-slate-700">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {formData.contact_name || formData.name || 'HR kontakt'}
                </p>
                <p className="text-sm text-slate-500">
                  Nahrajte portrét ve formátu JPG nebo PNG do 5 MB.
                </p>
              </div>
            </div>

            <FileUpload
              key={photoInputKey}
              onFilesChange={setPhotoFiles}
              multiple={false}
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              maxSize={MAX_CONTACT_PHOTO_SIZE}
            />

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handlePhotoUpload}
                disabled={isPending || photoFiles.length === 0}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isPending ? 'Nahrávání...' : 'Nahrát fotku'}
              </Button>

              {organization.contact_photo_file_id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handlePhotoDelete}
                  disabled={isPending}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Odstranit fotku
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
