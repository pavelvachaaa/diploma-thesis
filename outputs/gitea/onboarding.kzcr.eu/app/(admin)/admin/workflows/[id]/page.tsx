"use client"

import React, { useState, useEffect, use } from "react"
import { ArrowLeft, Edit, Settings, Users, Calendar, CheckCircle, Clock, FileText, AlertCircle, Plus, X, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import Link from "next/link"
import { getWorkflowWithSteps, WorkflowWithSteps, getJobRoleWorkflows, assignWorkflowToJobRole, removeWorkflowFromJobRole } from "@/lib/api/workflows"
import { getAllJobRoles, JobRole } from "@/lib/api/job-roles"
import toast from "react-hot-toast"

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [workflow, setWorkflow] = useState<WorkflowWithSteps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allJobRoles, setAllJobRoles] = useState<JobRole[]>([])
  const [assignedJobRoles, setAssignedJobRoles] = useState<JobRole[]>([])
  const [selectedJobRoleId, setSelectedJobRoleId] = useState("")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    fetchWorkflowData()
  }, [id])

  const fetchWorkflowData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [workflowData, jobRolesData] = await Promise.all([
        getWorkflowWithSteps(id),
        getAllJobRoles()
      ])
      setWorkflow(workflowData)
      setAllJobRoles(jobRolesData)
      
      // Load assigned job roles for this workflow
      // Since the getJobRoleWorkflows API works the opposite way, 
      // we'll need to check each job role to see if this workflow is assigned
      const assignedRoles: JobRole[] = []
      if (jobRolesData && Array.isArray(jobRolesData)) {
        for (let i = 0; i < jobRolesData.length; i++) {
          const jobRole = jobRolesData[i]
          try {
            const workflows = await getJobRoleWorkflows(jobRole.id)
            if (workflows.some((w: any) => w.id === id)) {
              assignedRoles.push(jobRole)
            }
          } catch (err) {
            // Ignore errors for individual job roles
            console.warn(`Failed to check workflows for job role ${jobRole.id}:`, err)
          }
        }
      }
      setAssignedJobRoles(assignedRoles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst workflow')
      console.error('Error fetching workflow:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'form':
        return <FileText className="h-4 w-4" />
      case 'ack':
        return <CheckCircle className="h-4 w-4" />
      case 'quiz':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'form':
        return 'Formulář'
      case 'ack':
        return 'Potvrzení'
      case 'quiz':
        return 'Test'
      case 'info':
        return 'Informace'
      default:
        return stepType
    }
  }

  const getStepTimingLabel = (daysFromStart: number) => {
    if (daysFromStart < 0) {
      return `${Math.abs(daysFromStart)} dní před nástupem`
    } else if (daysFromStart === 0) {
      return 'První den'
    } else {
      return `Den ${daysFromStart}`
    }
  }

  const handleAssignToJobRole = async () => {
    if (!selectedJobRoleId || !workflow) return

    try {
      setIsAssigning(true)
      await assignWorkflowToJobRole(selectedJobRoleId, workflow.id)
      
      const jobRole = allJobRoles.find(jr => jr.id === selectedJobRoleId)
      if (jobRole) {
        setAssignedJobRoles(prev => [...prev, jobRole])
      }
      
      setSelectedJobRoleId("")
      setIsAssignDialogOpen(false)
      toast.success("Workflow byl úspěšně přiřazen k pozici")
    } catch (err) {
      console.error('Failed to assign workflow:', err)
      toast.error("Chyba při přiřazování workflow")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveFromJobRole = async (jobRoleId: string) => {
    if (!workflow) return

    if (!confirm('Opravdu chcete odebrat tento workflow z pozice?')) {
      return
    }

    try {
      await removeWorkflowFromJobRole(jobRoleId, workflow.id)
      setAssignedJobRoles(prev => prev.filter(jr => jr.id !== jobRoleId))
      toast.success("Workflow byl odebrán z pozice")
    } catch (err) {
      console.error('Failed to remove workflow:', err)
      toast.error("Chyba při odebírání workflow")
    }
  }

  const getAvailableJobRoles = () => {
    if (!Array.isArray(allJobRoles)) return []
    return allJobRoles.filter(jr => !assignedJobRoles.some(ajr => ajr.id === jr.id))
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Načítání workflow...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !workflow) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Workflow nebylo nalezeno'}</p>
            <Link href="/admin/workflows">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na workflow
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/workflows">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
                <div className="flex gap-2">
                  {workflow.is_template && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Šablona
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Aktivní
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                {workflow.organization_name} • {workflow.steps.length} kroků
              </p>
              {workflow.description && (
                <p className="text-muted-foreground mt-1">{workflow.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/workflows/${workflow.id}/builder`}>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Upravit workflow
              </Button>
            </Link>
          </div>
        </div>

        {/* Workflow Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Celková doba</p>
                  <p className="text-2xl font-bold">
                    {workflow.steps.length > 0 
                      ? Math.max(...workflow.steps.map(s => s.days_from_start + s.duration_days))
                      : 0} dní
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Počet kroků</p>
                  <p className="text-2xl font-bold">{workflow.steps.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Povinné kroky</p>
                  <p className="text-2xl font-bold">
                    {workflow.steps.filter(s => s.is_mandatory).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Auto-přiřazení</p>
                  <p className="text-2xl font-bold">
                    {workflow.steps.filter(s => s.auto_assign).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Details */}
        <Card>
          <CardHeader>
            <CardTitle>Informace o workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Vytvořeno</dt>
                <dd className="text-sm">
                  {new Date(workflow.created_at).toLocaleDateString('cs-CZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
              {workflow.created_by_email && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Vytvořil</dt>
                  <dd className="text-sm">{workflow.created_by_email}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Poslední úprava</dt>
                <dd className="text-sm">
                  {new Date(workflow.updated_at).toLocaleDateString('cs-CZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Organizace</dt>
                <dd className="text-sm">{workflow.organization_name}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Kroky workflow</CardTitle>
            <CardDescription>
              Přehled všech kroků v tomto workflow podle časové posloupnosti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflow.steps.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Žádné kroky</h3>
                <p className="text-muted-foreground mb-4">
                  Toto workflow zatím nemá žádné kroky.
                </p>
                <Link href={`/admin/workflows/${workflow.id}/builder`}>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Přidat kroky
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {workflow.steps
                  .sort((a, b) => (a.workflow_order || a.order_index || 0) - (b.workflow_order || b.order_index || 0))
                  .map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStepTypeIcon(step.step_type)}
                          <h3 className="font-medium">{step.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getStepTypeLabel(step.step_type)}
                          </Badge>
                          {step.is_mandatory && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              Povinný
                            </Badge>
                          )}
                          {step.auto_assign && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              Auto-přiřazení
                            </Badge>
                          )}
                        </div>
                        
                        {step.description && (
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{getStepTimingLabel(step.days_from_start)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{step.duration_days} {step.duration_days === 1 ? 'den' : 'dní'}</span>
                          </div>
                        </div>
                        
                        {step.instructions && (
                          <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
                            <strong>Instrukce:</strong> {step.instructions}
                          </div>
                        )}
                        
                        {step.acknowledgment_text && (
                          <div className="mb-2 p-2 bg-green-50 rounded text-xs">
                            <strong>Text k potvrzení:</strong> {step.acknowledgment_text}
                          </div>
                        )}
                        
                        {step.content_url && (
                          <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                            <strong>URL obsahu:</strong> <a href={step.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{step.content_url}</a>
                          </div>
                        )}
                        
                        {step.documents && step.documents.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Dokumenty:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.documents.map((doc) => (
                                <Badge key={doc.id} variant="outline" className="text-xs">
                                  {doc.name} {doc.is_mandatory && <span className="text-red-500">*</span>}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
