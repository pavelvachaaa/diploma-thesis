import Link from 'next/link'
import { ArrowLeft, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageErrorBoundary } from '@/components/admin'
import { requireAuth } from '@/lib/server/auth'
import { getOrganizationByIdServer } from '@/lib/server/organizations'
import { notFound } from 'next/navigation'
import OrganizationForm from '../../components/OrganizationForm'
import type { Organization } from '@/lib/api/organizations'

/**
 * Organization edit page - Server Component with RSC pattern
 */
export default async function OrganizationEditPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth(['super_admin'])

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

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/admin/organizations/${organizationId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na detail
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upravit organizaci</h1>
              <p className="text-sm text-gray-600 mt-1">Upravte základní informace organizace</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <OrganizationForm
          mode="edit"
          organization={organization}
        />
      </div>
    </AdminPageErrorBoundary>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const organization = await getOrganizationByIdServer(id)
    return {
      title: `Upravit ${organization.name}`,
      description: `Úprava organizace ${organization.name}`
    }
  } catch {
    return {
      title: 'Upravit organizaci',
      description: 'Úprava organizace'
    }
  }
}

export const dynamic = 'force-dynamic';
