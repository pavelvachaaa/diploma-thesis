'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import toast from 'react-hot-toast'
import type { Organization } from '@/lib/api/organizations'
import { deleteOrganizationAction } from '../actions'

interface OrganizationsTableProps {
  organizations: Organization[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  currentPage: number
  canEdit: boolean
  isSuperAdmin: boolean
}

/**
 * Client component for organizations table with interactive features.
 * Includes delete confirmation dialog and pagination controls.
 *
 * @example
 * <OrganizationsTable
 *   organizations={data}
 *   pagination={pagination}
 *   currentPage={0}
 *   isSuperAdmin={true}
 * />
 */
export default function OrganizationsTable({
  organizations,
  pagination,
  currentPage,
  canEdit,
  isSuperAdmin

}: OrganizationsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDelete = () => {
    if (!deleteId) return

    startTransition(async () => {
      const result = await deleteOrganizationAction(deleteId)

      if (result.success) {
        toast.success('Organizace byla úspěšně smazána')
        setDeleteOpen(false)
        setDeleteId(null)
        router.refresh() // Refresh server data
      } else {
        toast.error(result.error)
      }
    })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Název</TableHead>
              <TableHead>Kód sídla</TableHead>
              <TableHead>Adresa</TableHead>
              <TableHead>Kontaktní e-mail</TableHead>
              <TableHead>Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Žádné organizace nenalezeny
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.seat_location || '-'}</TableCell>
                  <TableCell>{org.address || '-'}</TableCell>
                  <TableCell>{org.contact_email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/organizations/${org.id}`} prefetch={false}>
                        <Button variant="ghost" size="sm" title="Zobrazit detail">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <>
                        {canEdit && (
                          <Link href={`/admin/organizations/${org.id}/edit`} prefetch={false}>
                            <Button variant="ghost" size="sm" title="Upravit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteId(org.id)
                              setDeleteOpen(true)
                            }}
                            title="Smazat"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                      </>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Stránka {currentPage + 1} z {pagination.totalPages}
            {' • '}
            {pagination.total} celkem
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev || isPending}
            >
              Předchozí
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext || isPending}
            >
              Další
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu smazat organizaci?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Organizace bude trvale smazána ze systému.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Mazání...' : 'Smazat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
