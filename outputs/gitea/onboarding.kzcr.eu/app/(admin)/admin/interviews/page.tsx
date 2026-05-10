"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminTable, type TableColumn } from "@/components/admin"
import {
  Calendar,
  List,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  XCircle,
  Building,
  Video,
  MapPin,
  Clock,
  User
} from "lucide-react"
import {
  getAllInterviews,
  type Interview,
  type InterviewFilters,
  type InterviewStatus
} from "@/lib/api/interviews"
import {
  getStatusBadgeClass,
  getStatusLabel,
  formatInterviewDateTime,
  formatInterviewDate,
  formatInterviewTime,
  formatDuration,
  getLocationIcon,
  getLocationTypeLabel,
  isUpcoming,
  isToday,
  getTimeUntilInterview
} from "./utils/interviewUtils"
import { useDebounce } from "@/hooks/useDebounce"
import toast from "react-hot-toast"
import CreateInterviewDialog from "./components/CreateInterviewDialog"
import InterviewCalendarView from "./components/InterviewCalendarView"
import { useAuth } from "@/context/AuthContext"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"

export default function AdminInterviewsPage() {
  const { roles } = useAuth()
  const adminAccess = getAdminAccessConfig(roles)
  const interviewCapabilities = adminAccess.capabilities.interviews
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("upcoming")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchInterviews()
  }, [debouncedSearchTerm, statusFilter, dateRangeFilter])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: InterviewFilters = {
        limit: 100
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filters.status = statusFilter as InterviewStatus
      }

      // Apply date range filter
      const now = new Date()
      if (dateRangeFilter === "upcoming") {
        filters.startDate = now.toISOString()
      } else if (dateRangeFilter === "past") {
        filters.endDate = now.toISOString()
      } else if (dateRangeFilter === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        filters.startDate = todayStart.toISOString()
        filters.endDate = todayEnd.toISOString()
      } else if (dateRangeFilter === "week") {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() + 7)
        filters.startDate = now.toISOString()
        filters.endDate = weekEnd.toISOString()
      }

      const data = await getAllInterviews(filters)

      // Apply client-side search filter if needed
      let filteredData = data
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase()
        filteredData = data.filter(interview =>
          interview.title.toLowerCase().includes(searchLower) ||
          interview.applicant_name.toLowerCase().includes(searchLower) ||
          interview.applicant_surname.toLowerCase().includes(searchLower) ||
          `${interview.applicant_name} ${interview.applicant_surname}`.toLowerCase().includes(searchLower)
        )
      }

      setInterviews(filteredData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se načíst pohovory'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchInterviews()
  }

  const handleInterviewCreated = () => {
    setIsCreateDialogOpen(false)
    fetchInterviews()
    toast.success('Pohovor byl úspěšně vytvořen')
  }

  const getLocationIconComponent = (locationType: string) => {
    const Icon = getLocationIcon(locationType as any)
    return <Icon className="h-4 w-4" />
  }

  // Define columns for AdminTable
  const interviewColumns: TableColumn<Interview>[] = [
    {
      key: 'title',
      title: 'Název',
      sortable: true,
      render: (value, interview) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            {interview.applicant_name} {interview.applicant_surname}
          </div>
        </div>
      )
    },
    {
      key: 'scheduled_at',
      title: 'Datum a čas',
      sortable: true,
      render: (value, interview) => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">{formatInterviewDate(value)}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatInterviewTime(value)}
            {isToday(value) && (
              <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                Dnes
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'duration_minutes',
      title: 'Délka',
      render: (value) => formatDuration(value)
    },
    {
      key: 'location_type',
      title: 'Místo',
      render: (value, interview) => (
        <div className="flex items-center gap-2">
          {getLocationIconComponent(value)}
          <span className="text-sm">
            {getLocationTypeLabel(value as any)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <Badge variant="outline" className={getStatusBadgeClass(value as InterviewStatus)}>
          {getStatusLabel(value as InterviewStatus)}
        </Badge>
      )
    },
    {
      key: 'participant_count',
      title: 'Účastníci',
      render: (value) => (
        <div className="flex items-center gap-1">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{value || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Akce',
      className: 'text-right',
      render: (_, interview) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/interviews/${interview.id}`} prefetch={false}>
            <Button variant="ghost" size="sm" title="Zobrazit detail">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
  ]

  // Upcoming interviews count
  const upcomingCount = interviews.filter(i => isUpcoming(i)).length
  const todayCount = interviews.filter(i => isToday(i.scheduled_at)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pohovory</h1>
          <p className="text-muted-foreground">Správa pohovorů s uchazeči</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Obnovit
          </Button>
          {interviewCapabilities.canMutate && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Naplánovat pohovor
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkem pohovorů</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nadcházející</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dnes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Přehled pohovorů</CardTitle>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  Seznam
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Kalendář
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat podle názvu nebo uchazeče..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny stavy</SelectItem>
                <SelectItem value="scheduled">Naplánováno</SelectItem>
                <SelectItem value="confirmed">Potvrzeno</SelectItem>
                <SelectItem value="completed">Dokončeno</SelectItem>
                <SelectItem value="cancelled">Zrušeno</SelectItem>
                <SelectItem value="no_show">Nedostavil se</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Časové období" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny</SelectItem>
                <SelectItem value="today">Dnes</SelectItem>
                <SelectItem value="upcoming">Nadcházející</SelectItem>
                <SelectItem value="week">Příští týden</SelectItem>
                <SelectItem value="past">Proběhlé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'list' ? (
            <AdminTable
              data={interviews}
              columns={interviewColumns}
              loading={loading}
              error={error}
              emptyMessage="Žádné pohovory nenalezeny"
            />
          ) : (
            <InterviewCalendarView
              interviews={interviews}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Interview Dialog */}
      {interviewCapabilities.canMutate && (
        <CreateInterviewDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleInterviewCreated}
        />
      )}
    </div>
  )
}
