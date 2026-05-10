"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, Clock } from "lucide-react"

interface AcknowledgeCardProps {
  step: {
    step_type: string
    acknowledgment_text?: string
  }
  userStep: {
    acknowledged: boolean
  }
  onAcknowledge: (acknowledged: boolean) => Promise<void>
}

export default function AcknowledgeCard({ step, userStep, onAcknowledge }: AcknowledgeCardProps) {
  const [loading, setLoading] = useState(false)
  const [localAcknowledged, setLocalAcknowledged] = useState(userStep.acknowledged)

  const handleSaveAcknowledgment = async () => {
    try {
      setLoading(true)
      await onAcknowledge(localAcknowledged)
    } catch (err) {
      // Error handling is done in parent component
      // Reset local state on error
      setLocalAcknowledged(userStep.acknowledged)
    } finally {
      setLoading(false)
    }
  }

  // Only show if this is an ack step or has acknowledgment text
  if (step.step_type !== 'ack' && !step.acknowledgment_text) {
    return null
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = localAcknowledged !== userStep.acknowledged

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Potvrzení vyžadováno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step.acknowledgment_text && (
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-blue-800 whitespace-pre-wrap">
              {step.acknowledgment_text}
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="acknowledge"
            checked={localAcknowledged}
            onCheckedChange={(checked) => setLocalAcknowledged(!!checked)}
            disabled={loading}
          />
          <label 
            htmlFor="acknowledge" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Potvrzuji, že jsem si přečetl(a) a porozuměl(a) výše uvedeným informacím
          </label>
        </div>

        {hasUnsavedChanges && (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            Máte neuložené změny. Klikněte na tlačítko níže pro uložení.
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSaveAcknowledgment}
            disabled={loading || !hasUnsavedChanges}
            className={localAcknowledged ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {loading ? (
              <Clock className="h-4 w-4 animate-spin mr-2" />
            ) : localAcknowledged ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : null}
            {localAcknowledged ? 'Potvrdit' : 'Zrušit potvrzení'}
          </Button>
        </div>

        {userStep.acknowledged && !hasUnsavedChanges && (
          <div className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Tento krok byl potvrzen
          </div>
        )}
      </CardContent>
    </Card>
  )
}