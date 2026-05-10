"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import dynamic from "next/dynamic"

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then(mod => ({ default: mod.RichTextEditor })),
  { ssr: false }
)
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { AuthorizedPerson, getJobById, JobFormData, updateJob } from "@/lib/api/jobs"
import { getAllOrganizations, Organization } from "@/lib/api/organizations"
import { getAllContractTypes, ContractType } from "@/lib/api/contract-types"
import { getJobRoleSectionItems, getJobRolesByOrganization, JobRole } from "@/lib/api/job-roles"
import { RefineButton } from "@/components/admin/ai-job-chat/RefineButton"
import AuthorizedPeopleSection from "../../components/AuthorizedPeopleSection"
import { syncAuthorizedPeopleForJob } from "../../components/authorizedPeopleAssignment"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"
import JobSectionsEditor from "../../components/JobSectionsEditor"
import SectionPrefillDialog from "../../components/SectionPrefillDialog"
import {
  hasSectionContent,
  mapJobRoleSectionItemsToSections,
  SectionPrefillMode,
} from "../../components/sectionPrefill"



const initialFormData: JobFormData = {
  title: '',
  description: '',
  organization_id: '',
  job_role_id: '',
  contract_type_codes: [],
  department: '',
  salary_min: '',
  salary_max: '',
  publish_date: '',
  expire_date: '',
  contact_email: '',
  contact_phone: '',
  cv_required: true,
  is_department_accredited: false,
  status: 'draft',
  sections: {
    duties: [''],
    requirements: [''],
    benefits: ['']
  }
}

