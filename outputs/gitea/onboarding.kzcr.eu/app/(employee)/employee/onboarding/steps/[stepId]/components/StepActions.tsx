"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  CheckCircle, 
  SkipForward, 
  Clock, 
  AlertCircle,
  FileCheck,
  FormInput
} from "lucide-react"

interface StepActionsProps {
  step: {
    id: string
    title: string
    step_type: string
    acknowledgment_text?: string
  }
  userStep: {
    id: string
    status: string
    acknowledged: boolean
    form_response?: any
    completed_at?: string
  }
  documents: Array<{
    document_id: string
    name: string
    is_mandatory: boolean
  }>
  isFormValid?: boolean
  loading?: boolean
  onStart: () => void
  onComplete: () => void
  onSkip: () => void
}

export default function StepActions({ 
  step, 
  userStep, 
  documents, 
  isFormValid = true,
  loading = false,
  onStart, 
  onComplete, 
  onSkip 
}: StepActionsProps) {
  
  const getStepTypeLabel = (stepType: string) => {
    switch (stepType) {
      case 'info':
        return 'Informace'
      case 'ack':
        return 'Potvrzení'
      case 'form':
        return 'Formulář'
      case 'quiz':
        return 'Test'
      case 'file':
        return 'Dokumenty'
      default:
        return stepType
    }
  }

  // Check completion requirements locally for UI display
  const requirements = {
    needsAcknowledgment: (step.step_type === 'ack' || step.acknowledgment_text) && !userStep.acknowledged,
    missingFormFields: [], // We'll handle this in the form component
    unreadMandatoryDocs: documents.filter(d => d.is_mandatory && !userStep.form_response?.docReads?.[d.document_id]) || []
  }
  
  // Calculate if step can be completed based on all requirements
  const canCompleteStep = !requirements.needsAcknowledgment && 
                         requirements.missingFormFields.length === 0 && 
                         requirements.unreadMandatoryDocs.length === 0 && 
                         isFormValid
  
  const canStart = userStep.status === 'not_started'
  const canComplete = userStep.status === 'in_progress' && canCompleteStep
  const canSkip = userStep.status !== 'completed' && userStep.status !== 'skipped'
  const isCompleted = userStep.status === 'completed'
  const isSkipped = userStep.status === 'skipped'

  const getCompletionBlockers = () => {
    const blockers: string[] = []
    
    if (requirements.needsAcknowledgment) {
      blockers.push('Krok musí být potvrzen')
    }
    
    if (requirements.missingFormFields.length > 0) {
      blockers.push('Povinná pole formuláře musí být vyplněna')
    }
    
    if (requirements.unreadMandatoryDocs.length > 0) {
      blockers.push(`${requirements.unreadMandatoryDocs.length} povinný${requirements.unreadMandatoryDocs.length !== 1 ? 'ch' : ''} dokument${requirements.unreadMandatoryDocs.length !== 1 ? 'ů' : ''} musí být přečten${requirements.unreadMandatoryDocs.length !== 1 ? 'o' : ''}`)
    }
    
    if (!isFormValid) {
      blockers.push('Chyby validace formuláře musí být opraveny')
    }
    
    return blockers
  }

  const completionBlockers = getCompletionBlockers()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Akce
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status display */}
        {isCompleted && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Tento krok byl úspěšně dokončen.
              {userStep.completed_at && (
                <> Dokončeno dne {new Date(userStep.completed_at).toLocaleDateString('cs-CZ')}.</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isSkipped && (
          <Alert className="border-gray-200 bg-gray-50">
            <SkipForward className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800">
              Tento krok byl přeskočen.
            </AlertDescription>
          </Alert>
        )}

        {/* Completion requirements */}
        {userStep.status === 'in_progress' && completionBlockers.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div>Pro dokončení tohoto kroku musíte:</div>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {completionBlockers.map((blocker: string, index: number) => (
                  <li key={index} className="text-sm">{blocker}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Completion summary */}
        {userStep.status === 'in_progress' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FormInput className="h-4 w-4" />
                <span className="text-sm font-medium">Potvrzení</span>
              </div>
              <Badge 
                variant={userStep.acknowledged || !requirements.needsAcknowledgment ? "default" : "destructive"}
                className={userStep.acknowledged || !requirements.needsAcknowledgment ? "bg-green-100 text-green-800" : ""}
              >
                {userStep.acknowledged || !requirements.needsAcknowledgment ? "✓" : "✗"} 
                {requirements.needsAcknowledgment ? (userStep.acknowledged ? " Hotovo" : " Povinné") : " Nepoužije se"}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Dokumenty</span>
              </div>
              <Badge 
                variant={requirements.unreadMandatoryDocs.length === 0 ? "default" : "destructive"}
                className={requirements.unreadMandatoryDocs.length === 0 ? "bg-green-100 text-green-800" : ""}
              >
                {requirements.unreadMandatoryDocs.length === 0 ? "✓" : "✗"} 
                {documents.filter(d => d.is_mandatory).length > 0 
                  ? ` ${documents.filter(d => d.is_mandatory).length - requirements.unreadMandatoryDocs.length}/${documents.filter(d => d.is_mandatory).length}` 
                  : " Nepoužije se"
                }
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FormInput className="h-4 w-4" />
                <span className="text-sm font-medium">Formulář</span>
              </div>
              <Badge 
                variant={isFormValid && requirements.missingFormFields.length === 0 ? "default" : "destructive"}
                className={isFormValid && requirements.missingFormFields.length === 0 ? "bg-green-100 text-green-800" : ""}
              >
                {isFormValid && requirements.missingFormFields.length === 0 ? "✓" : "✗"} 
                {step.step_type === 'form' ? (isFormValid ? " Platný" : " Neplatný") : " Nepoužije se"}
              </Badge>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {canStart && (
            <Button
              onClick={onStart}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Spustit krok
            </Button>
          )}

          {userStep.status === 'in_progress' && (
            <>
              <Button
                onClick={onComplete}
                disabled={loading || !canComplete}
                className={`flex items-center gap-2 ${
                  canComplete 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                title={!canComplete ? 'Nejdříve splňte všechny požadavky pro dokončení kroku' : ''}
              >
                {loading ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Dokončit krok
              </Button>

              {canSkip && (
                <Button
                  onClick={onSkip}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <SkipForward className="h-4 w-4" />
                  )}
                  Přeskočit krok
                </Button>
              )}
            </>
          )}
        </div>

        {/* Step type guidance */}
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
          <div className="font-medium mb-1">Typ kroku: {getStepTypeLabel(step.step_type)}</div>
          {step.step_type === 'info' && (
            <p>Toto je informační krok. Projděte si dokumenty a dokončete, až budete připraveni.</p>
          )}
          {step.step_type === 'ack' && (
            <p>Tento krok vyžaduje vaše potvrzení před označením jako dokončený.</p>
          )}
          {step.step_type === 'form' && (
            <p>Vyplňte formulář níže a uložte odpovědi před označením kroku jako dokončený.</p>
          )}
          {step.step_type === 'quiz' && (
            <p>Tento krok obsahuje test, který musíte úspěšně absolvovat pro pokračování.</p>
          )}
          {step.step_type === 'file' && (
            <p>Přečtěte všechny povinné dokumenty před dokončením tohoto kroku.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}