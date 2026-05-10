'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

/**
 * Error boundary for organizations page.
 * Catches errors during rendering, data fetching, or server actions.
 *
 * Automatically used by Next.js when page.tsx throws an error.
 *
 * @example
 * // Error thrown in server component
 * throw new Error('Failed to fetch organizations')
 */
export default function OrganizationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Organizations page error:', error)
  }, [error])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle>Chyba při načítání organizací</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || 'Nastala neočekávaná chyba při načítání seznamu organizací.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Zkuste to prosím znovu. Pokud problém přetrvává, kontaktujte technickou podporu.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>
              Zkusit znovu
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              Zpět na hlavní stránku
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