export default function EditJobPage() {
  const router = useRouter()
  const { id } = useParams()
  const searchParams = useSearchParams()
  const { roles } = useAuth()
  const adminAccess = getAdminAccessConfig(roles)
  const canUseAiAssistant = adminAccess.capabilities.jobs.canUseAiAssistant
  const [formData, setFormData] = useState<JobFormData>(initialFormData)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [authorizedPeople, setAuthorizedPeople] = useState<AuthorizedPerson[]>([])
  const [authorizedPeopleError, setAuthorizedPeopleError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sectionPrefillDialogOpen, setSectionPrefillDialogOpen] = useState(false)
  const [sectionPrefillMode] = useState<SectionPrefillMode>('replace')
  const [pendingJobRoleId, setPendingJobRoleId] = useState<string | null>(null)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [jobData, orgsResponse, contractTypesData] = await Promise.all([
          getJobById(id as string),
          getAllOrganizations(),
          getAllContractTypes()
        ])

        if (jobData.status === 'archived') {
          router.replace(`/admin/jobs/${id}`)
          return
        }

        setOrganizations(orgsResponse.data)
        setContractTypes(contractTypesData)

        // Load job roles for the job's organization
        if (jobData.organization_id) {
          const rolesData = await getJobRolesByOrganization(jobData.organization_id)
          setJobRoles(rolesData)
        }

        // Populate form with job data
        setFormData({
          title: jobData.title || '',
          description: jobData.description || '',
          organization_id: jobData.organization_id || '',
          job_role_id: jobData.job_role_id || '',
          contract_type_codes: Array.isArray(jobData.contract_type_code) ? jobData.contract_type_code : (jobData.contract_type_code ? [jobData.contract_type_code as unknown as string] : []),
          department: jobData.department || '',
          salary_min: jobData.salary_min ? jobData.salary_min.toString() : '',
          salary_max: jobData.salary_max ? jobData.salary_max.toString() : '',
          publish_date: jobData.publish_date ? jobData.publish_date.split('T')[0] : '',
          expire_date: jobData.expire_date ? jobData.expire_date.split('T')[0] : '',
          contact_email: jobData.contact_email || '',
          contact_phone: jobData.contact_phone || '',
          cv_required: jobData.cv_required !== undefined ? jobData.cv_required : true,
          is_department_accredited: jobData.is_department_accredited || false,
          status: jobData.status as 'draft' | 'active' | 'end',
          sections: {
            duties: jobData.sections?.duties && jobData.sections.duties.length > 0 ? jobData.sections.duties : [''],
            requirements: jobData.sections?.requirements && jobData.sections.requirements.length > 0 ? jobData.sections.requirements : [''],
            benefits: jobData.sections?.benefits && jobData.sections.benefits.length > 0 ? jobData.sections.benefits : ['']
          }
        })
        setAuthorizedPeople(jobData.authorized_people || [])

      } catch (err) {
        setError('Chyba při načítání nabídky práce')
        console.error('Failed to load job data:', err)
      } finally {
        setInitialLoading(false)
      }
    }

    void loadInitialData()
  }, [id, router])

  useEffect(() => {
    const syncError = searchParams.get('authorizedPeopleError')
    if (syncError) {
      setAuthorizedPeopleError(syncError)
    }
  }, [searchParams])

  useEffect(() => {
    if (formData.organization_id) {
      loadJobRoles(formData.organization_id)
      // Auto-fill contact email from organization
      const selectedOrg = organizations.find(org => org.id === formData.organization_id)
      if (selectedOrg?.contact_email) {
        setFormData(prev => ({ ...prev, contact_email: selectedOrg.contact_email || '' }))
      }
    } else {
      setJobRoles([])
    }
  }, [formData.organization_id, organizations])

  async function loadJobRoles(organizationId: string) {
    try {
      const rolesData = await getJobRolesByOrganization(organizationId)
      setJobRoles(rolesData)
    } catch (err) {
      console.error('Failed to load job roles:', err)
    }
  }

  async function loadJobRoleSectionItems(jobRoleId: string) {
    try {
      const sectionItems = await getJobRoleSectionItems(jobRoleId)

      setFormData((prev) => ({
        ...prev,
        sections: mapJobRoleSectionItemsToSections(sectionItems),
      }))
    } catch (err) {
      console.error('Failed to load job role section items:', err)
    }
  }

  const handleInputChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOrganizationChange = (organizationId: string) => {
    setFormData((prev) => ({
      ...prev,
      organization_id: organizationId,
      job_role_id: prev.organization_id === organizationId ? prev.job_role_id : '',
    }))
  }

  const handleJobRoleChange = (jobRoleId: string) => {
    setFormData((prev) => ({
      ...prev,
      job_role_id: jobRoleId,
    }))

    if (!jobRoleId) {
      setPendingJobRoleId(null)
      setSectionPrefillDialogOpen(false)
      return
    }

    if (hasSectionContent(formData.sections)) {
      setPendingJobRoleId(jobRoleId)
      setSectionPrefillDialogOpen(true)
      return
    }

    void loadJobRoleSectionItems(jobRoleId)
  }

  const handleSectionPrefillConfirm = () => {
    if (pendingJobRoleId) {
      void loadJobRoleSectionItems(pendingJobRoleId)
    }
    setSectionPrefillDialogOpen(false)
    setPendingJobRoleId(null)
  }

  const handleSectionPrefillDismiss = () => {
    setSectionPrefillDialogOpen(false)
    setPendingJobRoleId(null)
  }

  const handleSectionChange = (section: keyof JobFormData['sections'], index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: prev.sections[section].map((item, i) => i === index ? value : item)
      }
    }))
  }

  const addSectionItem = (section: keyof JobFormData['sections']) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: [...prev.sections[section], '']
      }
    }))
  }

  const insertSectionItem = (section: keyof JobFormData['sections'], index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: [
          ...prev.sections[section].slice(0, index),
          '',
          ...prev.sections[section].slice(index)
        ]
      }
    }))
  }

  const removeSectionItem = (section: keyof JobFormData['sections'], index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: prev.sections[section].length > 1
          ? prev.sections[section].filter((_, i) => i !== index)
          : ['']
      }
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.title.trim()) errors.push('Název pozice je povinný')
    if (!formData.organization_id) errors.push('Nemocnice je povinná')
    if (formData.contract_type_codes.length === 0) errors.push('Typ úvazku je povinný')

    if (formData.salary_min && formData.salary_max) {
      const min = parseInt(formData.salary_min)
      const max = parseInt(formData.salary_max)
      if (min >= max) errors.push('Minimální plat musí být nižší než maximální')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    setLoading(true)
    setError(null)
    setAuthorizedPeopleError(null)

    try {
      const { contract_type_codes, ...restFormData } = formData
      const submitData = {
        ...restFormData,
        contract_type_code: contract_type_codes,
        status: publishNow ? 'active' as const : formData.status,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
        // Convert empty strings to undefined for UUID fields
        job_role_id: formData.job_role_id || undefined,
        publish_date: formData.publish_date || undefined,
        expire_date: formData.expire_date || undefined,
        sections: {
          duties: formData.sections.duties.filter(item => item.trim()),
          requirements: formData.sections.requirements.filter(item => item.trim()),
          benefits: formData.sections.benefits.filter(item => item.trim())
        }
      }

      await updateJob(id as string, submitData)

      const syncResult = await syncAuthorizedPeopleForJob(
        id as string,
        authorizedPeople,
        'Změny nabídky byly uloženy, ale nepodařilo se uložit oprávněné osoby.'
      )
      setAuthorizedPeople(syncResult.authorizedPeople)

      if (syncResult.error) {
        setAuthorizedPeopleError(syncResult.error)
        setError('Změny nabídky byly uloženy, ale nepodařilo se uložit oprávněné osoby.')
        return
      }

      router.push('/admin/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při aktualizaci nabídky práce')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionRefine = (section: keyof JobFormData['sections'], refined: string) => {
    const items = refined.split('\n').map(s => s.trim()).filter(Boolean)
    if (items.length > 0) {
      setFormData(prev => ({
        ...prev,
        sections: {
          ...prev.sections,
          [section]: items,
        },
      }))
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/jobs">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upravit nabídku práce</h1>
          <p className="text-muted-foreground">Upravte stávající pracovní nabídku</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <SectionPrefillDialog
        open={sectionPrefillDialogOpen}
        mode={sectionPrefillMode}
        onConfirm={handleSectionPrefillConfirm}
        onCancel={handleSectionPrefillDismiss}
        onOpenChange={(open) => {
          setSectionPrefillDialogOpen(open)
          if (!open) {
            setPendingJobRoleId(null)
          }
        }}
      />

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Základní informace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Název pozice *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Zdravotní sestra - JIP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Pracoviště</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Jednotka intenzivní péče"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Popis pozice</Label>
                {canUseAiAssistant && (
                  <RefineButton
                    text={formData.description}
                    fieldType="description"
                    jobTitle={formData.title}
                    onRefine={(t) => handleInputChange('description', t)}
                  />
                )}
              </div>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => handleInputChange('description', html)}
                placeholder="Detailní popis pozice a požadavků..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Nemocnice *</Label>
                <Select
                  value={formData.organization_id}
                  onValueChange={handleOrganizationChange}
                >
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Vyberte nemocnici" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_role">Specializace</Label>
                <Select
                  value={formData.job_role_id}
                  onValueChange={handleJobRoleChange}
                  disabled={!formData.organization_id}
                >
                  <SelectTrigger id="job_role">
                    <SelectValue placeholder="Vyberte specializaci" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ úvazku *</Label>
                <div className="flex flex-wrap gap-3 pt-1">
                  {contractTypes.map((type) => (
                    <div key={type.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ct-${type.code}`}
                        checked={formData.contract_type_codes.includes(type.code)}
                        onCheckedChange={(checked) => {
                          const codes = checked
                            ? [...formData.contract_type_codes, type.code]
                            : formData.contract_type_codes.filter(c => c !== type.code)
                          setFormData(prev => ({ ...prev, contract_type_codes: codes }))
                        }}
                      />
                      <Label htmlFor={`ct-${type.code}`} className="font-normal cursor-pointer">
                        {type.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cv_required">Životopis povinný</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="cv_required"
                    checked={formData.cv_required}
                    onCheckedChange={(checked) => handleInputChange('cv_required', checked)}
                  />
                  <Label htmlFor="cv_required" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.cv_required ? 'Ano' : 'Ne'}
                  </Label>
                </div>
              </div>

                {/* Také zatím nechtějí */}
              {/* <div className="space-y-2">
                <Label htmlFor="is_department_accredited">Akreditované oddělení</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="is_department_accredited"
                    checked={formData.is_department_accredited}
                    onCheckedChange={(checked) => handleInputChange('is_department_accredited', checked)}
                  />
                  <Label htmlFor="is_department_accredited" className="text-sm text-muted-foreground cursor-pointer">
                    {formData.is_department_accredited ? 'Ano' : 'Ne'}
                  </Label>
                </div>
              </div> */}
            </div>

            {/* Zatím zakomentováno nechtějí */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_min">Minimální plat (Kč)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => handleInputChange('salary_min', e.target.value)}
                  placeholder="30000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_max">Maximální plat (Kč)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => handleInputChange('salary_max', e.target.value)}
                  placeholder="45000"
                />
              </div>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publish_date">Datum zveřejnění</Label>
                <div className="relative">
                  <Input
                    id="publish_date"
                    type={formData.publish_date ? "date" : "text"}
                    value={formData.publish_date}
                    onChange={(e) => handleInputChange('publish_date', e.target.value)}
                    onFocus={(e) => e.target.type = "date"}
                    placeholder="Vyberte datum"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expire_date">Datum ukončení</Label>
                <div className="relative">
                  <Input
                    id="expire_date"
                    type={formData.expire_date ? "date" : "text"}
                    value={formData.expire_date}
                    onChange={(e) => handleInputChange('expire_date', e.target.value)}
                    onFocus={(e) => e.target.type = "date"}
                    placeholder="Vyberte datum"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Kontaktní email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="kariera@kzcr.eu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Kontaktní telefon</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+420 477 111 111"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <AuthorizedPeopleSection
          value={authorizedPeople}
          onChange={setAuthorizedPeople}
          saveError={authorizedPeopleError}
        />

        <JobSectionsEditor
          sections={formData.sections}
          jobTitle={formData.title}
          canUseAiAssistant={canUseAiAssistant}
          onSectionChange={handleSectionChange}
          onAddSectionItem={addSectionItem}
          onInsertSectionItem={insertSectionItem}
          onRemoveSectionItem={removeSectionItem}
          onSectionRefine={handleSectionRefine}
        />

        <div className="flex gap-4 justify-end">
          <Link href="/admin/jobs">
            <Button type="button" variant="outline">
              Zrušit
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ukládání...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Uložit změny
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publikování...
              </>
            ) : (
              'Publikovat'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
