import { Interview, InterviewStatus, LocationType, Participant } from '@/lib/api/interviews'
import { Building, Video, MapPin, MoreHorizontal, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow, isPast, isFuture, differenceInHours, differenceInDays, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'

/**
 * Interview utility functions
 * Formatting, validation, and helper functions for interviews
 */

// ============================================
// Status Badge Styling
// ============================================

export function getStatusBadgeClass(status: InterviewStatus): string {
  const statusClasses = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-gray-50 text-gray-700 border-gray-200',
    no_show: 'bg-orange-50 text-orange-700 border-orange-200'
  }

  return statusClasses[status] || 'bg-gray-50 text-gray-700 border-gray-200'
}

export function getStatusLabel(status: InterviewStatus): string {
  const statusLabels = {
    scheduled: 'Naplánováno',
    confirmed: 'Potvrzeno',
    cancelled: 'Zrušeno',
    completed: 'Dokončeno',
    no_show: 'Nedostavil se'
  }

  return statusLabels[status] || status
}

export function getStatusIcon(status: InterviewStatus) {
  const icons = {
    scheduled: Calendar,
    confirmed: CheckCircle,
    cancelled: XCircle,
    completed: CheckCircle,
    no_show: AlertCircle
  }

  return icons[status] || Clock
}

// ============================================
// Location Type Helpers
// ============================================

export function getLocationIcon(locationType: LocationType) {
  const icons = {
    office: Building,
    online: Video,
    department: MapPin,
    other: MoreHorizontal
  }

  return icons[locationType] || Building
}

export function getLocationTypeLabel(locationType: LocationType): string {
  const labels = {
    office: 'Kancelář',
    online: 'Online',
    department: 'Oddělení',
    other: 'Jiné'
  }

  return labels[locationType] || locationType
}

// ============================================
// Date/Time Formatting
// ============================================

/**
 * Format interview date and time in Czech format
 * Example: "Pondělí, 17. ledna 2026 v 10:00"
 */
export function formatInterviewDateTime(scheduledAt: string): string {
  try {
    const date = parseISO(scheduledAt)
    return format(date, "EEEE, d. MMMM yyyy 'v' HH:mm", { locale: cs })
  } catch (error) {
    console.error('Error formatting date:', error)
    return scheduledAt
  }
}

/**
 * Format just the date
 * Example: "17. ledna 2026"
 */
export function formatInterviewDate(scheduledAt: string): string {
  try {
    const date = parseISO(scheduledAt)
    return format(date, 'd. MMMM yyyy', { locale: cs })
  } catch (error) {
    return scheduledAt
  }
}

/**
 * Format just the time
 * Example: "10:00"
 */
export function formatInterviewTime(scheduledAt: string): string {
  try {
    const date = parseISO(scheduledAt)
    return format(date, 'HH:mm', { locale: cs })
  } catch (error) {
    return scheduledAt
  }
}

/**
 * Format duration in minutes to human-readable Czech
 * Examples: "30 minut", "1 hodina", "1.5 hodiny", "2 hodiny"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minuta' : minutes < 5 ? 'minuty' : 'minut'}`
  }

  const hours = minutes / 60

  if (hours === 1) {
    return '1 hodina'
  } else if (hours < 2) {
    return `${hours} hodiny`
  } else if (hours === Math.floor(hours)) {
    return `${hours} ${hours < 5 ? 'hodiny' : 'hodin'}`
  } else {
    return `${hours} hodiny`
  }
}

/**
 * Get time until interview in human-readable format
 * Examples: "za 2 dny", "za 3 hodiny", "před 1 dnem"
 */
export function getTimeUntilInterview(scheduledAt: string): string {
  try {
    const date = parseISO(scheduledAt)
    return formatDistanceToNow(date, { addSuffix: true, locale: cs })
  } catch (error) {
    return ''
  }
}

/**
 * Get short date format for calendar
 * Example: "17. 1." or "17. ledna" based on length
 */
export function formatCalendarDate(scheduledAt: string, short: boolean = true): string {
  try {
    const date = parseISO(scheduledAt)
    return short ? format(date, 'd. M.') : format(date, 'd. MMMM', { locale: cs })
  } catch (error) {
    return scheduledAt
  }
}

// ============================================
// Time Checks
// ============================================

/**
 * Check if interview is upcoming (in the future)
 */
export function isUpcoming(interview: Interview): boolean {
  try {
    const date = parseISO(interview.scheduled_at)
    return isFuture(date) && interview.status !== 'cancelled'
  } catch (error) {
    return false
  }
}

/**
 * Check if interview is in the past
 */
export function isInterviewPast(interview: Interview): boolean {
  try {
    const date = parseISO(interview.scheduled_at)
    return isPast(date)
  } catch (error) {
    return false
  }
}

