"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, Plus, Edit, Trash2, Save, Clock, Users, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import toast from "react-hot-toast"
import { 
  getWorkflowWithSteps, 
  createStep,
  updateStep,
  addStepToWorkflow,
  removeStepFromWorkflow
} from "@/lib/api/workflows"

// Define interfaces locally to avoid import issues
interface SimpleWorkflow {
  id: string
  name: string
  description?: string
  organization_id: string
  organization_name?: string
  steps: SimpleStep[]
}

interface SimpleStep {
  id: string
  title: string
  description?: string
  step_type: 'info' | 'ack' | 'form' | 'quiz'
  is_mandatory: boolean
  order_index: number
  days_from_start: number
  duration_days: number
  auto_assign: boolean
  instructions?: string
  acknowledgment_text?: string
  content_url?: string
}

interface StepFormData {
  title: string
  description: string
  step_type: 'info' | 'ack' | 'form' | 'quiz'
  days_from_start: number
  duration_days: number
  is_mandatory: boolean
  auto_assign: boolean
  instructions: string
  acknowledgment_text: string
  content_url: string
}

export default function SimpleWorkflowBuilderPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [workflow, setWorkflow] = useState<SimpleWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedStep, setSelectedStep] = useState<SimpleStep | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      const workflowData = await getWorkflowWithSteps(id)
      setWorkflow(workflowData)
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
    setIsEditMode(false)
    setIsStepDialogOpen(true)
  }

  const openEditStepDialog = (step: SimpleStep) => {
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
    setIsEditMode(true)
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

  const handleRemoveStep = async (step: SimpleStep) => {
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

  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'form': return 'Formulář'
      case 'ack': return 'Potvrzení'
      case 'quiz': return 'Test'
      case 'info': return 'Informace'
      default: return stepType
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Načítání workflow builder...</p>
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
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
    )
  }

  return (
    <div className="space-y-6 p-6">
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
              {workflow.organization_name} • {workflow.steps?.length || 0} kroků
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
                  {workflow.steps?.length ? 
                    Math.max(...workflow.steps.map(s => s.days_from_start + s.duration_days)) : 0} dní
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Počet kroků</p>
                <p className="text-xs text-muted-foreground">{workflow.steps?.length || 0} kroků</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Povinné kroky</p>
                <p className="text-xs text-muted-foreground">
                  {workflow.steps?.filter(s => s.is_mandatory).length || 0} povinných
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Kroky workflow</CardTitle>
          <CardDescription>
            Klikněte pro úpravu kroků
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!workflow.steps || workflow.steps.length === 0 ? (
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
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
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
                        <span>{getStepTimingLabel(step.days_from_start)}</span>
                        <span>{step.duration_days} {step.duration_days === 1 ? 'den' : 'dní'}</span>
                        {step.auto_assign && <span>Auto-přiřazení</span>}
                      </div>
                      
                      {step.instructions && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <strong>Instrukce:</strong> {step.instructions}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
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
                placeholder="Detailní instrukce, jak tento krok splnit"
                value={stepFormData.instructions}
                onChange={(e) => setStepFormData(prev => ({ ...prev, instructions: e.target.value }))}
              />
            </div>

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
  )
}