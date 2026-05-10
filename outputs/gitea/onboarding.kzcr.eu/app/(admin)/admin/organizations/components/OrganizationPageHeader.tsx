import { ArrowLeft, Building } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReactNode } from 'react'

interface OrganizationPageHeaderProps {
  backHref: string
  backLabel: string
  title: string | ReactNode
  subtitle?: string
  action?: ReactNode
  loading?: boolean
}

export default function OrganizationPageHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  action,
  loading = false
}: OrganizationPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            {loading ? (
              <>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
              </>
            )}
          </div>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-10 w-24" />
      ) : (
        action
      )}
    </div>
  )
}
