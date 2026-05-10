'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  getOutboxSummary,
  getOutboxEvents,
  replayDeadEvents,
  type OutboxEvent,
  type OutboxSummaryItem,
  type GetOutboxEventsParams,
  type ReplayResponse
} from '@/lib/api/outbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Loader2, RefreshCw, Play, Eye, CheckSquare } from 'lucide-react'

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

const safeString = (value: unknown, fallback = '—'): string => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

type StatusColor = 'bg-blue-100 text-blue-800' | 'bg-yellow-100 text-yellow-800' | 'bg-green-100 text-green-800' | 'bg-red-100 text-red-800' | 'bg-gray-100 text-gray-800'

const statusColorMap: Record<string, StatusColor> = {
  pending: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  dead: 'bg-red-100 text-red-800'
}

const statusLabelMap: Record<string, string> = {
  pending: 'Čekající',
  processing: 'Zpracovává se',
  sent: 'Odesláno',
  dead: 'Selhalo'
}

const getStatusColor = (status: string): StatusColor => statusColorMap[status] || 'bg-gray-100 text-gray-800'

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
      {statusLabelMap[status] || status}
    </span>
  )
}

interface StatusCounts {
  pending: number
  processing: number
  sent: number
  dead: number
}

function SummaryCards({ summary }: { summary: OutboxSummaryItem[] }) {
  const counts = useMemo(() => {
    const c: StatusCounts = { pending: 0, processing: 0, sent: 0, dead: 0 }
    for (const item of summary) {
      if (item.status in c) {
        c[item.status as keyof StatusCounts] += Number(item.count)
      }
    }
    return c
  }, [summary])

  const cards: { label: string; status: keyof StatusCounts; color: string }[] = [
    { label: 'Čekající', status: 'pending', color: 'border-blue-200 bg-blue-50' },
    { label: 'Zpracovávané', status: 'processing', color: 'border-yellow-200 bg-yellow-50' },
    { label: 'Odeslané', status: 'sent', color: 'border-green-200 bg-green-50' },
    { label: 'Selhané', status: 'dead', color: 'border-red-200 bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.status} className={`rounded-lg border p-4 ${card.color}`}>
          <div className="text-sm font-medium text-muted-foreground">{card.label}</div>
          <div className="text-2xl font-bold mt-1">{counts[card.status]}</div>
        </div>
      ))}
    </div>
  )
}


