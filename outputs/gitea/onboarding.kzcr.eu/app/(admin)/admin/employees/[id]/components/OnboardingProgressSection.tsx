"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Play,
  Eye,
  Calendar,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  Workflow
} from "lucide-react"
import { getEmployeeOnboardingDashboard } from "@/lib/api/admin-employee-onboarding"
import type { OnboardingDashboard, OnboardingStep } from "@/lib/api/employee_onboarding"
import FormResponsesViewer from "./FormResponsesViewer"

interface OnboardingProgressSectionProps {
  employeeId: string
}

export default function OnboardingProgressSection({ employeeId }: OnboardingProgressSectionProps) {
  const [dashboard, setDashboard] = useState<OnboardingDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [selectedStepForResponses, setSelectedStepForResponses] = useState<{
    stepId: string
    stepTitle: string
  } | null>(null)

  useEffect(() => {
    fetchOnboardingData()
  }, [employeeId])

  const fetchOnboardingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEmployeeOnboardingDashboard(employeeId)
      setDashboard(data)
      // Auto-expand in_progress steps
      const inProgressIds = new Set(
        data.steps
          .filter((s: OnboardingStep) => s.status === 'in_progress')
          .map((s: OnboardingStep, i: number) => s.user_step_id || `${s.id}-${i}`)
      )
      setExpandedSteps(inProgressIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje o onboardingu')
      console.error('Error fetching onboarding data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStepStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Dokončen'
      case 'in_progress': return 'Probíhá'
      case 'skipped': return 'Přeskočen'
      case 'not_started': return 'Nezahájen'
      default: return status
    }
  }

  const getStepStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'in_progress': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'skipped': return 'bg-slate-50 text-slate-500 border-slate-200'
      default: return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'form': return <FileText className="h-3 w-3" />
      case 'ack': return <CheckCircle className="h-3 w-3" />
      case 'info': return <Eye className="h-3 w-3" />
      case 'quiz': return <AlertTriangle className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'form': return 'Formulář'
      case 'ack': return 'Potvrzení'
      case 'info': return 'Informace'
      case 'quiz': return 'Test'
      default: return stepType
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getTimingLabel = (daysFromStart: number) => {
    if (daysFromStart < 0) return `${Math.abs(daysFromStart)} dní před nástupem`
    if (daysFromStart === 0) return 'První den'
    return `Den ${daysFromStart}`
  }

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getDocumentStatusIcon = (status: string, filePath: string | null) => {
    if (!filePath) return <Clock className="h-4 w-4 text-amber-500" />
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-rose-500" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getDocumentStatusBadge = (status: string, filePath: string | null) => {
    if (!filePath) return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">Nenahrán</Badge>
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">Schváleno</Badge>
      case 'rejected': return <Badge className="bg-rose-50 text-rose-700 border border-rose-100 text-xs">Zamítnuto</Badge>
      case 'pending': return <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">Čeká na schválení</Badge>
      default: return <Badge className="bg-slate-50 text-slate-500 border border-slate-200 text-xs">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Průběh onboardingu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Průběh onboardingu</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Nepodařilo se načíst údaje o onboardingu'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const overallProgress = Math.round(dashboard.progress.overall_progress)
  const steps = dashboard.steps.slice().sort((a: OnboardingStep, b: OnboardingStep) => a.days_from_start - b.days_from_start)

  return (
    <div className="space-y-6">
      {/* Progress Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Průběh onboardingu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Celkový pokrok</span>
              <span className="text-2xl font-bold text-gray-900">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-3xl font-bold text-emerald-700">
                {dashboard.progress.steps.completed}
                <span className="text-lg text-emerald-400">/{dashboard.progress.steps.total}</span>
              </p>
              <p className="text-sm font-medium text-emerald-800 mt-1 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Dokončené kroky
              </p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-3xl font-bold text-indigo-700">
                {dashboard.progress.documents.uploaded}
                <span className="text-lg text-indigo-400">/{dashboard.progress.documents.total}</span>
              </p>
              <p className="text-sm font-medium text-indigo-800 mt-1 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Nahrané dokumenty
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-lg font-bold text-slate-700 leading-tight">
                {formatDateShort(dashboard.user.start_date)}
              </p>
              <p className="text-sm font-medium text-slate-600 mt-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Datum nástupu
              </p>
            </div>
          </div>

          {/* Workflow Info Band */}
          <div className="rounded-xl border bg-slate-50 p-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Workflow</p>
                <p className="text-sm font-medium text-slate-800 truncate">{dashboard.user.workflow_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Organizace</p>
                <p className="text-sm font-medium text-slate-800 truncate">{dashboard.user.organization_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Nástup</p>
                <p className="text-sm font-medium text-slate-800">{formatDateShort(dashboard.user.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Zaměstnanec</p>
                <p className="text-sm font-medium text-slate-800 truncate">
                  {dashboard.user.name} {dashboard.user.surname}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps — Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Kroky onboardingu ({steps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Žádné kroky</h3>
              <p className="text-muted-foreground">
                Tento zaměstnanec nemá přiřazené žádné kroky onboardingu.
              </p>
            </div>
          ) : (
            <div className="relative pl-10">
              {/* Vertical connector line */}
              <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200" />

              {steps.map((step: OnboardingStep, index: number) => {
                const uniqueKey = step.user_step_id || `${step.id}-${index}`
                const isExpanded = expandedSteps.has(uniqueKey)
                const isLast = index === steps.length - 1

                const circleClass = step.status === 'completed'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : step.status === 'in_progress'
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : step.status === 'skipped'
                  ? 'bg-slate-300 border-slate-300 text-slate-600'
                  : 'bg-white border-slate-200 text-slate-500'

                const cardClass = step.status === 'in_progress'
                  ? 'border-indigo-200 bg-indigo-50/50'
                  : step.status === 'completed'
                  ? 'border-slate-100 bg-slate-50/30'
                  : step.status === 'skipped'
                  ? 'border-slate-200 bg-slate-50 opacity-60'
                  : 'border-slate-200 bg-white'

                return (
                  <div className="relative mb-4" key={uniqueKey}>
                    {/* Colored connector segment */}
                    {!isLast && (
                      <div className={`absolute left-[-22px] top-8 h-full w-0.5 ${step.status === 'completed' ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                    )}

                    {/* Step circle */}
                    <div className={`absolute left-[-30px] top-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 ${circleClass}`}>
                      {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : index + 1}
                    </div>

                    {/* Step card */}
                    <div className={`rounded-xl border p-4 transition-colors ${cardClass}`}>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Row 1: title + badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getStepTypeIcon(step.step_type)}
                              {getStepTypeLabel(step.step_type)}
                            </Badge>
                            {step.is_mandatory && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Povinný
                              </Badge>
                            )}
                          </div>
                          {/* Row 2: status | timing | duration | completion date */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs ${getStepStatusBadgeClass(step.status)}`}>
                              {getStepStatusLabel(step.status)}
                            </Badge>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {getTimingLabel(step.days_from_start)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              {step.duration_days} {step.duration_days === 1 ? 'den' : 'dní'}
                            </span>
                            {step.completed_at && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Dokončen {formatDateShort(step.completed_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 h-8 w-8 p-0"
                          onClick={() => toggleStepExpansion(uniqueKey)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Expanded section */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                          {step.instructions && (
                            <div className="bg-blue-50 rounded-lg p-3 text-sm">
                              <strong className="text-blue-900">Instrukce:</strong>
                              <p className="text-blue-800 mt-1">{step.instructions}</p>
                            </div>
                          )}

                          {step.step_type === 'form' && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/admin/forms/${step.id}/preview`} target="_blank">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Zobrazit formulář
                                </a>
                              </Button>
                              {step.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedStepForResponses({
                                    stepId: step.user_step_id,
                                    stepTitle: step.title
                                  })}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Zobrazit odpovědi
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Documents — compact summary table */}
      {dashboard.documents && dashboard.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Povinné dokumenty ({dashboard.documents.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y rounded-xl border overflow-hidden">
              {dashboard.documents.map((doc: { id: string; name: string; description?: string; status: string; file_path?: string | null; is_mandatory?: boolean }) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getDocumentStatusIcon(doc.status, doc.file_path ?? null)}
                    <span className="font-medium text-sm truncate">{doc.name}</span>
                    {doc.is_mandatory && (
                      <Badge className="text-xs bg-red-50 text-red-700 border border-red-200 flex-shrink-0">
                        Povinný
                      </Badge>
                    )}
                  </div>
                  {getDocumentStatusBadge(doc.status, doc.file_path ?? null)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Responses Viewer */}
      {selectedStepForResponses && (
        <FormResponsesViewer
          employeeId={employeeId}
          stepId={selectedStepForResponses.stepId}
          stepTitle={selectedStepForResponses.stepTitle}
          isOpen={!!selectedStepForResponses}
          onClose={() => setSelectedStepForResponses(null)}
        />
      )}
    </div>
  )
}
