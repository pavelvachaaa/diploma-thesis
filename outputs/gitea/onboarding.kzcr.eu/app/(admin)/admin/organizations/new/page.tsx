import Link from 'next/link'
import { ArrowLeft, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageErrorBoundary } from '@/components/admin'
import { requireAuth } from '@/lib/server/auth'
import OrganizationForm from '../components/OrganizationForm'

/**
 * Organization create page - Server Component with RSC pattern
 */
export default async function OrganizationNewPage() {
  await requireAuth(['super_admin'])

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
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
              <h1 className="text-3xl font-bold text-gray-900">Nová organizace</h1>
              <p className="text-sm text-gray-600 mt-1">Vytvořte novou organizaci v systému</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <OrganizationForm mode="create" />
      </div>
    </AdminPageErrorBoundary>
  )
}

export const metadata = {
  title: 'Nová organizace',
  description: 'Vytvořte novou organizaci v systému'
}
export const dynamic = 'force-dynamic';
