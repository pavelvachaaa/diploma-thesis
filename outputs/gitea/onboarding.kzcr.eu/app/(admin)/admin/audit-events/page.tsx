'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getAuditEvents, type AuditEvent, type GetAuditEventsParams } from '@/lib/api/audit-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Loader2, RefreshCw } from 'lucide-react'

type FiltersState = {
  actorUserId: string
  category: string
  action: string
  status: string
  resourceType: string
  resourceId: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: FiltersState = {
  actorUserId: '',
  category: '',
  action: '',
  status: '',
  resourceType: '',
  resourceId: '',
  dateFrom: '',
  dateTo: ''
}

const DEFAULT_LIMIT = 50

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

function AuditEventsPageContent() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(EMPTY_FILTERS)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: GetAuditEventsParams = {
        page,
        limit
      }

      if (appliedFilters.actorUserId) params.actorUserId = appliedFilters.actorUserId
      if (appliedFilters.category) params.category = appliedFilters.category
      if (appliedFilters.action) params.action = appliedFilters.action
      if (appliedFilters.status) params.status = appliedFilters.status
      if (appliedFilters.resourceType) params.resourceType = appliedFilters.resourceType
      if (appliedFilters.resourceId) params.resourceId = appliedFilters.resourceId
      if (appliedFilters.dateFrom) params.dateFrom = appliedFilters.dateFrom
      if (appliedFilters.dateTo) params.dateTo = appliedFilters.dateTo

      const response = await getAuditEvents(params)
      setEvents(response.data || [])
      setTotal(response.total || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se načíst audit události'
      setError(message)
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, limit, page])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const totalPages = useMemo(() => {
    const calculated = Math.ceil(total / limit)
    return calculated > 0 ? calculated : 1
  }, [limit, total])

  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

  const applyFilters = () => {
    setPage(0)
    setAppliedFilters({
      actorUserId: filters.actorUserId.trim(),
      category: filters.category.trim(),
      action: filters.action.trim(),
      status: filters.status.trim(),
      resourceType: filters.resourceType.trim(),
      resourceId: filters.resourceId.trim(),
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    })
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(0)
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit události</h1>
          <p className="text-gray-600 mt-1">Centrální audit manipulací s daty, e-mailů a chyb systému.</p>
        </div>
        <Button variant="outline" onClick={loadEvents} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Obnovit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
          <CardDescription>Filtry jsou přesné shody, datum používá lokální čas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Actor User ID"
              value={filters.actorUserId}
              onChange={(e) => setFilters((prev) => ({ ...prev, actorUserId: e.target.value }))}
            />
            <Input
              placeholder="Category (např. applicant)"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            />
            <Input
              placeholder="Action (např. applicant.update)"
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
            />
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? '' : value
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Vše</SelectItem>
                <SelectItem value="success">success</SelectItem>
                <SelectItem value="failure">failure</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Resource type (např. job)"
              value={filters.resourceType}
              onChange={(e) => setFilters((prev) => ({ ...prev, resourceType: e.target.value }))}
            />
            <Input
              placeholder="Resource ID"
              value={filters.resourceId}
              onChange={(e) => setFilters((prev) => ({ ...prev, resourceId: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
            <Input
              type="datetime-local"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={applyFilters}>Použít filtry</Button>
            <Button variant="outline" onClick={resetFilters}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Výsledky</CardTitle>
              <CardDescription>Nalezeno: {total}</CardDescription>
            </div>
            <div className="w-[140px]">
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setPage(0)
                  setLimit(Number(value))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 / stránka</SelectItem>
                  <SelectItem value="50">50 / stránka</SelectItem>
                  <SelectItem value="100">100 / stránka</SelectItem>
                  <SelectItem value="200">200 / stránka</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[190px]">Čas</TableHead>
                    <TableHead>Událost</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Zdroj</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead className="w-[110px] text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="inline-flex items-center text-gray-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Načítám audit události...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Žádné audit události pro daný filtr.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => {
                      const metadataJson = stringifyJson(event.metadata)
                      const beforeJson = stringifyJson(event.before_state)
                      const afterJson = stringifyJson(event.after_state)
                      const expanded = !!expandedRows[event.id]

                      return (
                        <Fragment key={event.id}>
                          <TableRow key={event.id}>
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
                              <div className="text-sm">{event.actor_email || event.actor_user_id || 'system'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{event.resource_type || '—'}</div>
                              <div className="text-xs text-muted-foreground break-all">{event.resource_id || '—'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm uppercase">{event.method || '—'}</div>
                              <div className="text-xs text-muted-foreground break-all">{event.path || '—'}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => toggleRow(event.id)}>
                                {expanded ? 'Skrýt' : 'Zobrazit'}
                              </Button>
                            </TableCell>
                          </TableRow>

                          {expanded && (
                            <TableRow key={`${event.id}-detail`}>
                              <TableCell colSpan={7}>
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
                                      <div className="text-xs font-medium mb-1">metadata</div>
                                      <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{metadataJson}</pre>
                                    </div>
                                  )}
                                  {(beforeJson || afterJson) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                      <div>
                                        <div className="text-xs font-medium mb-1">before_state</div>
                                        <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{beforeJson || '—'}</pre>
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium mb-1">after_state</div>
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

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Stránka {page + 1} z {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={!canGoPrev || loading}>
                Předchozí
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!canGoNext || loading}>
                Další
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProtectedAuditEventsPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <AuditEventsPageContent />
    </ProtectedRoute>
  )
}
