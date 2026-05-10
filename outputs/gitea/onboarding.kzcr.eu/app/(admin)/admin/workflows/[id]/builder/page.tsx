"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Plus, Edit, Trash2, Save, Clock, Users, FileText, AlertCircle, GripVertical, Calendar, User, CheckCircle, Upload, Download, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import Link from "next/link"
import { 
  getWorkflowWithSteps, 
  WorkflowWithSteps, 
  OnboardingStep,
  getAllSteps,
  createStep,
  updateStep,
  addStepToWorkflow,
  removeStepFromWorkflow,
  updateStepOrder,
  getWorkflowDocuments,
  attachDocumentToWorkflow,
  removeDocumentFromWorkflow,
  downloadWorkflowDocument,
  WorkflowDocument
} from "@/lib/api/workflows"
import { 
  getAllOnboardingDocumentsAdmin, 
  OnboardingDocument,
  createDocumentTemplate,
  createDocumentTemplateWithFile,
  WorkflowDocumentAttachment,
  getStepDocuments,
  attachDocumentToStep,
  removeDocumentFromStep
} from "@/lib/api/onboarding-documents"
import { getAllDocumentTypes, DocumentType } from "@/lib/api/document-types"
import toast from "react-hot-toast"

interface StepFormData {
  title: string
  description: string
  step_type: 'info' | 'ack' | 'form' | 'quiz' | 'file'
  days_from_start: number
  duration_days: number
  is_mandatory: boolean
  auto_assign: boolean
  instructions: string
  acknowledgment_text: string
  content_url: string
}

