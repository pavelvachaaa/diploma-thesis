"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Download, Eye, Filter, Plus, MoreVertical, Upload, Pencil, Trash2, Loader2 } from "lucide-react"
import { 
  getAllOnboardingDocumentsAdmin, 
  OnboardingDocument, 
  OnboardingDocumentsResponse, 
  createOnboardingDocument, 
  updateOnboardingDocument, 
  deleteOnboardingDocument,
  downloadDocumentFile
} from "@/lib/api/onboarding-documents"
import { getAllDocumentTypes, DocumentType } from "@/lib/api/document-types"
import { getAllOrganizations, Organization } from "@/lib/api/organizations"
import { getAllJobRoles, JobRole } from "@/lib/api/job-roles"
import { useDebounce } from "@/hooks/useDebounce"
import toast from "react-hot-toast"
import { FileUpload } from "@/components/ui/file-upload"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"

export default function OnboardingDocumentsPage() {
  const [documents, setDocuments] = useState<OnboardingDocument[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [pagination, setPagination] = useState<OnboardingDocumentsResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedFormat, setSelectedFormat] = useState("all")

  // Dialog states
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false)
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false)
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingDocument | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type_id: "none",
    organization_id: "",
    required: true,
    applies_to_all_organizations: false,
    selectedJobRoles: [] as string[]
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)


  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchQuery, 500)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [debouncedSearchTerm, activeTab, selectedCategory, selectedFormat])

  const loadInitialData = async () => {
    try {
      const [orgsResponse, typesData, rolesData] = await Promise.all([
        getAllOrganizations(),
        getAllDocumentTypes(),
        getAllJobRoles()
      ])
      setOrganizations(orgsResponse.data)
      setDocumentTypes(typesData)
      setJobRoles(rolesData)
    } catch (err) {
      console.error('Failed to load initial data:', err)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const query = {
        page: 0,
        limit: 100,
        q: debouncedSearchTerm || undefined,
        type: selectedCategory !== "all" ? selectedCategory : undefined,
        required: activeTab === "required" ? true : activeTab === "optional" ? false : undefined
      }
      
      const response = await getAllOnboardingDocumentsAdmin(query)
      setDocuments(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání dokumentů")
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-5 w-5 text-gray-500" />
    
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="h-5 w-5 text-green-500" />
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <FileText className="h-5 w-5 text-orange-500" />
    if (mimeType.includes('image')) return <FileText className="h-5 w-5 text-purple-500" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const getFileType = (mimeType?: string) => {
    if (!mimeType) return 'UNKNOWN'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word')) return 'DOC'
    if (mimeType.includes('document')) return 'DOCX'
    if (mimeType.includes('sheet')) return 'XLSX'
    if (mimeType.includes('excel')) return 'XLS'
    if (mimeType.includes('presentation')) return 'PPTX'
    if (mimeType.includes('powerpoint')) return 'PPT'
    if (mimeType.includes('jpeg')) return 'JPG'
    if (mimeType.includes('png')) return 'PNG'
    if (mimeType.includes('gif')) return 'GIF'
    return 'FILE'
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === "required" && !doc.required) return false
    if (activeTab === "optional" && doc.required) return false
    if (selectedFormat !== "all" && getFileType(doc.mime_type).toLowerCase() !== selectedFormat) return false
    return true
  })

  const handleFilesChange = (files: File[]) => {
    const file = files[0] || null
    setSelectedFile(file)
    if (file && !formData.name) {
      setFormData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }))
    }
  }

  const openCreateDialog = () => {
    // Auto-select organization if user only has access to one
    const autoSelectOrg = organizations.length === 1 ? organizations[0].id : ""
    console.log('[DEBUG] openCreateDialog - organizations:', organizations.length, 'autoSelectOrg:', autoSelectOrg)
    setFormData({
      name: "",
      description: "",
      type_id: "none",
      organization_id: autoSelectOrg,
      required: true,
      applies_to_all_organizations: false,
      selectedJobRoles: []
    })
    setSelectedFile(null)
    setIsAddTemplateOpen(true)
  }

  const openEditDialog = (document: OnboardingDocument) => {
    setFormData({
      name: document.name,
      description: document.description || "",
      type_id: document.type_id || "none",
      organization_id: document.organization_id || "",
      required: document.required,
      applies_to_all_organizations: document.applies_to_all_organizations || false,
      selectedJobRoles: []
    })
    setSelectedTemplate(document)
    setSelectedFile(null)
    setIsEditTemplateOpen(true)
  }

  const handleSubmit = async () => {
    console.log('[DEBUG] handleSubmit - formData:', formData)

    if (!formData.name.trim()) {
      toast.error("Název šablony je povinný")
      return
    }

    if (!formData.applies_to_all_organizations && !formData.organization_id) {
      toast.error("Vyberte organizaci nebo označte jako globální dokument")
      return
    }

    if (!selectedFile) {
      toast.error("Vyberte soubor k nahrání")
      return
    }

    try {
      setIsSubmitting(true)
      
      const submitFormData = new FormData()
      submitFormData.append('name', formData.name)
      submitFormData.append('description', formData.description)
      if (!formData.applies_to_all_organizations) {
        submitFormData.append('organization_id', formData.organization_id)
      }
      submitFormData.append('required', formData.required.toString())
      submitFormData.append('applies_to_all_organizations', formData.applies_to_all_organizations.toString())
      if (formData.type_id !== "none") {
        submitFormData.append('type_id', formData.type_id)
      }
      submitFormData.append('file', selectedFile)
      
      await createOnboardingDocument(submitFormData)
      toast.success("Šablona dokumentu byla úspěšně vytvořena")
      setIsAddTemplateOpen(false)
      fetchDocuments()
    } catch (err) {
      console.error('Failed to create document:', err)
      toast.error("Chyba při vytváření šablony dokumentu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedTemplate) return

    if (!formData.name.trim()) {
      toast.error("Název šablony je povinný")
      return
    }
    
    if (!formData.applies_to_all_organizations && !formData.organization_id) {
      toast.error("Vyberte organizaci nebo označte jako globální dokument")
      return
    }

    try {
      setIsSubmitting(true)
      
      const updateData = {
        name: formData.name,
        description: formData.description,
        type_id: formData.type_id !== "none" ? formData.type_id : undefined,
        organization_id: formData.applies_to_all_organizations ? undefined : formData.organization_id,
        required: formData.required,
        applies_to_all_organizations: formData.applies_to_all_organizations
      }
      
      await updateOnboardingDocument(selectedTemplate.id, updateData)
      toast.success("Šablona dokumentu byla úspěšně aktualizována")
      setIsEditTemplateOpen(false)
      fetchDocuments()
    } catch (err) {
      console.error('Failed to update document:', err)
      toast.error("Chyba při aktualizaci šablony dokumentu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewTemplate = (document: OnboardingDocument) => {
    setSelectedTemplate(document)
    setIsViewTemplateOpen(true)
  }

  const handleDownload = async (document: OnboardingDocument) => {
    if (!document.file_name) {
      toast.error('Soubor není k dispozici')
      return
    }
    
    try {
      await downloadDocumentFile(document.id, document.file_name)
    } catch (err) {
      console.error('Failed to download file:', err)
      toast.error('Chyba při stahování souboru')
    }
  }

  const handleDelete = async (document: OnboardingDocument) => {
    if (!confirm(`Opravdu chcete smazat šablonu "${document.name}"? Tato akce je nevratná.`)) {
      return
    }

    try {
      await deleteOnboardingDocument(document.id)
      toast.success(`Šablona "${document.name}" byla úspěšně smazána`)
      fetchDocuments()
    } catch (err) {
      console.error('Failed to delete document:', err)
      toast.error('Chyba při mazání šablony dokumentu')
    }
  }

  return (
    <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Správa šablon dokumentů</h1>
          <p className="text-muted-foreground">Spravujte šablony dokumentů pro různé typy pracovních pozic</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Šablony dokumentů</h2>
          <p className="text-muted-foreground mb-4">Vytvářejte a spravujte šablony pro onboarding zaměstnanců</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">Všechny šablony</TabsTrigger>
                <TabsTrigger value="required">Povinné</TabsTrigger>
                <TabsTrigger value="optional">Volitelné</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-auto">
              <Input
                placeholder="Vyhledat šablonu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[300px]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrovat</span>
            </Button>

            <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Přidat šablonu
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Přidat novou šablonu dokumentu</DialogTitle>
                  <DialogDescription>
                    Nahrajte novou šablonu dokumentu a přiřaďte ji k organizaci. Šablona bude k dispozici pro onboarding.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="templateName" className="text-sm font-medium">
                      Název šablony
                    </label>
                    <Input 
                      id="templateName" 
                      placeholder="Např. Pracovní smlouva - Lékař"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organizace</label>
                    {/* Only show "apply to all" option for super admins (multiple orgs) */}
                    {organizations.length > 1 && (
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="applyToAll"
                          checked={formData.applies_to_all_organizations}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({
                              ...prev,
                              applies_to_all_organizations: checked as boolean,
                              organization_id: checked ? "" : prev.organization_id
                            }))
                          }
                        />
                        <label htmlFor="applyToAll" className="text-sm">
                          Aplikovat na všechny organizace
                        </label>
                      </div>
                    )}

                    {!formData.applies_to_all_organizations && organizations.length > 1 && (
                      <div>
                        <label htmlFor="organization" className="text-sm font-medium">
                          Organizace *
                        </label>
                        <Select
                          value={formData.organization_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                        >
                          <SelectTrigger id="organization">
                            <SelectValue placeholder="Vyberte organizaci" />
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
                    )}

                    {/* Show organization name when user only has one org */}
                    {organizations.length === 1 && (
                      <p className="text-sm text-muted-foreground">
                        {organizations[0].name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Kategorie
                    </label>
                    <Select 
                      value={formData.type_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type_id: value }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Vyberte kategorii" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Žádná kategorie</SelectItem>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Popis (volitelné)</label>
                    <Textarea 
                      placeholder="Stručný popis šablony dokumentu"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Povinný dokument</label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="required" 
                        checked={formData.required}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, required: checked as boolean }))
                        }
                      />
                      <label htmlFor="required" className="text-sm">
                        Tento dokument je povinný pro vybrané pozice
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nahrát soubor *</label>
                    <FileUpload 
                      onFilesChange={handleFilesChange}
                      multiple={false}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddTemplateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Zrušit
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ukládám...
                      </>
                    ) : (
                      'Vytvořit šablonu'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Template Dialog */}
            <Dialog open={isEditTemplateOpen} onOpenChange={setIsEditTemplateOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Upravit šablonu dokumentu</DialogTitle>
                  <DialogDescription>
                    Upravte detaily šablony dokumentu. Soubor nelze změnit - pro změnu souboru smažte šablonu a vytvořte novou.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="editTemplateName" className="text-sm font-medium">
                      Název šablony
                    </label>
                    <Input 
                      id="editTemplateName" 
                      placeholder="Např. Pracovní smlouva - Lékař"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organizace</label>
                    {/* Only show "apply to all" option for super admins (multiple orgs) */}
                    {organizations.length > 1 && (
                      <div className="flex items-center space-x-2 mb-4">
                        <Checkbox
                          id="editApplyToAll"
                          checked={formData.applies_to_all_organizations}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({
                              ...prev,
                              applies_to_all_organizations: checked as boolean,
                              organization_id: checked ? "" : prev.organization_id
                            }))
                          }
                        />
                        <label htmlFor="editApplyToAll" className="text-sm">
                          Aplikovat na všechny organizace
                        </label>
                      </div>
                    )}

                    {!formData.applies_to_all_organizations && organizations.length > 1 && (
                      <div>
                        <label htmlFor="editOrganization" className="text-sm font-medium">
                          Organizace *
                        </label>
                        <Select
                          value={formData.organization_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                        >
                          <SelectTrigger id="editOrganization">
                            <SelectValue placeholder="Vyberte organizaci" />
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
                    )}

                    {/* Show organization name when user only has one org */}
                    {organizations.length === 1 && (
                      <p className="text-sm text-muted-foreground">
                        {organizations[0].name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="editCategory" className="text-sm font-medium">
                      Kategorie
                    </label>
                    <Select 
                      value={formData.type_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type_id: value }))}
                    >
                      <SelectTrigger id="editCategory">
                        <SelectValue placeholder="Vyberte kategorii" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Žádná kategorie</SelectItem>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Popis (volitelné)</label>
                    <Textarea 
                      placeholder="Stručný popis šablony dokumentu"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Povinný dokument</label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="editRequired" 
                        checked={formData.required}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, required: checked as boolean }))
                        }
                      />
                      <label htmlFor="editRequired" className="text-sm">
                        Tento dokument je povinný pro vybrané pozice
                      </label>
                    </div>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Aktuální soubor</label>
                      <div className="border rounded-md p-3 bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getDocumentTypeIcon(selectedTemplate.mime_type)}
                          <div>
                            <p className="text-sm font-medium">{selectedTemplate.file_name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(selectedTemplate.file_size)}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Pro změnu souboru smažte tuto šablonu a vytvořte novou.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditTemplateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Zrušit
                  </Button>
                  <Button 
                    onClick={handleEditSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ukládám...
                      </>
                    ) : (
                      'Uložit změny'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Všechny kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny kategorie</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Všechny formáty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny formáty</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="pptx">PPTX</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Načítání šablon...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" onClick={fetchDocuments} className="mt-2">
                Zkusit znovu
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Žádné šablony nenalezeny</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || activeTab !== "all" ? 
                      'Žádné šablony nevyhovují zadaným filtrům.' : 
                      'V systému zatím nejsou žádné šablony dokumentů.'
                    }
                  </p>
                </div>
              ) : (
                filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getDocumentTypeIcon(document.mime_type)}
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{document.type_name || 'Bez kategorie'}</span>
                          <span>•</span>
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>•</span>
                          <span>Aktualizováno: {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString('cs-CZ') : 'N/A'}</span>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">Organizace: {document.organization_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 mr-4">
                        {document.required && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            Povinné
                          </Badge>
                        )}
                        {document.status === 'active' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Aktivní
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleViewTemplate(document)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Náhled</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(document)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Stáhnout</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Další akce</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(document)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Upravit šablonu</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(document)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Smazat šablonu</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Dialog open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
          {selectedTemplate && (
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Náhled šablony dokumentu</DialogTitle>
                <DialogDescription>Prohlédněte si detaily šablony dokumentu a její náhled.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3">
                  {getDocumentTypeIcon(selectedTemplate.mime_type)}
                  <div>
                    <h3 className="font-medium">{selectedTemplate.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{selectedTemplate.type_name || 'Bez kategorie'}</span>
                      <span>•</span>
                      <span>{formatFileSize(selectedTemplate.file_size)}</span>
                      <span>•</span>
                      <span>Aktualizováno: {selectedTemplate.uploaded_at ? new Date(selectedTemplate.uploaded_at).toLocaleDateString('cs-CZ') : 'N/A'}</span>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">Organizace: {selectedTemplate.organization_name}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4 flex flex-col items-center justify-center h-[400px] bg-gray-50">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-blue-500" />
                    <h3 className="mt-4 font-medium">Náhled dokumentu</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Pro zobrazení obsahu dokumentu si jej stáhněte nebo otevřete v textovém editoru.
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(selectedTemplate)}>
                        <Download className="mr-2 h-4 w-4" />
                        Stáhnout
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Pencil className="mr-2 h-4 w-4" />
                        Upravit šablonu
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewTemplateOpen(false)}>
                  Zavřít
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
