"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  Video,
  Building,
  MapPin,
  User,
  Mail,
  FileText,
  Copy,
  ExternalLink,
  Send
} from "lucide-react"
import type { Interview } from "@/lib/api/interviews"
import { resendApplicantInvitation } from "@/lib/api/interviews"
import {
  formatInterviewDateTime,
  formatDuration,
} from "../../utils/interviewUtils"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import toast from "react-hot-toast"
import Link from "next/link"

interface InterviewInfoProps {
  interview: Interview
  readOnly?: boolean
}

export default function InterviewInfo({ interview, readOnly = false }: InterviewInfoProps) {
  const [resendingApplicantInvitation, setResendingApplicantInvitation] = useState(false)

  const isInterviewFinalized = interview.status === 'cancelled' || interview.status === 'completed'

  const handleCopyMeetingLink = () => {
    if (interview.online_meeting_link) {
      navigator.clipboard.writeText(interview.online_meeting_link)
      toast.success('Odkaz zkopírován do schránky')
    }
  }

  const handleResendApplicantInvitation = async () => {
    setResendingApplicantInvitation(true)
    try {
      const result = await resendApplicantInvitation(interview.id)
      toast.success(`Pozvánka byla odeslána na ${result.sentTo}`)
    } catch (error) {
      console.error('Failed to resend applicant invitation:', error)
      toast.error('Nepodařilo se odeslat pozvánku')
    } finally {
      setResendingApplicantInvitation(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Interview Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detaily pohovoru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Datum a čas</p>
              <p className="text-sm text-muted-foreground">
                {formatInterviewDateTime(interview.scheduled_at)}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Délka</p>
              <p className="text-sm text-muted-foreground">
                {formatDuration(interview.duration_minutes)}
              </p>
            </div>
          </div>

          {/* Location */}
          {interview.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Místo konání</p>
                <p className="text-sm text-muted-foreground">{interview.location}</p>
              </div>
            </div>
          )}

          {/* Online Meeting Link */}
          {interview.online_meeting_link && (
            <div className="flex items-start gap-3">
              <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Online odkaz</p>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={interview.online_meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Připojit se k pohovoru
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyMeetingLink}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {interview.description && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Popis</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {interview.description}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {interview.notes && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Poznámky</p>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                  {interview.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applicant Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informace o uchazeči
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Name */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Jméno</p>
            <p className="font-medium text-sm break-words">
              {interview.applicant_name} {interview.applicant_surname}
            </p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <a
              href={`mailto:${interview.applicant_email}`}
              className="text-sm text-primary hover:underline break-all block"
            >
              {interview.applicant_email}
            </a>
          </div>

          {/* Phone */}
          {interview.applicant_phone && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Telefon</p>
              <a
                href={`tel:${interview.applicant_phone}`}
                className="text-sm text-primary hover:underline"
              >
                {interview.applicant_phone}
              </a>
            </div>
          )}

          {/* Job Title */}
          {interview.job_title && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pozice</p>
              <p className="text-sm break-words">
                {interview.job_title}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <Link href={`/admin/applicants/${interview.applicant_id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Detail uchazeče
              </Button>
            </Link>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleResendApplicantInvitation}
                disabled={resendingApplicantInvitation || isInterviewFinalized}
                title={isInterviewFinalized ? `Nelze odeslat pozvánku pro ${interview.status === 'cancelled' ? 'zrušený' : 'dokončený'} pohovor` : 'Znovu odeslat pozvánku uchazeči'}
              >
                <Send className="mr-2 h-4 w-4" />
                {resendingApplicantInvitation ? 'Odesílání...' : 'Odeslat pozvánku'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organization & Creator Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organizace a vytvoření
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organization */}
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Nemocnice</p>
              <p className="text-sm text-muted-foreground">
                {interview.organization_name}
              </p>
            </div>
          </div>

          {/* Created By */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Vytvořil</p>
              <p className="text-sm text-muted-foreground">
                {interview.creator_name} {interview.creator_surname}
              </p>
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Datum vytvoření</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(interview.created_at), "d. MMMM yyyy 'v' HH:mm", { locale: cs })}
              </p>
            </div>
          </div>

          {/* Reminder Sent */}
          {interview.reminder_sent_at && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Připomínka odeslána</p>
                <p className="text-sm text-blue-800">
                  {format(new Date(interview.reminder_sent_at), "d. MMMM yyyy 'v' HH:mm", { locale: cs })}
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Info */}
          {interview.status === 'cancelled' && interview.cancelled_at && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-md border border-red-200">
              <FileText className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Zrušeno</p>
                <p className="text-sm text-red-800">
                  {format(new Date(interview.cancelled_at), "d. MMMM yyyy 'v' HH:mm", { locale: cs })}
                </p>
                {interview.cancellation_reason && (
                  <p className="text-sm text-red-800 mt-1">
                    Důvod: {interview.cancellation_reason}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
