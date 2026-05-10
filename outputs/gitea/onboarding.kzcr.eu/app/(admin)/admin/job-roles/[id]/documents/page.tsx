"use client"

import React, { useState, useEffect, use } from "react"
import { ArrowLeft, FileText, Plus, Trash2, Save, AlertCircle, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import Link from "next/link"
import { getJobRoleById, JobRole } from "@/lib/api/job-roles"
import { 
  getDocumentsByJobRole, 
  getAllOnboardingDocumentsAdmin, 
  assignDocumentToJobRole, 
  updateJobRoleDocumentAssignment, 
  removeDocumentFromJobRole,
  OnboardingDocument 
} from "@/lib/api/onboarding-documents"
import { 
  getJobRoleWorkflows,
  assignWorkflowToJobRole,
  removeWorkflowFromJobRole,
  getAllWorkflows,
  OnboardingWorkflow
} from "@/lib/api/workflows"
import toast from "react-hot-toast"

interface JobRoleDocument extends OnboardingDocument {
  is_mandatory?: boolean
}

interface JobRoleWorkflow extends OnboardingWorkflow {
  id: string
  name: string
  description?: string
  organization_name?: string
}

export default function JobRoleDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [jobRole, setJobRole] = useState<JobRole | null>(null)
  const [assignedDocuments, setAssignedDocuments] = useState<JobRoleDocument[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<OnboardingDocument[]>([])
  const [assignedWorkflows, setAssignedWorkflows] = useState<JobRoleWorkflow[]>([])
  const [availableWorkflows, setAvailableWorkflows] = useState<OnboardingWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([])
  const [mandatoryFlags, setMandatoryFlags] = useState<Record<string, boolean>>({})
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAssigningWorkflows, setIsAssigningWorkflows] = useState(false)
  const [savingChanges, setSavingChanges] = useState<string | null>(null)

  useEffect(() => {
    fetchJobRoleData()
  }, [id])

  const fetchJobRoleData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [jobRoleData, assignedDocsData, assignedWorkflowsData] = await Promise.all([
        getJobRoleById(id),
        getDocumentsByJobRole(id),
        getJobRoleWorkflows(id)
      ])

      setJobRole(jobRoleData)
      setAssignedDocuments(assignedDocsData)
      setAssignedWorkflows(assignedWorkflowsData)
      
      // Fetch available documents and workflows (organization-specific + global)
      if (jobRoleData.organization_id) {
        const [allDocsResponse, allWorkflowsResponse] = await Promise.all([
          getAllOnboardingDocumentsAdmin({
            org: jobRoleData.organization_id,
            limit: 100 // Backend now includes global documents automatically
          }),
          getAllWorkflows({
            org: jobRoleData.organization_id,
            template: false,
            limit: 100
          })
        ])
        
        // Filter out already assigned documents
        const assignedDocIds = assignedDocsData.map(doc => doc.id)
        const availableDocs = allDocsResponse.data.filter(doc => !assignedDocIds.includes(doc.id))
        setAvailableDocuments(availableDocs)
        
        // Filter out already assigned workflows
        const assignedWorkflowIds = assignedWorkflowsData.map(wf => wf.id)
        const availableWfs = allWorkflowsResponse.data.filter(wf => !assignedWorkflowIds.includes(wf.id))
        setAvailableWorkflows(availableWfs)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje pracovní role')
      console.error('Error fetching job role data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMandatoryChange = async (documentId: string, isMandatory: boolean) => {
    try {
      setSavingChanges(documentId)
      await updateJobRoleDocumentAssignment(id, documentId, isMandatory)
      
      // Update local state
      setAssignedDocuments(docs => 
        docs.map(doc => 
          doc.id === documentId ? { ...doc, is_mandatory: isMandatory } : doc
        )
      )
      
      toast.success('Nastavení povinnosti bylo úspěšně aktualizováno')
    } catch (err) {
      console.error('Failed to update document assignment:', err)
      toast.error('Chyba při aktualizaci nastavení')
    } finally {
      setSavingChanges(null)
    }
  }

  const handleRemoveDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Opravdu chcete odebrat dokument "${documentName}" z této pracovní role?`)) {
      return
    }

    try {
      await removeDocumentFromJobRole(id, documentId)
      toast.success(`Dokument "${documentName}" byl odebrán z pracovní role`)
      fetchJobRoleData() // Refresh data
    } catch (err) {
      console.error('Failed to remove document:', err)
      toast.error('Chyba při odebírání dokumentu')
    }
  }

  const openAssignDialog = () => {
    setSelectedDocuments([])
    setMandatoryFlags({})
    setIsAssignDialogOpen(true)
  }

  const handleDocumentSelection = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments(prev => [...prev, documentId])
      setMandatoryFlags(prev => ({ ...prev, [documentId]: true })) // Default to mandatory
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
      setMandatoryFlags(prev => {
        const newFlags = { ...prev }
        delete newFlags[documentId]
        return newFlags
      })
    }
  }

  const handleAssignDocuments = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Vyberte alespoň jeden dokument')
      return
    }

    try {
      setIsAssigning(true)
      
      // Assign each selected document
      for (const documentId of selectedDocuments) {
        const isMandatory = mandatoryFlags[documentId] || false
        await assignDocumentToJobRole(id, documentId, isMandatory)
      }
      
      toast.success(`${selectedDocuments.length} dokumentů bylo úspěšně přiřazeno`)
      setIsAssignDialogOpen(false)
      fetchJobRoleData() // Refresh data
    } catch (err) {
      console.error('Failed to assign documents:', err)
      toast.error('Chyba při přiřazování dokumentů')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Opravdu chcete odebrat workflow "${workflowName}" z této pracovní role?`)) {
      return
    }

    try {
      await removeWorkflowFromJobRole(id, workflowId)
      toast.success(`Workflow "${workflowName}" byl odebrán z pracovní role`)
      fetchJobRoleData() // Refresh data
    } catch (err) {
      console.error('Failed to remove workflow:', err)
      toast.error('Chyba při odebírání workflow')
    }
  }

  const openWorkflowAssignDialog = () => {
    setSelectedWorkflows([])
    setIsWorkflowDialogOpen(true)
  }

  const handleWorkflowSelection = (workflowId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedWorkflows(prev => [...prev, workflowId])
    } else {
      setSelectedWorkflows(prev => prev.filter(id => id !== workflowId))
    }
  }

  const handleAssignWorkflows = async () => {
    if (selectedWorkflows.length === 0) {
      toast.error('Vyberte alespoň jeden workflow')
      return
    }

    try {
      setIsAssigningWorkflows(true)
      
      // Assign each selected workflow
      for (const workflowId of selectedWorkflows) {
        await assignWorkflowToJobRole(id, workflowId)
      }
      
      toast.success(`${selectedWorkflows.length} workflow bylo úspěšně přiřazeno`)
      setIsWorkflowDialogOpen(false)
      fetchJobRoleData() // Refresh data
    } catch (err) {
      console.error('Failed to assign workflows:', err)
      toast.error('Chyba při přiřazování workflow')
    } finally {
      setIsAssigningWorkflows(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Načítání údajů pracovní role...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !jobRole) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Pracovní role nebyla nalezena'}</p>
            <Link href="/admin/job-roles">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na seznam pracovních rolí
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
            <Link href="/admin/job-roles">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Dokumenty a workflow pro: {jobRole.name}
              </h1>
              <p className="text-muted-foreground">
                Organizace: {jobRole.organization_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={openAssignDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Přiřadit dokumenty
            </Button>
            <Button onClick={openWorkflowAssignDialog} className="bg-green-600 hover:bg-green-700">
              <Workflow className="h-4 w-4 mr-2" />
              Přiřadit workflow
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Assigned Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Přiřazené workflow ({assignedWorkflows.length})</CardTitle>
            <CardDescription>
              Onboarding workflow, které jsou automaticky spuštěny pro tuto pracovní roli
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedWorkflows.length === 0 ? (
              <div className="text-center py-8">
                <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Žádné přiřazené workflow</h3>
                <p className="text-muted-foreground mb-4">
                  Této pracovní roli zatím nejsou přiřazeny žádné workflow.
                </p>
                <Button onClick={openWorkflowAssignDialog} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Přiřadit první workflow
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Workflow className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {workflow.organization_name && (
                            <span>{workflow.organization_name}</span>
                          )}
                          {workflow.description && (
                            <>
                              <span>•</span>
                              <span>{workflow.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Automaticky spuštěno
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWorkflow(workflow.id, workflow.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Odebrat</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Přiřazené dokumenty ({assignedDocuments.length})</CardTitle>
            <CardDescription>
              Dokumenty, které jsou vyžadovány pro tuto pracovní roli
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignedDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Žádné přiřazené dokumenty</h3>
                <p className="text-muted-foreground mb-4">
                  Této pracovní roli zatím nejsou přiřazeny žádné dokumenty.
                </p>
                <Button onClick={openAssignDialog} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Přiřadit první dokument
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {document.type_name && (
                            <span>{document.type_name}</span>
                          )}
                          {document.applies_to_all_organizations && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                Globální
                              </Badge>
                            </>
                          )}
                          {document.description && (
                            <>
                              <span>•</span>
                              <span>{document.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`mandatory-${document.id}`}
                          checked={document.is_mandatory ?? true}
                          onCheckedChange={(checked) => 
                            handleMandatoryChange(document.id, checked as boolean)
                          }
                          disabled={savingChanges === document.id}
                        />
                        <Label 
                          htmlFor={`mandatory-${document.id}`} 
                          className="text-sm"
                        >
                          Povinný
                        </Label>
                      </div>
                      {document.is_mandatory ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          Povinný
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Volitelný
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument(document.id, document.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Odebrat</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Documents Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Přiřadit dokumenty k pracovní roli</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {availableDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Žádné dostupné dokumenty</h3>
                  <p className="text-muted-foreground">
                    Všechny dokumenty této organizace jsou již přiřazeny.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Vyberte dokumenty, které chcete přiřadit k této pracovní roli:
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`assign-${document.id}`}
                            checked={selectedDocuments.includes(document.id)}
                            onCheckedChange={(checked) => 
                              handleDocumentSelection(document.id, checked as boolean)
                            }
                          />
                          <div>
                            <Label 
                              htmlFor={`assign-${document.id}`} 
                              className="font-medium cursor-pointer"
                            >
                              {document.name}
                            </Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {document.type_name && (
                                <span>{document.type_name}</span>
                              )}
                              {document.applies_to_all_organizations && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                    Globální
                                  </Badge>
                                </>
                              )}
                              {document.description && (
                                <>
                                  <span>•</span>
                                  <span>{document.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedDocuments.includes(document.id) && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`mandatory-assign-${document.id}`}
                              checked={mandatoryFlags[document.id] ?? true}
                              onCheckedChange={(checked) => 
                                setMandatoryFlags(prev => ({ 
                                  ...prev, 
                                  [document.id]: checked as boolean 
                                }))
                              }
                            />
                            <Label 
                              htmlFor={`mandatory-assign-${document.id}`} 
                              className="text-sm cursor-pointer"
                            >
                              Povinný
                            </Label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Zrušit
                </Button>
                <Button 
                  onClick={handleAssignDocuments} 
                  disabled={selectedDocuments.length === 0 || isAssigning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAssigning ? 'Přiřazuji...' : `Přiřadit (${selectedDocuments.length})`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Workflows Dialog */}
        <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Přiřadit workflow k pracovní roli</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {availableWorkflows.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Žádné dostupné workflow</h3>
                  <p className="text-muted-foreground">
                    Všechny workflow této organizace jsou již přiřazeny.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Vyberte workflow, které chcete přiřadit k této pracovní roli:
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableWorkflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`assign-workflow-${workflow.id}`}
                            checked={selectedWorkflows.includes(workflow.id)}
                            onCheckedChange={(checked) => 
                              handleWorkflowSelection(workflow.id, checked as boolean)
                            }
                          />
                          <div>
                            <Label 
                              htmlFor={`assign-workflow-${workflow.id}`} 
                              className="font-medium cursor-pointer"
                            >
                              {workflow.name}
                            </Label>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {workflow.organization_name && (
                                <span>{workflow.organization_name}</span>
                              )}
                              {workflow.description && (
                                <>
                                  <span>•</span>
                                  <span>{workflow.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsWorkflowDialogOpen(false)}
                >
                  Zrušit
                </Button>
                <Button 
                  onClick={handleAssignWorkflows} 
                  disabled={selectedWorkflows.length === 0 || isAssigningWorkflows}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAssigningWorkflows ? 'Přiřazuji...' : `Přiřadit (${selectedWorkflows.length})`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