/**
 * Check if interview is within next 24 hours
 */
export function isWithin24Hours(scheduledAt: string): boolean {
  try {
    const date = parseISO(scheduledAt)
    const now = new Date()
    const hoursDiff = differenceInHours(date, now)
    return hoursDiff > 0 && hoursDiff <= 24
  } catch (error) {
    return false
  }
}

/**
 * Check if interview is today
 */
export function isToday(scheduledAt: string): boolean {
  try {
    const date = parseISO(scheduledAt)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  } catch (error) {
    return false
  }
}

// ============================================
// Participant Helpers
// ============================================

/**
 * Get participant display name (user or external)
 */
export function getParticipantDisplayName(participant: Participant): string {
  if (participant.user_name) {
    return `${participant.user_name} ${participant.user_surname || ''}`.trim()
  }
  return participant.external_name || participant.external_email || 'Neznámý účastník'
}

/**
 * Get participant email
 */
export function getParticipantEmail(participant: Participant): string {
  return participant.user_email || participant.external_email || ''
}

/**
 * Check if current user is a participant
 */
export function isCurrentUserParticipant(interview: Interview, userId: string): boolean {
  if (!interview.participants) return false
  return interview.participants.some(p => p.user_id === userId)
}

/**
 * Get participant role label
 */
export function getParticipantRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    organizer: 'Organizátor',
    interviewer: 'Tazatel',
    observer: 'Pozorovatel'
  }
  return labels[role] || role
}

/**
 * Get attendance status label
 */
export function getAttendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Čeká na potvrzení',
    accepted: 'Potvrzeno',
    declined: 'Odmítnuto',
    tentative: 'Nezávazně'
  }
  return labels[status] || status
}

/**
 * Get attendance status badge class
 */
export function getAttendanceStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    declined: 'bg-red-50 text-red-700 border-red-200',
    tentative: 'bg-blue-50 text-blue-700 border-blue-200'
  }
  return classes[status] || 'bg-gray-50 text-gray-700 border-gray-200'
}

// ============================================
// Permission Checks
// ============================================

/**
 * Check if user can edit interview
 * Can edit if: created by user, or user is admin/super_admin, and not cancelled/completed
 */
export function canEditInterview(interview: Interview, userId: string, userRoles: string[]): boolean {
  // Cannot edit cancelled or completed interviews
  if (interview.status === 'cancelled' || interview.status === 'completed') {
    return false
  }

  // Creator can always edit
  if (interview.created_by === userId) {
    return true
  }

  // Admins can edit
  if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
    return true
  }

  return false
}

/**
 * Check if user can cancel interview
 */
export function canCancelInterview(interview: Interview, userId: string, userRoles: string[]): boolean {
  // Cannot cancel already cancelled/completed interviews
  if (interview.status === 'cancelled' || interview.status === 'completed') {
    return false
  }

  // Creator can cancel
  if (interview.created_by === userId) {
    return true
  }

  // Admins can cancel
  if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
    return true
  }

  return false
}

/**
 * Check if user can mark interview as complete
 */
export function canCompleteInterview(interview: Interview, userId: string, userRoles: string[]): boolean {
  // Can only complete interviews that are in the past
  if (!isInterviewPast(interview)) {
    return false
  }

  // Cannot complete cancelled interviews
  if (interview.status === 'cancelled') {
    return false
  }

  // Already completed
  if (interview.status === 'completed') {
    return false
  }

  // Creator or participant can complete
  if (interview.created_by === userId || isCurrentUserParticipant(interview, userId)) {
    return true
  }

  // Admins can complete
  if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
    return true
  }

  return false
}

// ============================================
// Validation
// ============================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate interview data before submission
 */
export function validateInterviewData(data: any): ValidationResult {
  const errors: string[] = []

  // Required fields
  if (!data.applicant_id) {
    errors.push('Uchazeč je povinný')
  }

  if (!data.title || data.title.trim() === '') {
    errors.push('Název je povinný')
  }

  if (!data.scheduled_at) {
    errors.push('Datum a čas je povinný')
  } else {
    // Check if date is in the future
    try {
      const scheduledDate = parseISO(data.scheduled_at)
      if (isPast(scheduledDate)) {
        errors.push('Datum a čas musí být v budoucnosti')
      }
    } catch (error) {
      errors.push('Neplatný formát data a času')
    }
  }

  if (data.online_meeting_link && data.online_meeting_link.trim() !== '') {
    // Basic URL validation
    try {
      new URL(data.online_meeting_link)
    } catch (error) {
      errors.push('Neplatný formát URL odkazu')
    }
  }

  if (data.duration_minutes && (data.duration_minutes < 15 || data.duration_minutes > 480)) {
    errors.push('Délka musí být mezi 15 a 480 minutami')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
