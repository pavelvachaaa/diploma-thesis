"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  User,
  X
} from "lucide-react"
import { getEmployeeStepResponses } from "@/lib/api/admin-employee-onboarding"

interface FormResponsesViewerProps {
  employeeId: string
  stepId: string
  stepTitle: string
  isOpen: boolean
  onClose: () => void
}

interface FormField {
  id: string
  type: string
  label: string
  required?: boolean
  options?: Array<{value: string; label: string}>
}

interface StepDetails {
  step: {
    id: string
    title: string
    description: string
    step_type: string
  }
  form: {
    id: string
    title: string
    description: string
    fields: FormField[]
  }
  userStepProgress: {
    id: string
    status: string
    acknowledged: boolean
    form_response: Record<string, any>
    submitted_at: string
    completed_at: string
  }
}

export default function FormResponsesViewer({ 
  employeeId, 
  stepId, 
  stepTitle, 
  isOpen, 
  onClose 
}: FormResponsesViewerProps) {
  const [stepDetails, setStepDetails] = useState<StepDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && stepId && employeeId) {
      fetchStepResponses()
    }
  }, [isOpen, stepId, employeeId])

  const fetchStepResponses = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getEmployeeStepResponses(employeeId, stepId)
      setStepDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst odpovědi')
      console.error('Error fetching step responses:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nedokončeno'
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFieldValue = (field: FormField, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Nevyplněno</span>
    }

    switch (field.type) {
      case 'checkbox':
        return value ? 
          <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" />Ano</span> : 
          <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />Ne</span>
      
      case 'select':
        const option = field.options?.find(opt => opt.value === value)
        return option ? option.label : value
      
      case 'date':
        return new Date(value).toLocaleDateString('cs-CZ')
      
      default:
        return String(value)
    }
  }

  const getResponseStatus = (field: FormField, value: any) => {
    if (field.required && (value === null || value === undefined || value === '')) {
      return <Badge variant="destructive" className="text-xs">Povinné - nevyplněno</Badge>
    }
    if (value !== null && value !== undefined && value !== '') {
      return <Badge variant="default" className="text-xs">Vyplněno</Badge>
    }
    return <Badge variant="secondary" className="text-xs">Volitelné</Badge>
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Odpovědi z formuláře: {stepTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {stepDetails && (
            <>
              {/* Step Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informace o kroku</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Název:</span>
                    <p className="text-sm">{stepDetails.step.title}</p>
                  </div>
                  <div>
                    <span className="font-medium">Typ:</span>
                    <p className="text-sm">{stepDetails.step.step_type.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={
                      stepDetails.userStepProgress.status === 'completed' ? 'default' : 
                      stepDetails.userStepProgress.status === 'in_progress' ? 'secondary' : 
                      'outline'
                    }>
                      {stepDetails.userStepProgress.status === 'completed' && 'Dokončen'}
                      {stepDetails.userStepProgress.status === 'in_progress' && 'Probíhá'}
                      {stepDetails.userStepProgress.status === 'not_started' && 'Nezahájen'}
                      {stepDetails.userStepProgress.status === 'skipped' && 'Přeskočen'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Dokončeno:</span>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(stepDetails.userStepProgress.completed_at)}
                    </p>
                  </div>
                  {stepDetails.userStepProgress.submitted_at && (
                    <div>
                      <span className="font-medium">Odeslán:</span>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(stepDetails.userStepProgress.submitted_at)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Details */}
              {stepDetails.form && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detail formuláře</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="font-medium">Název formuláře:</span>
                      <p className="text-sm">{stepDetails.form.title || 'Bez názvu'}</p>
                    </div>
                    {stepDetails.form.description && (
                      <div>
                        <span className="font-medium">Popis:</span>
                        <p className="text-sm text-muted-foreground">{stepDetails.form.description}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Celkem polí:</span>
                        <Badge variant="outline">{stepDetails.form.fields?.length || 0}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Povinné:</span>
                        <Badge variant="outline">
                          {stepDetails.form.fields?.filter(f => f.required).length || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Responses */}
              {stepDetails.form?.fields && stepDetails.form.fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Odpovědi zaměstnance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stepDetails.form.fields.map((field) => (
                      <div key={field.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{field.label}</h4>
                            <Badge variant="outline" className="text-xs">
                              {field.type.toUpperCase()}
                            </Badge>
                          </div>
                          {getResponseStatus(field, stepDetails.userStepProgress.form_response[field.id])}
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm">
                            <strong>Odpověď:</strong>
                          </div>
                          <div className="mt-1">
                            {getFieldValue(field, stepDetails.userStepProgress.form_response[field.id])}
                          </div>
                        </div>
                      </div>
                    ))}

                    {stepDetails.form.fields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Formulář neobsahuje žádná pole</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}