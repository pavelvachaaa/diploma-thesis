"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus, Upload, Loader2, X } from "lucide-react"
import { createApplicant } from "@/lib/api/applicants"

interface AddApplicantDialogProps {
  onSuccess?: () => void
  preselectedJobId: string        // Made required since we removed the selector
  preselectedOrganizationId: string // Made required since we removed the selector
  // Optional: Pass these if you want to display them as text in the form
  jobTitle?: string
  organizationName?: string
  triggerButton?: React.ReactNode
}

// Initial state helper
const getInitialState = (jobId: string, orgId: string) => ({
  name: "",
  surname: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  education: "",
  field: "",
  experience: "",
  last_employer: "",
  last_position: "",
  job_posting_id: jobId,
  organization_id: orgId,
  cv: null as File | null,
  coverLetter: null as File | null,
})

export function AddApplicantDialog({
  onSuccess,
  preselectedJobId,
  preselectedOrganizationId,
  jobTitle,
  organizationName,
  triggerButton,
}: AddApplicantDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize directly with the preselected IDs
  const [formData, setFormData] = useState(() =>
    getInitialState(preselectedJobId, preselectedOrganizationId)
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: "cv" | "coverLetter", file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Jméno je povinné"
    if (!formData.surname.trim()) return "Příjmení je povinné"
    if (!formData.email.trim()) return "Email je povinný"
    if (!formData.phone.trim()) return "Telefon je povinný"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const submitData = new FormData()

      // Append all string fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "cv" && key !== "coverLetter" && value) {
          submitData.append(key, value as string)
        }
      })

      submitData.append("gdpr_consent", "true")

      if (formData.cv) submitData.append("attachments", formData.cv)
      if (formData.coverLetter) submitData.append("attachments", formData.coverLetter)

      await createApplicant(submitData)

      // Reset and close
      setFormData(getInitialState(preselectedJobId, preselectedOrganizationId))
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se vytvořit uchazeče")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Přidat uchazeče
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Přidat nového uchazeče</DialogTitle>
          <DialogDescription>
            {jobTitle
              ? `Přidat uchazeče pro pozici: ${jobTitle}`
              : "Vyplňte informace o uchazeči. Pole označená * jsou povinná."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Context Display (Optional - Visual confirmation for the user) */}
          {(jobTitle || organizationName) && (
            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground flex gap-4">
              {organizationName && (
                <div>
                  <span className="font-medium text-foreground">Organizace:</span> {organizationName}
                </div>
              )}
              {jobTitle && (
                <div>
                  <span className="font-medium text-foreground">Pozice:</span> {jobTitle}
                </div>
              )}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Osobní údaje</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Jméno *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Příjmení *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Město</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">PSČ</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Education and Experience */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Vzdělání a praxe</h3>
            <div className="space-y-2">
              <Label htmlFor="education">Vzdělání</Label>
              <Select value={formData.education} onValueChange={(value) => handleInputChange("education", value)}>
                <SelectTrigger id="education">
                  <SelectValue placeholder="Vyberte vzdělání" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">Střední s maturitou</SelectItem>
                  <SelectItem value="vocational">Vyšší odborné</SelectItem>
                  <SelectItem value="bachelor">Bakalářské</SelectItem>
                  <SelectItem value="master">Magisterské</SelectItem>
                  <SelectItem value="doctoral">Doktorské</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field">Obor vzdělání</Label>
                <Input
                  id="field"
                  value={formData.field}
                  onChange={(e) => handleInputChange("field", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Délka praxe</Label>
                <Select value={formData.experience} onValueChange={(value) => handleInputChange("experience", value)}>
                  <SelectTrigger id="experience">
                    <SelectValue placeholder="Vyberte délku praxe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Bez praxe</SelectItem>
                    <SelectItem value="1">Méně než 1 rok</SelectItem>
                    <SelectItem value="1-3">1-3 roky</SelectItem>
                    <SelectItem value="3-5">3-5 let</SelectItem>
                    <SelectItem value="5-10">5-10 let</SelectItem>
                    <SelectItem value="10+">Více než 10 let</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_employer">Poslední zaměstnavatel</Label>
                <Input
                  id="last_employer"
                  value={formData.last_employer}
                  onChange={(e) => handleInputChange("last_employer", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_position">Poslední pozice</Label>
                <Input
                  id="last_position"
                  value={formData.last_position}
                  onChange={(e) => handleInputChange("last_position", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Dokumenty</h3>
            <div className="space-y-2">
              <Label htmlFor="cv">Životopis</Label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cv-upload"
                  className="flex-1 flex items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.cv ? formData.cv.name : "Vyberte soubor"}
                    </span>
                  </div>
                  <Input
                    id="cv-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange("cv", e.target.files?.[0] || null)}
                  />
                </label>
                {formData.cv && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleFileChange("cv", null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-letter">Motivační dopis</Label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cover-letter-upload"
                  className="flex-1 flex items-center justify-center h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.coverLetter ? formData.coverLetter.name : "Vyberte soubor"}
                    </span>
                  </div>
                  <Input
                    id="cover-letter-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange("coverLetter", e.target.files?.[0] || null)}
                  />
                </label>
                {formData.coverLetter && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleFileChange("coverLetter", null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Zrušit
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vytváření...
                </>
              ) : (
                "Vytvořit uchazeče"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}