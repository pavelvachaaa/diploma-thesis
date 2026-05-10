"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Download,
  Eye,
  Calendar,
  FileText,
  Paperclip,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ProtectedRoute from "@/components/ProtectedRoute"
import {
  getOnboardingDashboard,
  startOnboardingStep,
  uploadDocument,
  downloadDocument,
  downloadDocumentTemplate,
  type OnboardingStep,
  type RequiredDocument,
  type OnboardingDashboard as DashboardData
} from "@/lib/api/employee_onboarding"
import toast from "react-hot-toast"

export default function EmployeeDashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOnboardingDashboard()
      setDashboardData(data)
      // Auto-expand in_progress steps
      const inProgressIds = new Set(
        data.steps
          .filter((s: OnboardingStep) => s.status === 'in_progress')
          .map((s: OnboardingStep) => s.user_step_id)
      )
      setExpandedSteps(inProgressIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToStep = (userStepId: string) => {
    router.push(`/employee/onboarding/steps/${userStepId}`)
  }

  const handleStartStep = async (step: OnboardingStep) => {
    try {
      await startOnboardingStep(step.user_step_id)
      toast.success('Krok byl spuštěn')
      router.push(`/employee/onboarding/steps/${step.user_step_id}`)
    } catch (err) {
      console.error('Error starting step:', err)
      toast.error('Nepodařilo se spustit krok')
    }
  }

  const handleFileUpload = async (documentId: string, file: File) => {
    try {
      setUploadingDocId(documentId)
      await uploadDocument(documentId, file)
      toast.success('Dokument byl úspěšně nahrán')
      await fetchDashboardData()
    } catch (err) {
      console.error('Error uploading document:', err)
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se nahrát dokument'
      toast.error(errorMessage)
    } finally {
      setUploadingDocId(null)
    }
  }

  const handleDownloadDocument = async (id: string) => {
    try {
      await downloadDocument(id)
      toast.success('Dokument byl stažen')
    } catch (err) {
      console.error('Error downloading document:', err)
      toast.error('Nepodařilo se stáhnout dokument')
    }
  }

  const handleDownloadTemplate = async (templateFile: string) => {
    try {
      await downloadDocumentTemplate(templateFile)
      toast.success('Šablona byla stažena')
    } catch (err) {
      console.error('Error downloading template:', err)
      toast.error('Nepodařilo se stáhnout šablonu')
    }
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

  if (!dashboardData && !loading) {
    return (
      <ProtectedRoute requiredRoles={['user']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-2">Nepodařilo se načíst data onboardingu</p>
            <p className="text-gray-500 text-sm">Chyba: {error}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Zkusit znovu
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const data = dashboardData
  if (!data) {
    return null
  }
  const { user, steps, documents, progress } = data

  const nextStep = steps.find((s: OnboardingStep) => s.status === 'in_progress')

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'form': return 'Formulář'
      case 'ack': return 'Potvrzení'
      case 'info': return 'Informace'
      case 'quiz': return 'Test'
      default: return stepType
    }
  }

  const getStepStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'skipped': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  const getStepStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Dokončeno'
      case 'in_progress': return 'Probíhá'
      case 'skipped': return 'Přeskočeno'
      default: return 'Nezapočato'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['user']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Načítání dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['user']}>
      <div className="space-y-5">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 shadow-lg">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-wide mb-1">
            {user?.organization_name}
          </p>
          <h1 className="text-2xl font-bold">Vítejte, {user?.name}!</h1>
          <p className="text-blue-100 mt-1">{user?.workflow_name}</p>
          {user?.start_date && (
            <div className="flex items-center gap-1.5 mt-3 text-sm text-blue-200">
              <Calendar className="h-4 w-4" />
              <span>Datum nástupu: {new Date(user.start_date).toLocaleDateString('cs-CZ')}</span>
            </div>
          )}
          {/* Progress bar embedded in banner */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-blue-200 mb-1.5">
              <span>Celkový pokrok</span>
              <span className="font-bold text-white">{Math.round(progress.overall_progress)}%</span>
            </div>
            <div className="w-full bg-blue-500/40 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progress.overall_progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div className="rounded-full bg-green-100 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {progress.steps.completed}
                <span className="text-sm font-normal text-gray-400">/{progress.steps.total}</span>
              </p>
              <p className="text-xs text-gray-500">Dokončené kroky</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <div className="rounded-full bg-blue-100 p-2.5">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {progress.documents.uploaded}
                <span className="text-sm font-normal text-gray-400">/{progress.documents.total}</span>
              </p>
              <p className="text-xs text-gray-500">Nahrané dokumenty</p>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="steps" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="steps">Kroky onboardingu</TabsTrigger>
            <TabsTrigger value="documents">Požadované dokumenty</TabsTrigger>
          </TabsList>

          {/* Onboarding Steps Tab */}
          <TabsContent value="steps">
            <Card>
              <CardHeader>
                <CardTitle>Kroky onboardingu</CardTitle>
                <CardDescription>
                  Postupujte podle kroků pro úspěšné dokončení onboardingu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* "Your next step" callout */}
                {nextStep && (
                  <div className="rounded-xl bg-blue-600 text-white p-4 mb-5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-blue-200 uppercase tracking-wide">Pokračujte kde jste skončili</p>
                      <p className="font-semibold truncate">{nextStep.title}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-white text-blue-700 hover:bg-blue-50 flex-shrink-0"
                      onClick={() => handleNavigateToStep(nextStep.user_step_id)}
                    >
                      Pokračovat <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Timeline */}
                <div className="relative pl-10">
                  <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200" />

                  {steps.map((step: OnboardingStep, index: number) => {
                    const isLast = index === steps.length - 1
                    const isExpanded = expandedSteps.has(step.user_step_id)

                    const circleClass = step.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : step.status === 'in_progress'
                      ? 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-100'
                      : step.status === 'skipped'
                      ? 'bg-gray-300 border-gray-300 text-gray-600'
                      : 'bg-white border-gray-300 text-gray-500'

                    const cardClass = step.status === 'in_progress'
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : step.status === 'completed'
                      ? 'border-green-100 bg-green-50/30'
                      : step.status === 'skipped'
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : 'border-gray-200 bg-white'

                    return (
                      <div className="relative mb-4" key={step.user_step_id}>
                        {!isLast && (
                          <div className={`absolute left-[-22px] top-8 h-full w-0.5 ${step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}`} />
                        )}

                        {/* Circle node */}
                        <div className={`absolute left-[-30px] top-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all ${circleClass}`}>
                          {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>

                        {/* Step card */}
                        <div className={`rounded-xl border p-4 transition-colors ${cardClass}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Row 1: title + type + mandatory */}
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                                {step.step_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {getStepTypeLabel(step.step_type)}
                                  </Badge>
                                )}
                                {step.is_mandatory && (
                                  <Badge variant="destructive" className="text-xs">Povinný</Badge>
                                )}
                              </div>
                              {/* Row 2: status + timing + completion */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`text-xs ${getStepStatusBadgeClass(step.status)}`}>
                                  {getStepStatusLabel(step.status)}
                                </Badge>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  <Calendar className="h-3 w-3" />
                                  Den {step.days_from_start + 1}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  {step.duration_days} {step.duration_days === 1 ? 'den' : 'dní'}
                                </span>
                                {step.completed_at && (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    Dokončeno {new Date(step.completed_at).toLocaleDateString('cs-CZ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions + expand */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {step.status === 'not_started' && (
                                <Button size="sm" onClick={() => handleStartStep(step)}>
                                  <Play className="h-4 w-4 mr-1" />
                                  Začít
                                </Button>
                              )}
                              {step.status === 'in_progress' && (
                                <Button size="sm" onClick={() => handleNavigateToStep(step.user_step_id)}>
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Pokračovat
                                </Button>
                              )}
                              {(step.status === 'completed' || step.status === 'skipped') && (
                                <Button size="sm" variant="outline" onClick={() => handleNavigateToStep(step.user_step_id)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Zobrazit
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleStepExpansion(step.user_step_id)}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded section */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                              {step.description && (
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              )}
                              {step.instructions && (
                                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                                  <strong className="text-blue-900">Instrukce:</strong>
                                  <p className="text-blue-800 mt-1">{step.instructions}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Required Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Požadované dokumenty</CardTitle>
                <CardDescription>
                  Nahrajte všechny požadované dokumenty pro dokončení onboardingu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((document: RequiredDocument) => {
                    const needsUpload = document.status === 'pending' || document.status === 'rejected'

                    return (
                      <div key={document.id} className={`rounded-lg border bg-white p-4 ${document.status === 'rejected' ? 'border-red-200 bg-red-50/30' : ''}`}>
                        <div className="flex items-start gap-4">
                          {/* Status icon */}
                          <div className={`rounded-full p-2 flex-shrink-0 mt-0.5 ${
                            document.status === 'approved' ? 'bg-green-100' :
                            document.status === 'rejected' ? 'bg-red-100' :
                            document.status === 'uploaded' ? 'bg-yellow-100' :
                            'bg-gray-100'
                          }`}>
                            {document.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {document.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                            {document.status === 'uploaded' && <Clock className="h-5 w-5 text-yellow-600" />}
                            {document.status === 'pending' && <Upload className="h-5 w-5 text-gray-500" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Name + badges */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-medium">{document.name}</h3>
                              {document.is_mandatory && (
                                <Badge variant="destructive" className="text-xs">Povinný</Badge>
                              )}
                              {document.status === 'pending' && (
                                <Badge variant="outline" className="text-xs">Čeká na nahrání</Badge>
                              )}
                              {document.status === 'uploaded' && (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Nahráno — čeká na schválení</Badge>
                              )}
                              {document.status === 'approved' && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Schváleno ✓</Badge>
                              )}
                              {document.status === 'rejected' && (
                                <Badge variant="destructive" className="text-xs">Zamítnuto — nahrajte znovu</Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">{document.description}</p>

                            {document.has_template && document.template_file && (
                              <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                                <Paperclip className="h-3 w-3" />
                                <span>Šablona k dispozici:</span>
                                <button
                                  onClick={() => handleDownloadTemplate(document.template_file!)}
                                  className="underline hover:no-underline"
                                >
                                  {document.template_file}
                                </button>
                              </div>
                            )}

                            {document.status === 'uploaded' && document.uploaded_at && (
                              <div className="text-xs text-green-600 mb-1">
                                ✓ Nahráno {new Date(document.uploaded_at).toLocaleDateString('cs-CZ')}
                              </div>
                            )}

                            {/* Rejection reason */}
                            {document.status === 'rejected' && document.review_notes && (
                              <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span><strong>Důvod zamítnutí: </strong>{document.review_notes}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {needsUpload && (
                              <label
                                className={`cursor-pointer inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                                  ${document.status === 'rejected'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'}
                                  ${uploadingDocId === document.id ? 'opacity-60 pointer-events-none' : ''}`}
                              >
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  disabled={uploadingDocId === document.id}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      await handleFileUpload(document.id, file)
                                      e.target.value = ''
                                    }
                                  }}
                                />
                                {uploadingDocId === document.id ? (
                                  <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Nahrávám...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4" />
                                    {document.status === 'rejected' ? 'Nahrát znovu' : 'Nahrát'}
                                  </>
                                )}
                              </label>
                            )}

                            {(document.status === 'uploaded' || document.status === 'approved') && document.user_document_id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(document.user_document_id!)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Zobrazit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadDocument(document.user_document_id!)}
                                  title="Stáhnout dokument"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