function OutboxPageContent() {
  const [events, setEvents] = useState<OutboxEvent[]>([])
  const [summary, setSummary] = useState<OutboxSummaryItem[]>([])
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [replayLoading, setReplayLoading] = useState(false)
  const [replayResult, setReplayResult] = useState<ReplayResponse | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const eventTypes = useMemo(() => {
    const types = new Set<string>()
    for (const item of summary) {
      types.add(item.event_type)
    }
    return Array.from(types).sort()
  }, [summary])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const response = await getOutboxSummary()
      setSummary(response.summary || [])
    } catch (err) {
      console.error('Nepodařilo se načíst souhrn outboxu:', err)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: GetOutboxEventsParams = { page, limit }
      if (statusFilter) params.status = statusFilter
      if (eventTypeFilter) params.event_type = eventTypeFilter

      const response = await getOutboxEvents(params)
      setEvents(response.data || [])
      setTotal(response.pagination?.total || 0)
      setTotalPages(response.pagination?.totalPages || 1)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se načíst události outboxu'
      setError(message)
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, eventTypeFilter])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const refreshAll = () => {
    loadSummary()
    loadEvents()
    setSelectedIds(new Set())
    setReplayResult(null)
  }

  const canGoPrev = page > 0
  const canGoNext = page + 1 < totalPages

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const deadEvents = events.filter(e => e.status === 'dead')
    if (deadEvents.length === 0) return
    const allSelected = deadEvents.every(e => selectedIds.has(e.id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        deadEvents.forEach(e => next.delete(e.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        deadEvents.forEach(e => next.add(e.id))
        return next
      })
    }
  }

  const handleReplay = async (execute: boolean) => {
    setReplayLoading(true)
    setReplayResult(null)
    try {
      const body: { execute: boolean; ids?: string[]; eventType?: string } = { execute }
      if (selectedIds.size > 0) {
        body.ids = Array.from(selectedIds)
      } else if (eventTypeFilter) {
        body.eventType = eventTypeFilter
      }
      const result = await replayDeadEvents(body)
      setReplayResult(result)
      if (execute) {
        refreshAll()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Opětovné zpracování selhalo'
      setError(message)
    } finally {
      setReplayLoading(false)
      setConfirmDialogOpen(false)
    }
  }

  const replayDescription = selectedIds.size > 0
    ? `${selectedIds.size} vybraných událostí`
    : eventTypeFilter
      ? `všechny selhané události typu „${eventTypeFilter}"`
      : 'všechny selhané události'

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outbox</h1>
          <p className="text-gray-600 mt-1">Přehled asynchronních side-effect událostí systému.</p>
        </div>
        <Button variant="outline" onClick={refreshAll} disabled={loading || summaryLoading}>
          {(loading || summaryLoading) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Obnovit
        </Button>
      </div>

      {summaryLoading ? (
        <div className="flex items-center text-gray-500 text-sm">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Načítám souhrn...
        </div>
      ) : (
        <SummaryCards summary={summary} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Opětovné zpracování selhaných událostí</CardTitle>
          <CardDescription>
            Znovu zpracovat selhané události. Vyberte konkrétní události v tabulce nebo filtrujte podle typu události.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Cíl: <strong>{replayDescription}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleReplay(false)}
              disabled={replayLoading}
            >
              {replayLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Náhled
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={replayLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Spustit
            </Button>
          </div>

          {replayResult && (
            <div className="rounded-md border p-4 space-y-2">
              <div className="text-sm">
                <strong>Režim:</strong> {replayResult.mode === 'preview' ? 'Náhled' : 'Provedeno'}
                {' · '}
                <strong>Výběr:</strong> {safeString(replayResult.selection)}
              </div>
              <div className="text-sm">
                <strong>Nalezeno:</strong> {replayResult.matchedCount}
                {' · '}
                <strong>Přehráno:</strong> {replayResult.replayedCount}
              </div>
              {replayResult.events.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Události ({replayResult.events.length})</div>
                  <div className="max-h-40 overflow-auto rounded-md border text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-2 py-1 text-left">ID</th>
                          <th className="px-2 py-1 text-left">Typ události</th>
                          <th className="px-2 py-1 text-left">Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        {replayResult.events.map((e) => (
                          <tr key={e.id} className="border-b">
                            <td className="px-2 py-1 font-mono">{e.id.slice(0, 8)}…</td>
                            <td className="px-2 py-1">{e.event_type}</td>
                            <td className="px-2 py-1"><StatusBadge status={e.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Události</CardTitle>
              <CardDescription>Nalezeno: {total}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) => {
                  setPage(0)
                  setStatusFilter(value === 'all' ? '' : value)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Stav" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="pending">Čekající</SelectItem>
                  <SelectItem value="processing">Zpracovává se</SelectItem>
                  <SelectItem value="sent">Odesláno</SelectItem>
                  <SelectItem value="dead">Selhalo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={eventTypeFilter || 'all'}
                onValueChange={(value) => {
                  setPage(0)
                  setEventTypeFilter(value === 'all' ? '' : value)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Typ události" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny typy</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setPage(0)
                  setLimit(Number(value))
                }}
              >
                <SelectTrigger className="w-[130px]">
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
                    <TableHead className="w-[40px]">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-accent rounded"
                        title="Vybrat/odebrat všechny selhané"
                      >
                        <CheckSquare className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[170px]">Čas</TableHead>
                    <TableHead>Typ události</TableHead>
                    <TableHead className="w-[120px]">Stav</TableHead>
                    <TableHead>Agregát</TableHead>
                    <TableHead className="w-[80px]">Pokusy</TableHead>
                    <TableHead>Chyba</TableHead>
                    <TableHead className="w-[90px] text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <div className="inline-flex items-center text-gray-500">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Načítám události...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Žádné události pro daný filtr.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => {
                      const expanded = !!expandedRows[event.id]
                      const selected = selectedIds.has(event.id)
                      const isDead = event.status === 'dead'
                      const payloadJson = stringifyJson(event.payload)
                      const resultMetaJson = stringifyJson(event.result_meta)
                      const errorText = safeString(event.last_error, '—')

                      return (
                        <Fragment key={event.id}>
                          <TableRow className={selected ? 'bg-blue-50' : undefined}>
                            <TableCell>
                              {isDead && (
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleSelect(event.id)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{formatDateTime(event.created_at)}</TableCell>
                            <TableCell>
                              <span className="font-medium text-sm">{event.event_type}</span>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={event.status} />
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{event.aggregate_type || '—'}</div>
                              <div className="text-xs text-muted-foreground break-all">{event.aggregate_id || '—'}</div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {event.attempts}/{event.max_attempts}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-red-600 max-w-[200px] truncate" title={errorText !== '—' ? errorText : undefined}>
                                {errorText}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isDead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={() => {
                                      setSelectedIds(new Set([event.id]))
                                      setConfirmDialogOpen(true)
                                    }}
                                    title="Znovu zpracovat tuto událost"
                                  >
                                    <Play className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => toggleRow(event.id)}>
                                  {expanded ? 'Skrýt' : 'Detail'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {expanded && (
                            <TableRow key={`${event.id}-detail`}>
                              <TableCell colSpan={8}>
                                <div className="space-y-3 p-2">
                                  <div className="text-xs text-muted-foreground">
                                    ID: <span className="font-mono">{event.id}</span>
                                    {' · '}
                                    Klíč idempotence: <span className="font-mono">{event.idempotency_key || '—'}</span>
                                    {' · '}
                                    Zamčeno kým: <span className="font-mono">{event.locked_by || '—'}</span>
                                    {' · '}
                                    Zamčeno v: <span className="font-mono">{formatDateTime(event.locked_at)}</span>
                                  </div>
                                  {event.last_error && (
                                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap break-all">
                                      {safeString(event.last_error, '(bez popisu chyby)')}
                                    </div>
                                  )}
                                  {payloadJson && (
                                    <div>
                                      <div className="text-xs font-medium mb-1">Obsah (payload)</div>
                                      <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{payloadJson}</pre>
                                    </div>
                                  )}
                                  {resultMetaJson && (
                                    <div>
                                      <div className="text-xs font-medium mb-1">Metadata výsledku</div>
                                      <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">{resultMetaJson}</pre>
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

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potvrdit opětovné zpracování</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete znovu zpracovat {replayDescription}? Tato akce přepne selhané události zpět do fronty a znovu je zpracuje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleReplay(true)}>
              {replayLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Spustit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ProtectedOutboxPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin']}>
      <OutboxPageContent />
    </ProtectedRoute>
  )
}
