"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, FileText, CheckCircle, Clock, XCircle } from "lucide-react"
import toast from "react-hot-toast"

import { 
  getStepDetails, 
  startOnboardingStep,
  acknowledgeStep,
  submitStepForm,
  markDocumentRead,
  completeOnboardingStep,
  skipStep
} from "@/lib/api/employee_onboarding"

import StepHeader from "./components/StepHeader"
import DocumentList from "./components/DocumentList"
import AcknowledgeCard from "./components/AcknowledgeCard"
import DynamicFormRenderer from "./components/DynamicFormRenderer"
import StepActions from "./components/StepActions"
import type { StepDetails, FormResponse, ValidationError } from "./types"

export default function OnboardingStepPage() {
  const params = useParams()
  const stepId = params.stepId as string

  const [stepDetails, setStepDetails] = useState<StepDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [formValues, setFormValues] = useState<FormResponse>({})
  const [isFormValid, setIsFormValid] = useState(true)
  const [formValidationErrors, setFormValidationErrors] = useState<ValidationError[]>([])

  useEffect(() => {
    fetchStepDetails()
  }, [stepId])

  useEffect(() => {
    // Initialize form values from userStep.form_response
    if (stepDetails?.userStep.form_response) {
      const existingAnswers = { ...stepDetails.userStep.form_response }
      delete existingAnswers.docReads // Remove docReads from form values
      setFormValues(existingAnswers)
    }
  }, [stepDetails])

  const fetchStepDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const details = await getStepDetails(stepId)
      setStepDetails(details)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se načíst údaje o kroku'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // No longer needed - validation is handled by backend

  const handleStart = async () => {
    if (!stepDetails) return

    try {
      setActionLoading(true)
      const result = await startOnboardingStep(stepId)
      
      setStepDetails(prev => prev ? {
        ...prev,
        userStep: { ...prev.userStep, ...result.userStep }
      } : null)
      
      toast.success('Krok byl úspěšně spuštěn')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se spustit krok'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcknowledge = async (acknowledged: boolean) => {
    if (!stepDetails) return

    try {
      setActionLoading(true)
      const result = await acknowledgeStep(stepId, acknowledged)
      
      setStepDetails(prev => prev ? {
        ...prev,
        userStep: { ...prev.userStep, ...result.userStep }
      } : null)
      
      toast.success(acknowledged ? 'Krok byl potvrzen' : 'Potvrzení bylo zrušeno')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se potvrdit krok'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleFormSubmit = async (answers: FormResponse) => {
    if (!stepDetails) return

    try {
      setActionLoading(true)
      setFormValidationErrors([])
      const result = await submitStepForm(stepId, answers)
      
      setStepDetails(prev => prev ? {
        ...prev,
        userStep: { ...prev.userStep, ...result.userStep }
      } : null)
      
      toast.success('Formulář byl úspěšně uložen')
    } catch (err: any) {
      // Handle validation errors
      if (err?.details && Array.isArray(err.details)) {
        setFormValidationErrors(err.details)
        toast.error('Formulář obsahuje chyby. Zkontrolujte označená pole.')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se uložit formulář'
        toast.error(errorMessage)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkDocumentRead = async (documentId: string) => {
    if (!stepDetails) return

    try {
      setActionLoading(true)
      const result = await markDocumentRead(stepId, documentId)
      
      setStepDetails(prev => prev ? {
        ...prev,
        userStep: { ...prev.userStep, ...result.userStep }
      } : null)
      
      toast.success('Dokument byl označen jako přečtený')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se označit dokument jako přečtený'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!stepDetails) return

    try {
      setActionLoading(true)
      const result = await completeOnboardingStep(stepId)
      
      setStepDetails(prev => prev ? {
        ...prev,
        userStep: { ...prev.userStep, ...result.userStep }
      } : null)
      
      toast.success('Krok byl úspěšně dokončen!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se dokončit krok'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!stepDetails) return

    try {
      setActionLoading(true)
      const result = await skipStep(stepId)
      
      setStepDetails(prev => prev ? {
        ...prev,
        userStep: { ...prev.userStep, ...result.userStep }
      } : null)
      
      toast.success('Krok byl přeskočen')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se přeskočit krok'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (error || !stepDetails) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Nepodařilo se načíst údaje o kroku'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { step, form, documents, userStep } = stepDetails

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Step Header */}
      <StepHeader step={step} userStep={userStep} />

      {/* Instructions */}
      {step.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instrukce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {step.instructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <DocumentList 
          documents={documents}
          userStep={userStep}
          onMarkAsRead={handleMarkDocumentRead}
        />
      )}

      {/* Acknowledgment */}
      {(step.step_type === 'ack' || step.acknowledgment_text) && (
        <AcknowledgeCard 
          step={step}
          userStep={userStep}
          onAcknowledge={handleAcknowledge}
        />
      )}

      {/* Form */}
      {form && form.fields && form.fields.length > 0 && (
        <DynamicFormRenderer 
          form={form}
          initialResponse={formValues}
          onSubmit={handleFormSubmit}
          loading={actionLoading}
          validationErrors={formValidationErrors}
        />
      )}

      {/* Actions */}
      <StepActions 
        step={step}
        userStep={userStep}
        documents={documents}
        isFormValid={formValidationErrors.length === 0}
        loading={actionLoading}
        onStart={handleStart}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  )
}