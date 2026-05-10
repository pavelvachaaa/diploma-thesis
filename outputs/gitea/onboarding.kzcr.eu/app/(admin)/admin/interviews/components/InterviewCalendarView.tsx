"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { format, isSameDay, parseISO } from "date-fns"
import { cs } from "date-fns/locale"
import type { Interview } from "@/lib/api/interviews"
import {
  getStatusBadgeClass,
  getStatusLabel,
  formatInterviewTime
} from "../utils/interviewUtils"

interface InterviewCalendarViewProps {
  interviews: Interview[]
  loading?: boolean
}

export default function InterviewCalendarView({ interviews, loading }: InterviewCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [month, setMonth] = useState<Date>(new Date())

  // Get interviews for the selected date
  const interviewsOnDate = interviews.filter(interview => {
    try {
      const interviewDate = parseISO(interview.scheduled_at)
      return isSameDay(interviewDate, selectedDate)
    } catch (error) {
      return false
    }
  })

  // Get dates that have interviews for highlighting
  const datesWithInterviews = interviews.map(interview => {
    try {
      return parseISO(interview.scheduled_at)
    } catch (error) {
      return null
    }
  }).filter(Boolean) as Date[]

  const modifiers = {
    hasInterview: datesWithInterviews
  }

  const modifiersClassNames = {
    hasInterview: "bg-blue-100 font-semibold"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání kalendáře...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Calendar */}
      <div className="flex flex-col">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          month={month}
          onMonthChange={setMonth}
          locale={cs}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border"
        />

        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-blue-100 rounded mr-2"></span>
            Dny s naplánovanými pohovory
          </p>
        </div>
      </div>

      {/* Interviews on selected date */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, "d. MMMM yyyy", { locale: cs })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {interviewsOnDate.length === 0
              ? "Žádné pohovory"
              : `${interviewsOnDate.length} ${interviewsOnDate.length === 1 ? 'pohovor' : interviewsOnDate.length < 5 ? 'pohovory' : 'pohovorů'}`
            }
          </p>
        </div>

        {interviewsOnDate.length > 0 ? (
          <div className="space-y-3">
            {interviewsOnDate
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .map(interview => (
                <Link
                  key={interview.id}
                  href={`/admin/interviews/${interview.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{interview.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {interview.applicant_name} {interview.applicant_surname}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(interview.status)}>
                        {getStatusLabel(interview.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>🕐 {formatInterviewTime(interview.scheduled_at)}</span>
                      <span>⏱️ {interview.duration_minutes} min</span>
                      {interview.participant_count > 0 && (
                        <span>👥 {interview.participant_count}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">
              <p>Žádné pohovory na tento den</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
