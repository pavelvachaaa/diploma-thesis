"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X, User, Briefcase } from "lucide-react"
import { getAllApplicants, type Applicant } from "@/lib/api/applicants"
import { Employee, getAllEmployees } from "@/lib/api/employees" // Import the employee API
import {
  createInterview,
  type CreateInterviewData,
  type ParticipantInput,
} from "@/lib/api/interviews"
import { validateInterviewData } from "../utils/interviewUtils"
import toast from "react-hot-toast"
import { AsyncCombobox } from "@/components/search_select/AsyncSearchSelect"

interface CreateInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (interviewId: string) => void
  preSelectedApplicant: Applicant;
}

interface TempParticipant extends ParticipantInput {
  tempId: string
  displayName: string
}
import { format, addHours, startOfMinute } from "date-fns"
const getDefaultDateTime = () => startOfMinute(addHours(new Date(), 1))

export default function CreateInterviewDialog({
  open,
  onOpenChange,
  onSuccess,
  preSelectedApplicant
}: CreateInterviewDialogProps) {
  const defaultDate = getDefaultDateTime()
  // Form state
  const [applicantId, setApplicantId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("10:00")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [location, setLocation] = useState("")
  const [onlineMeetingLink, setOnlineMeetingLink] = useState("")
  const [notes, setNotes] = useState("")
  const [participants, setParticipants] = useState<TempParticipant[]>([])

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Participant form state
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [participantMode, setParticipantMode] = useState<'internal' | 'external'>('external')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [participantEmail, setParticipantEmail] = useState("")
  const [participantName, setParticipantName] = useState("")
  const [participantRole, setParticipantRole] = useState<'organizer' | 'interviewer' | 'observer'>('interviewer')

  useEffect(() => {
    if (open) {
      const nextHour = getDefaultDateTime()

      if (preSelectedApplicant) {
        setApplicantId(preSelectedApplicant.id)
        setTitle(`Pohovor - ${preSelectedApplicant.name} ${preSelectedApplicant.surname}`)
      }

      // Nastavíme výchozí čas při každém otevření, pokud už není vybrán jiný
      setSelectedDate(nextHour)
      setSelectedTime(format(nextHour, "HH:mm"))
    }
  }, [open, preSelectedApplicant])


  const handleAddParticipant = () => {
    let newParticipant: TempParticipant

    if (participantMode === 'internal') {
      if (!selectedEmployee) {
        toast.error('Vyberte zaměstnance ze seznamu')
        return
      }

      newParticipant = {
        tempId: `int-${selectedEmployee.id}-${Date.now()}`,
        user_id: selectedEmployee.id,
        role: participantRole,
        displayName: `${selectedEmployee.name} ${selectedEmployee.surname} (Interní)`
      }
    } else {
      if (!participantEmail || !participantName) {
        toast.error('Vyplňte email a jméno účastníka')
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(participantEmail)) {
        toast.error('Neplatný formát emailu')
        return
      }

      newParticipant = {
        tempId: `ext-${Date.now()}`,
        external_email: participantEmail,
        external_name: participantName,
        role: participantRole,
        displayName: `${participantName} (${participantEmail})`
      }
    }

    setParticipants([...participants, newParticipant])
    // Reset participant fields
    setSelectedEmployee(null)
    setParticipantEmail("")
    setParticipantName("")
    setShowAddParticipant(false)
    toast.success('Účastník přidán')
  }

  const handleRemoveParticipant = (tempId: string) => {
    setParticipants(participants.filter(p => p.tempId !== tempId))
  }

  const handleSubmit = async () => {
    try {
      setHasSubmitted(true)
      if (!applicantId || !selectedDate) {
        setErrors(['Vyberte uchazeče a datum'])
        return
      }

      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledAt = new Date(selectedDate)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const data: CreateInterviewData = {
        applicant_id: applicantId,
        title,
        description: description || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(durationMinutes),
        location_type: 'other',
        location: location || undefined,
        online_meeting_link: onlineMeetingLink || undefined,
        notes: notes || undefined,
        participants: participants.length > 0 ? participants.map(({ tempId, displayName, ...rest }) => rest) : undefined
      }

      const validation = validateInterviewData(data)
      if (!validation.valid) {
        setErrors(validation.errors)
        return
      }

      setSubmitting(true)
      const createdInterview = await createInterview(data)
      resetForm()
      onSuccess(createdInterview.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se vytvořit pohovor'
      setErrors([errorMessage])
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }


  const [formKey, setFormKey] = useState(0);
  const resetForm = () => {
    const nextHour = getDefaultDateTime()
    setApplicantId("")
    setTitle("")
    setDescription("")
    setSelectedDate(nextHour)
    setSelectedTime(format(nextHour, "HH:mm"))
    setParticipants([])
    setErrors([])
    setShowAddParticipant(false)
    setHasSubmitted(false)

    setFormKey(prev => prev + 1);
  }
  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Naplánovat pohovor</DialogTitle>
          <DialogDescription>
            Vytvořte nový pohovor s uchazečem. Po vytvoření bude odeslána pozvánka emailem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-6 py-4">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Applicant Selection */}
            <AsyncCombobox<Applicant>
              label="Uchazeč *"
              key={`applicant-${formKey}`}
              initialDisplayValue={preSelectedApplicant ? `${preSelectedApplicant.name} ${preSelectedApplicant.surname}` : ""}
              placeholder="Vyhledejte uchazeče…"
              error={hasSubmitted && !applicantId}
              fetchItems={(search) =>
                getAllApplicants({ search, limit: 5 }).then(r => r.data)
              }
              getItemLabel={(a) => `${a.name} ${a.surname}`}
              getItemDescription={(a) => `${a.job_title} • ${a.email}`}
              onSelect={(a) => {
                setApplicantId(a.id)
                if (!title) {
                  setTitle(`Pohovor - ${a.name} ${a.surname}`)
                }
              }}
            />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Název pohovoru *</Label>
              <Input
                id="title"
                placeholder="např. Pohovor - Zdravotní sestra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Popis (volitelné)</Label>
              <Textarea
                id="description"
                placeholder="Popis pohovoru nebo agenda..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Datum *</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Čas *</Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Délka (minuty) *</Label>
              <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minut</SelectItem>
                  <SelectItem value="30">30 minut</SelectItem>
                  <SelectItem value="45">45 minut</SelectItem>
                  <SelectItem value="60">1 hodina</SelectItem>
                  <SelectItem value="90">1.5 hodiny</SelectItem>
                  <SelectItem value="120">2 hodiny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Místo konání / adresa (volitelné)</Label>
              <Input
                id="location"
                placeholder="např. Budova A, místnost 201"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Online Meeting Link */}
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Online odkaz (volitelné)</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://meet.google.com/..."
                value={onlineMeetingLink}
                onChange={(e) => setOnlineMeetingLink(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky (volitelné)</Label>
              <Textarea
                id="notes"
                placeholder="Interní poznámky..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Účastníci</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddParticipant(!showAddParticipant)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat kolegu nebo hosta
                </Button>
              </div>

              {/* Added Participants List */}
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.tempId} className="flex items-center justify-between p-2 border rounded-md bg-card">
                    <div className="flex items-center gap-2">
                      {p.user_id ? <Briefcase className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{p.displayName}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{p.role}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveParticipant(p.tempId)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Inline Add Participant Form */}
              {showAddParticipant && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <Tabs value={participantMode} onValueChange={(v: any) => setParticipantMode(v)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="internal">Zaměstnanec</TabsTrigger>
                      <TabsTrigger value="external">Externí host</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {participantMode === 'internal' ? (
                    <AsyncCombobox<Employee>
                      placeholder="Vyhledejte kolegu..."
                      label="Účastník"
                      key={`employee-${formKey}`}
                      fetchItems={(search) => getAllEmployees({ search, limit: 5 }).then(r => r.data)}
                      getItemLabel={(e) => `${e.name} ${e.surname}`}
                      getItemDescription={(e) => e.email}
                      onSelect={(e) => setSelectedEmployee(e)}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Jméno"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        value={participantEmail}
                        onChange={(e) => setParticipantEmail(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Role v pohovoru</Label>
                      <Select value={participantRole} onValueChange={(v: any) => setParticipantRole(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interviewer">Tazatel</SelectItem>
                          <SelectItem value="organizer">Organizátor</SelectItem>
                          <SelectItem value="observer">Pozorovatel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" onClick={handleAddParticipant}>Přidat</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleCancel} disabled={submitting}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Vytváření...' : 'Vytvořit pohovor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
