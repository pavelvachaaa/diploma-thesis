'use client'

import { Fragment, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { hasAnyRole } from '@/lib/roleUtils'
import { getEmployeeAuditEvents } from '@/lib/api/employees'
import type { AuditEvent } from '@/lib/api/audit-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface EmployeeAuditLogsProps {
  employeeId: string
}

const DEFAULT_LIMIT = 10

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const stringifyJson = (value: unknown) => {
  if (value === null || value === undefined) return null

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function EmployeeAuditLogs({ employeeId }: EmployeeAuditLogsProps) {
  const { roles, loading: authLoading } = useAuth()
  const isSuperAdmin = hasAnyRole(roles, ['super_admin'])

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [refreshNonce, setRefreshNonce] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT))
  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

  useEffect(() => {
    if (authLoading || !isSuperAdmin || !employeeId) {
      return
    }

    let active = true

    const loadEvents = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getEmployeeAuditEvents(employeeId, {
          page,
          limit: DEFAULT_LIMIT
        })

        if (!active) return

        setEvents(response.data || [])
        setTotal(response.total || 0)
      } catch (err) {
        if (!active) return
        setEvents([])
        setTotal(0)
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst audit logy zaměstnance')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      active = false
    }
  }, [authLoading, employeeId, isSuperAdmin, page, refreshNonce])

  if (authLoading || !isSuperAdmin) {
    return null
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Audit logy zaměstnance</CardTitle>
            <CardDescription>Akce, které tento uživatel provedl, i změny provedené nad tímto zaměstnancem.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setRefreshNonce((prev) => prev + 1)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Obnovit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[190px]">Čas</TableHead>
                  <TableHead>Událost</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Zdroj</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="w-[110px] text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <div className="inline-flex items-center text-gray-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Načítám audit logy...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Pro tohoto zaměstnance zatím nejsou žádné audit události.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const expanded = !!expandedRows[event.id]
                    const metadataJson = stringifyJson(event.metadata)
                    const beforeJson = stringifyJson(event.before_state)
                    const afterJson = stringifyJson(event.after_state)

                    return (
                      <Fragment key={event.id}>
                        <TableRow>
                          <TableCell>{formatDateTime(event.occurred_at)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{event.action || '—'}</div>
                            <div className="text-xs text-muted-foreground">{event.category || '—'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={event.status === 'failure' ? 'destructive' : 'secondary'}>
                              {event.status || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{event.resource_type || '—'}</div>
                            <div className="break-all text-xs text-muted-foreground">{event.resource_id || '—'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm uppercase">{event.method || '—'}</div>
                            <div className="break-all text-xs text-muted-foreground">{event.path || '—'}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => toggleRow(event.id)}>
                              {expanded ? 'Skrýt' : 'Zobrazit'}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {expanded && (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <div className="space-y-3 p-2">
                                <div className="text-xs text-muted-foreground">
                                  request_id: <span className="font-mono">{event.request_id || '—'}</span>
                                  {' · '}
                                  status_code: <span className="font-mono">{event.status_code ?? '—'}</span>
                                </div>
                                {event.error_message && (
                                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {event.error_message}
                                  </div>
                                )}
                                {metadataJson && (
                                  <div>
                                    <div className="mb-1 text-xs font-medium">metadata</div>
                                    <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{metadataJson}</pre>
                                  </div>
                                )}
                                {(beforeJson || afterJson) && (
                                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                    <div>
                                      <div className="mb-1 text-xs font-medium">before_state</div>
                                      <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{beforeJson || '—'}</pre>
                                    </div>
                                    <div>
                                      <div className="mb-1 text-xs font-medium">after_state</div>
                                      <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{afterJson || '—'}</pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Nalezeno: {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => prev - 1)} disabled={!canGoPrev || loading}>
              Předchozí
            </Button>
            <span className="text-sm text-muted-foreground">
              Stránka {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => prev + 1)} disabled={!canGoNext || loading}>
              Další
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
