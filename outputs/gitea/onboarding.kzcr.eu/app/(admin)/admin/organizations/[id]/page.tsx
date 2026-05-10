import Link from 'next/link'
import { ArrowLeft, Edit, Building, Mail, Phone, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminPageErrorBoundary } from '@/components/admin'
import { requireAuth } from '@/lib/server/auth'
import { getOrganizationByIdServer } from '@/lib/server/organizations'
import { notFound } from 'next/navigation'
import { type Organization } from '@/lib/api/organizations'

/**
 * Organization detail page - Server Component with RSC pattern
 */
export default async function OrganizationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  // 1. Authenticate user
  const user = await requireAuth(['super_admin'])
  const canEdit = user.roles.includes('super_admin')

  const { id: organizationId } = await params

  let organization: Organization
  try {
    organization = await getOrganizationByIdServer(organizationId)
  } catch {
    notFound()
  }

  if (!organization) {
    notFound()
  }

  const photoUrl = organization.contact_photo_url || null
  const initials = (organization.contact_name || organization.name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HR'

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/organizations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na seznam
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-sm text-gray-600 mt-1">Detail organizace</p>
              </div>
            </div>
          </div>
          {canEdit && (
            <Link href={`/admin/organizations/${organizationId}/edit`} prefetch={false}>
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Upravit
              </Button>
            </Link>
          )}
        </div>

        {/* Organization details */}
        <Card>
          <CardHeader>
            <CardTitle>Základní informace</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Název organizace</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.name}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Kód sídla</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.seat_location || '-'}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Adresa</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.address || '-'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Kontaktní e-mail</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.contact_email ? (
                    <a href={`mailto:${organization.contact_email}`} className="text-blue-600 hover:underline">
                      {organization.contact_email}
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HR kontakt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 border border-slate-200">
                {photoUrl && <AvatarImage src={photoUrl} alt={organization.contact_name || organization.name} />}
                <AvatarFallback className="text-lg font-semibold text-slate-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-900">
                  {organization.contact_name || '-'}
                </p>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  HR_SPECIALISTA
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Jméno</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.contact_name || '-'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.contact_phone ? (
                    <a href={`tel:${organization.contact_phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline">
                      <Phone className="h-4 w-4" />
                      {organization.contact_phone}
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.contact_email ? (
                    <a href={`mailto:${organization.contact_email}`} className="inline-flex items-center gap-2 text-blue-600 hover:underline">
                      <Mail className="h-4 w-4" />
                      {organization.contact_email}
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.contact_linkedin_url ? (
                    <a
                      href={organization.contact_linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      Otevřít profil
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </AdminPageErrorBoundary>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const organization = await getOrganizationByIdServer(id)
    return {
      title: `${organization.name} - Detail organizace`,
      description: `Detail organizace ${organization.name}`
    }
  } catch {
    return {
      title: 'Organizace nenalezena',
      description: 'Detail organizace'
    }
  }
}

export const dynamic = 'force-dynamic';