export default function WorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [workflow, setWorkflow] = useState<WorkflowWithSteps | null>(null)
  const [availableSteps, setAvailableSteps] = useState<OnboardingStep[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<OnboardingDocument[]>([])
  const [workflowDocuments, setWorkflowDocuments] = useState<WorkflowDocument[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null)
  const [stepDocuments, setStepDocuments] = useState<OnboardingDocument[]>([])
  const [tempStepDocuments, setTempStepDocuments] = useState<{id: string, name: string, is_mandatory: boolean}[]>([])
  const [showStepDocumentSelector, setShowStepDocumentSelector] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateTypeId, setTemplateTypeId] = useState<string>('')
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggedStep, setDraggedStep] = useState<OnboardingStep | null>(null)

  const [stepFormData, setStepFormData] = useState<StepFormData>({
    title: "",
    description: "",
    step_type: "ack",
    days_from_start: 0,
    duration_days: 1,
    is_mandatory: true,
    auto_assign: false,
    instructions: "",
    acknowledgment_text: "",
    content_url: ""
  })

  useEffect(() => {
    fetchWorkflowData()
  }, [id])

  const fetchWorkflowData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [workflowData, documentsData, workflowDocsData, documentTypesData] = await Promise.all([
        getWorkflowWithSteps(id),
        getAllOnboardingDocumentsAdmin({ limit: 100 }),
        getWorkflowDocuments(id).catch(() => []), // Don't fail if workflow docs aren't set up yet
        getAllDocumentTypes()
      ])

      setWorkflow(workflowData)
      setAvailableDocuments(documentsData.data)
      setWorkflowDocuments(workflowDocsData)
      setDocumentTypes(documentTypesData)

      if (workflowData.organization_id) {
        const stepsData = await getAllSteps(workflowData.organization_id)
        setAvailableSteps(stepsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje workflow')
      console.error('Error fetching workflow data:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateStepDialog = () => {
    setStepFormData({
      title: "",
      description: "",
      step_type: "ack",
      days_from_start: 0,
      duration_days: 1,
      is_mandatory: true,
      auto_assign: false,
      instructions: "",
      acknowledgment_text: "",
      content_url: ""
    })
    setSelectedStep(null)
    setStepDocuments([])
    setTempStepDocuments([])
    setShowStepDocumentSelector(false)
    setIsEditMode(false)
    setIsStepDialogOpen(true)
  }

  const openEditStepDialog = async (step: OnboardingStep) => {
    setStepFormData({
      title: step.title,
      description: step.description || "",
      step_type: step.step_type,
      days_from_start: step.days_from_start,
      duration_days: step.duration_days,
      is_mandatory: step.is_mandatory,
      auto_assign: step.auto_assign,
      instructions: step.instructions || "",
      acknowledgment_text: step.acknowledgment_text || "",
      content_url: step.content_url || ""
    })
    setSelectedStep(step)
    setTempStepDocuments([])
    setShowStepDocumentSelector(false)
    setIsEditMode(true)
    
    // Load step documents
    try {
      const stepDocs = await getStepDocuments(step.id)
      setStepDocuments(stepDocs)
    } catch (err) {
      console.error('Failed to load step documents:', err)
      setStepDocuments([])
    }
    
    setIsStepDialogOpen(true)
  }

  const handleStepSubmit = async () => {
    if (!workflow) return

    if (!stepFormData.title.trim()) {
      toast.error("Název kroku je povinný")
      return
    }

    try {
      setIsSubmitting(true)

      const stepData = {
        ...stepFormData,
        organization_id: workflow.organization_id,
        order_index: workflow.steps.length + 1
      }

      if (isEditMode && selectedStep) {
        await updateStep(selectedStep.id, stepData)
        toast.success("Krok byl úspěšně aktualizován")
      } else {
        const newStep = await createStep(stepData)
        await addStepToWorkflow(workflow.id, newStep.id, stepData.order_index)
        
        // Attach documents to new step if any were selected
        if (tempStepDocuments.length > 0) {
          for (const doc of tempStepDocuments) {
            try {
              await attachDocumentToStep(newStep.id, {
                document_id: doc.id,
                is_mandatory: doc.is_mandatory
              })
            } catch (err) {
              console.error(`Failed to attach document ${doc.name} to step:`, err)
              // Don't fail the entire operation for document attachment errors
            }
          }
        }
        
        toast.success("Krok byl úspěšně přidán")
      }

      setIsStepDialogOpen(false)
      fetchWorkflowData()
    } catch (err) {
      console.error('Failed to save step:', err)
      toast.error("Chyba při ukládání kroku")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveStep = async (step: OnboardingStep) => {
    if (!workflow) return

    if (!confirm(`Opravdu chcete odebrat krok "${step.title}" z workflow?`)) {
      return
    }

    try {
      await removeStepFromWorkflow(workflow.id, step.id)
      toast.success("Krok byl odebrán z workflow")
      fetchWorkflowData()
    } catch (err) {
      console.error('Failed to remove step:', err)
      toast.error('Chyba při odebírání kroku')
    }
  }

  const handleDragStart = (e: React.DragEvent, step: OnboardingStep) => {
    setDraggedStep(step)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', step.id.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetStep: OnboardingStep) => {
    e.preventDefault()
    
    if (!draggedStep || !workflow || draggedStep.id === targetStep.id) {
      setDraggedStep(null)
      return
    }

    try {
      // Get current steps with their order
      const sortedSteps = workflow.steps.sort((a, b) => 
        (a.workflow_order || a.order_index || 0) - (b.workflow_order || b.order_index || 0)
      )
      
      const draggedIndex = sortedSteps.findIndex(s => s.id === draggedStep.id)
      const targetIndex = sortedSteps.findIndex(s => s.id === targetStep.id)
      
      // Reorder the steps
      const newSteps = [...sortedSteps]
      newSteps.splice(draggedIndex, 1)
      newSteps.splice(targetIndex, 0, draggedStep)
      
      // Update step order on backend
      const updatePromises = newSteps.map((step, index) => 
        updateStepOrder(workflow.id, step.id, index + 1)
      )
      
      await Promise.all(updatePromises)
      
      // Update workflow with new order
      const updatedWorkflow = {
        ...workflow,
        steps: newSteps.map((step, index) => ({
          ...step,
          workflow_order: index + 1
        }))
      }
      
      setWorkflow(updatedWorkflow)
      toast.success("Pořadí kroků bylo změněno")
      
    } catch (err) {
      console.error('Failed to reorder steps:', err)
      toast.error('Chyba při změně pořadí kroků')
      // Refresh data to revert changes
      fetchWorkflowData()
    } finally {
      setDraggedStep(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedStep(null)
  }

  const handleAttachDocumentToWorkflow = async (documentId: string, isMandatory: boolean) => {
    if (!workflow) return

    try {
      await attachDocumentToWorkflow(workflow.id, documentId, isMandatory)
      
      // Refresh workflow documents
      const updatedDocs = await getWorkflowDocuments(workflow.id)
      setWorkflowDocuments(updatedDocs)
      
      toast.success('Dokument byl připojen k workflow')
      setIsDocumentDialogOpen(false)
    } catch (err) {
      console.error('Failed to attach document:', err)
      toast.error('Chyba při připojování dokumentu')
    }
  }

  const handleDownloadWorkflowDocument = async (documentId: string, fileName: string) => {
    try {
      await downloadWorkflowDocument(documentId, fileName)
      toast.success('Dokument byl stažen')
    } catch (err) {
      console.error('Failed to download document:', err)
      toast.error('Chyba při stahování dokumentu')
    }
  }

  const handleRemoveWorkflowDocument = async (documentId: string) => {
    if (!workflow) return

    if (!confirm('Opravdu chcete odebrat tento dokument z workflow?')) {
      return
    }

    try {
      await removeDocumentFromWorkflow(workflow.id, documentId)
      
      // Update local state
      setWorkflowDocuments(prev => prev.filter(doc => doc.document_id !== documentId))
      
      toast.success('Dokument byl odebrán z workflow')
    } catch (err) {
      console.error('Failed to remove document:', err)
      toast.error('Chyba při odebírání dokumentu')
    }
  }

  const handleAttachDocumentToStep = async (stepId: string, documentId: string, isMandatory: boolean) => {
    try {
      await attachDocumentToStep(stepId, {
        document_id: documentId,
        is_mandatory: isMandatory
      })
      
      // Refresh step documents
      const updatedDocs = await getStepDocuments(stepId)
      setStepDocuments(updatedDocs)
      
      toast.success('Dokument byl připojen ke kroku')
    } catch (err) {
      console.error('Failed to attach document to step:', err)
      toast.error('Chyba při připojování dokumentu ke kroku')
    }
  }

  const handleRemoveDocumentFromStep = async (stepId: string, documentId: string) => {
    if (!confirm('Opravdu chcete odebrat tento dokument z kroku?')) {
      return
    }

    try {
      await removeDocumentFromStep(stepId, documentId)
      
      // Refresh step documents
      const updatedDocs = await getStepDocuments(stepId)
      setStepDocuments(updatedDocs)
      
      toast.success('Dokument byl odebrán z kroku')
    } catch (err) {
      console.error('Failed to remove document from step:', err)
      toast.error('Chyba při odebírání dokumentu z kroku')
    }
  }

  const handleAddTempDocument = (documentId: string, documentName: string, isMandatory: boolean) => {
    // Check if already added
    if (tempStepDocuments.find(d => d.id === documentId)) {
      toast.error('Dokument je již přidán')
      return
    }
    
    setTempStepDocuments(prev => [...prev, {
      id: documentId,
      name: documentName,
      is_mandatory: isMandatory
    }])
    
    setShowStepDocumentSelector(false)
  }

  const handleRemoveTempDocument = (documentId: string) => {
    setTempStepDocuments(prev => prev.filter(d => d.id !== documentId))
  }

  const handleCreateTemplate = () => {
    setTemplateName('')
    setTemplateDescription('')
    setTemplateTypeId('')
    setTemplateFile(null)
    setIsTemplateDialogOpen(true)
  }

  const handleSubmitTemplate = async () => {
    if (!workflow || !templateName.trim()) {
      toast.error('Název šablony je povinný')
      return
    }

    try {
      setIsSubmitting(true)
      
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        type_id: templateTypeId || undefined,
        organization_id: workflow.organization_id,
        applies_to_all_organizations: false
      }

      if (templateFile) {
        await createDocumentTemplateWithFile(templateData, templateFile)
      } else {
        await createDocumentTemplate(templateData)
      }

      // Refresh available documents
      const documentsData = await getAllOnboardingDocumentsAdmin({ limit: 100 })
      setAvailableDocuments(documentsData.data)

      toast.success('Šablona dokumentu byla vytvořena')
      setIsTemplateDialogOpen(false)
    } catch (err) {
      console.error('Failed to create template:', err)
      toast.error('Chyba při vytváření šablony')
    } finally {
      setIsSubmitting(false)
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
      case 'file':
        return 'Dokumenty'
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

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Načítání workflow builder...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">
                Workflow Builder: {workflow.name}
              </h1>
              <p className="text-muted-foreground">
                {workflow.organization_name} • {workflow.steps.length} kroků
              </p>
            </div>
          </div>
          <Button onClick={openCreateStepDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Přidat krok
          </Button>
        </div>

        {/* Workflow Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Přehled workflow</CardTitle>
            <CardDescription>{workflow.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Celková doba</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.max(...workflow.steps.map(s => s.days_from_start + s.duration_days))} dní
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Počet kroků</p>
                  <p className="text-xs text-muted-foreground">{workflow.steps.length} kroků</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Povinné kroky</p>
                  <p className="text-xs text-muted-foreground">
                    {workflow.steps.filter(s => s.is_mandatory).length} povinných
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Info Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informační dokumenty</CardTitle>
                <CardDescription>
                  Dokumenty dostupné pro všechny zaměstnance v tomto workflow
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsDocumentDialogOpen(true)}
                  variant="outline" 
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat dokument
                </Button>
                {/* <Button 
                  onClick={() => handleCreateTemplate()}
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Nová šablona
                </Button> */}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {workflowDocuments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>Žádné informační dokumenty nejsou připojeny k tomuto workflow.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflowDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium truncate">{doc.name}</h4>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                        )}
                        {doc.is_mandatory && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 mt-1">
                            Povinný
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.file_name && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Stáhnout"
                          onClick={() => handleDownloadWorkflowDocument(doc.document_id, doc.file_name!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveWorkflowDocument(doc.document_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Odebrat"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Steps Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Kroky workflow</CardTitle>
            <CardDescription>
              Přetáhněte kroky pro změnu pořadí nebo klikněte pro úpravu
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
                <Button onClick={openCreateStepDialog} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat první krok
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {workflow.steps
                  .sort((a, b) => (a.workflow_order || a.order_index || 0) - (b.workflow_order || b.order_index || 0))
                  .map((step, index) => (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, step)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, step)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-move ${
                        draggedStep?.id === step.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                          {index + 1}
                        </div>
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
                        </div>
                        
                        {step.description && (
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{getStepTimingLabel(step.days_from_start)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{step.duration_days} {step.duration_days === 1 ? 'den' : 'dní'}</span>
                          </div>
                          {step.auto_assign && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Auto-přiřazení</span>
                            </div>
                          )}
                        </div>
                        
                        {step.instructions && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <strong>Instrukce:</strong> {step.instructions}
                          </div>
                        )}
                        
                        {step.documents && step.documents.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Dokumenty:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.documents.map((doc) => (
                                <Badge key={doc.id} variant="outline" className="text-xs">
                                  {doc.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {step.step_type === 'form' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Link href={`/admin/forms/${step.id}/edit`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditStepDialog(step)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStep(step)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Management Dialog */}
        <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Přidat dokument k workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Nejsou dostupné žádné dokumenty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDocuments
                    .filter(doc => !workflowDocuments.find(wd => wd.id === doc.id))
                    .map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium">{doc.name}</h4>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground">{doc.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {doc.is_template && (
                                <Badge variant="outline" className="text-xs">Šablona</Badge>
                              )}
                              {doc.organization_name && (
                                <Badge variant="outline" className="text-xs">{doc.organization_name}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => handleAttachDocumentToWorkflow(doc.id, false)}
                            variant="outline" 
                            size="sm"
                          >
                            Volitelný
                          </Button>
                          <Button 
                            onClick={() => handleAttachDocumentToWorkflow(doc.id, true)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Povinný
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                Zrušit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Creation Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Vytvořit šablonu dokumentu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Název šablony *</Label>
                <Input 
                  id="templateName"
                  placeholder="Např. Pracovní smlouva"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Popis</Label>
                <Textarea 
                  id="templateDescription"
                  placeholder="Stručný popis účelu této šablony"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateType">Typ dokumentu</Label>
                <Select value={templateTypeId} onValueChange={(value) => setTemplateTypeId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte typ dokumentu (volitelné)" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateTypeId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setTemplateTypeId('')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Vymazat výběr
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateFile">Soubor šablony</Label>
                <Input 
                  id="templateFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                />
                {templateFile && (
                  <div className="text-sm text-muted-foreground">
                    Vybraný soubor: {templateFile.name} ({Math.round(templateFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Můžete vytvořit šablonu bez souboru a nahrát jej později, nebo nahrát soubor hned teď.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsTemplateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button 
                onClick={handleSubmitTemplate}
                disabled={isSubmitting || !templateName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Vytváření...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Vytvořit šablonu
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Edit Step Dialog */}
        <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Upravit krok' : 'Přidat nový krok'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stepTitle">Název kroku *</Label>
                  <Input 
                    id="stepTitle"
                    placeholder="Např. Podpis pracovní smlouvy"
                    value={stepFormData.title}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stepType">Typ kroku *</Label>
                  <Select 
                    value={stepFormData.step_type} 
                    onValueChange={(value: any) => setStepFormData(prev => ({ ...prev, step_type: value }))}
                  >
                    <SelectTrigger id="stepType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informace</SelectItem>
                      <SelectItem value="ack">Potvrzení</SelectItem>
                      <SelectItem value="form">Formulář</SelectItem>
                      <SelectItem value="quiz">Test</SelectItem>
                      <SelectItem value="file">Dokumenty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stepDescription">Popis</Label>
                <Textarea 
                  id="stepDescription"
                  placeholder="Stručný popis kroku"
                  value={stepFormData.description}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daysFromStart">Dny od začátku</Label>
                  <Input 
                    id="daysFromStart"
                    type="number"
                    placeholder="0"
                    value={stepFormData.days_from_start}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, days_from_start: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Záporné číslo = před nástupem
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="durationDays">Doba na dokončení (dny)</Label>
                  <Input 
                    id="durationDays"
                    type="number"
                    placeholder="1"
                    value={stepFormData.duration_days}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instrukce pro splnění</Label>
                <Textarea 
                  id="instructions"
                  placeholder={stepFormData.step_type === 'file' 
                    ? "Instrukce pro čtení dokumentů (například: 'Přečtěte si pečlivě všechny dokumenty a potvrďte, že rozumíte obsahu')"
                    : "Detailní instrukce, jak tento krok splnit"
                  }
                  value={stepFormData.instructions}
                  onChange={(e) => setStepFormData(prev => ({ ...prev, instructions: e.target.value }))}
                />
              </div>
              
              {stepFormData.step_type === 'file' && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Dokumentový krok</p>
                      <p className="text-xs text-blue-700">
                        Tento krok vyžaduje, aby zaměstnanci přečetli vybrané dokumenty. Krok nebude možné dokončit, dokud nebudou všechny povinné dokumenty označeny jako přečtené.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {stepFormData.step_type === 'ack' && (
                <div className="space-y-2">
                  <Label htmlFor="acknowledgmentText">Text k potvrzení</Label>
                  <Textarea 
                    id="acknowledgmentText"
                    placeholder="Text, který zaměstnanec potvrdí"
                    value={stepFormData.acknowledgment_text}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, acknowledgment_text: e.target.value }))}
                  />
                </div>
              )}

              {stepFormData.step_type === 'info' && (
                <div className="space-y-2">
                  <Label htmlFor="contentUrl">URL obsahu</Label>
                  <Input 
                    id="contentUrl"
                    placeholder="https://..."
                    value={stepFormData.content_url}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, content_url: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isMandatory" 
                    checked={stepFormData.is_mandatory}
                    onCheckedChange={(checked) => 
                      setStepFormData(prev => ({ ...prev, is_mandatory: checked as boolean }))
                    }
                  />
                  <Label htmlFor="isMandatory">Povinný krok</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="autoAssign" 
                    checked={stepFormData.auto_assign}
                    onCheckedChange={(checked) => 
                      setStepFormData(prev => ({ ...prev, auto_assign: checked as boolean }))
                    }
                  />
                  <Label htmlFor="autoAssign">Automaticky přiřadit</Label>
                </div>
              </div>

              {/* Step Documents Section - show for file type or editing existing step */}
              {((stepFormData.step_type === 'file' && !isEditMode) || (isEditMode && selectedStep)) && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="text-base font-medium">
                      {stepFormData.step_type === 'file' ? 'Dokumenty pro čtení' : 'Dokumenty připojené ke kroku'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {stepFormData.step_type === 'file' 
                        ? 'Dokumenty, které zaměstnanci musí přečíst pro dokončení kroku'
                        : 'Dokumenty, které budou dostupné při zpracování tohoto kroku'
                      }
                    </p>
                  </div>
                  
                  {/* Show existing documents for editing or temp documents for new steps */}
                  {(isEditMode ? stepDocuments : tempStepDocuments).length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground border rounded-lg">
                      <FileText className="h-6 w-6 mx-auto mb-2" />
                      <p>
                        {stepFormData.step_type === 'file' 
                          ? 'Žádné dokumenty nebyly vybrány k čtení.'
                          : 'Žádné dokumenty nejsou připojeny k tomuto kroku.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(isEditMode ? stepDocuments : tempStepDocuments).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <div>
                              <h4 className="text-sm font-medium">{doc.name}</h4>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground">{doc.description}</p>
                              )}
                            </div>
                            {(doc.required || doc.is_mandatory) && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                Povinný
                              </Badge>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (isEditMode && selectedStep) {
                                handleRemoveDocumentFromStep(selectedStep.id, doc.id)
                              } else {
                                handleRemoveTempDocument(doc.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Odebrat dokument"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowStepDocumentSelector(!showStepDocumentSelector)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Připojit dokument
                    </Button>

                    {/* Inline document selector */}
                    {showStepDocumentSelector && (
                      <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                        <p className="text-sm font-medium">
                          {stepFormData.step_type === 'file' 
                            ? 'Vyberte dokumenty k přečtení:' 
                            : 'Vyberte dokument k připojení:'
                          }
                        </p>
                        {stepFormData.step_type === 'file' && (
                          <p className="text-xs text-muted-foreground">
                            Pro dokončení kroku budou muset zaměstnanci přečíst všechny povinné dokumenty.
                          </p>
                        )}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableDocuments
                            .filter(doc => {
                              // Filter out documents already attached
                              const existingDocs = isEditMode ? stepDocuments : tempStepDocuments
                              return !existingDocs.find(sd => sd.id === doc.id)
                            })
                            .map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-white border rounded">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                  <span className="text-sm truncate">{doc.name}</span>
                                  {doc.is_template && (
                                    <Badge variant="outline" className="text-xs">Šablona</Badge>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (isEditMode && selectedStep) {
                                        handleAttachDocumentToStep(selectedStep.id, doc.id, false)
                                      } else {
                                        handleAddTempDocument(doc.id, doc.name, false)
                                      }
                                    }}
                                    className="text-xs px-2 py-1"
                                  >
                                    Volitelný
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      if (isEditMode && selectedStep) {
                                        handleAttachDocumentToStep(selectedStep.id, doc.id, true)
                                      } else {
                                        handleAddTempDocument(doc.id, doc.name, true)
                                      }
                                    }}
                                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700"
                                  >
                                    Povinný
                                  </Button>
                                </div>
                              </div>
                          ))}
                          {availableDocuments.filter(doc => {
                            const existingDocs = isEditMode ? stepDocuments : tempStepDocuments
                            return !existingDocs.find(sd => sd.id === doc.id)
                          }).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              Všechny dostupné dokumenty jsou již připojeny
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowStepDocumentSelector(false)}
                          className="w-full"
                        >
                          Zrušit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsStepDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button 
                onClick={handleStepSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  isEditMode ? 'Uložit změny' : 'Přidat krok'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
