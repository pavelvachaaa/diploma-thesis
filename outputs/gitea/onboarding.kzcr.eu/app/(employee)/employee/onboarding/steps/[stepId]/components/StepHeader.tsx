"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, SkipForward, FileText } from "lucide-react"
import type { StepHeaderProps } from "@/lib/types/onboarding-steps"

export default function StepHeader({ step, userStep }: StepHeaderProps) {
  const getStatusIcon = () => {
    switch (userStep.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-gray-500" />
      case 'not_started':
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    switch (userStep.status) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700">Dokončeno</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-50 text-blue-700">Probíhá</Badge>
      case 'skipped':
        return <Badge className="bg-gray-50 text-gray-700">Přeskočeno</Badge>
      case 'not_started':
      default:
        return <Badge className="bg-yellow-50 text-yellow-700">Nezahájeno</Badge>
    }
  }

  const getStepTypeLabel = () => {
    switch (step.step_type) {
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
        return step.step_type
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-2xl">{step.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getStepTypeLabel()}</Badge>
                {step.is_mandatory && (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Povinný
                  </Badge>
                )}
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>
        
        {step.description && (
          <CardDescription className="text-base mt-4">
            {step.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Step metadata */}
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Doba trvání:</span> {step.duration_days} {step.duration_days === 1 ? 'den' : step.duration_days < 5 ? 'dny' : 'dní'}
          </div>
          <div>
            <span className="font-medium">Začátek:</span> Den {step.days_from_start > 0 ? '+' : ''}{step.days_from_start}
          </div>
          {userStep.completed_at && (
            <div>
              <span className="font-medium">Dokončeno:</span> {new Date(userStep.completed_at).toLocaleDateString('cs-CZ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}