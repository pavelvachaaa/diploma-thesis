"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, AlertCircle, FileText } from "lucide-react"
import { api } from "@/lib/api"

// Import with simpler path or define locally
// import DynamicFormRenderer from "../../../../../../(employee)/employee/onboarding/steps/[stepId]/components/DynamicFormRenderer"

// Define types locally to avoid import issues
interface FormField {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{value: string; label: string}>;
}

interface OnboardingForm {
  id: string;
  schemaVersion: number;
  title?: string;
  description?: string;
  fields: FormField[];
  ui?: {
    layout?: 'one_column' | 'two_column';
    groups?: Array<{title: string; fieldIds: string[]}>;
  };
}

interface FormResponse {
  [fieldId: string]: any;
}

interface StepInfo {
  id: string
  title: string
  description: string
  step_type: string
  form_status: string
}

export default function FormPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const stepId = params.stepId as string

  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null)
  const [form, setForm] = useState<OnboardingForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStepForm()
  }, [stepId])

  const fetchStepForm = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await api(`/admin/onboarding/steps/${stepId}/form`)
      setForm(data)
      
      // Also fetch basic step info for context
      fetchStepInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const fetchStepInfo = async () => {
    try {
      const data = await api(`/admin/onboarding/steps/forms`)
      const step = data.steps?.find((s: any) => s.id === stepId)
      if (step) {
        setStepInfo({
          id: step.id,
          title: step.title,
          description: step.description,
          step_type: step.step_type,
          form_status: step.form_status
        })
      }
    } catch (err) {
      console.warn('Failed to load step info:', err)
    }
  }

  const handlePreviewSubmit = async (response: FormResponse) => {
    // This is just a preview - we don't actually submit anything
    console.log('Preview form submission:', response)
    alert('Toto je pouze náhled - formulář nebyl skutečně odeslán.')
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Náhled formuláře: {stepInfo?.title || `Krok ${stepId}`}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{stepInfo?.step_type?.toUpperCase()}</Badge>
            <Badge variant={stepInfo?.form_status === 'published' ? 'default' : 'secondary'}>
              {stepInfo?.form_status === 'published' ? 'Publikován' : 'Koncept'}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/forms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na seznam
          </Button>
          <Button onClick={() => router.push(`/admin/forms/${stepId}/edit`)}>
            Upravit formulář
          </Button>
        </div>
      </div>

      {/* Context Info */}
      {stepInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontext kroku</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Název:</span> {stepInfo.title}
              </div>
              {stepInfo.description && (
                <div>
                  <span className="font-medium">Popis:</span> {stepInfo.description}
                </div>
              )}
              <div>
                <span className="font-medium">Typ kroku:</span> {stepInfo.step_type.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={stepInfo.form_status === 'published' ? 'default' : 'secondary'}>
                  {stepInfo.form_status === 'published' ? 'Publikován' : 'Koncept'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Notice */}
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          Toto je náhled formuláře. Všechny akce jsou pouze simulované a nebudou uloženy.
        </AlertDescription>
      </Alert>

      {/* Form Preview */}
      {form ? (
        <>
          {form.fields && form.fields.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{form.title || 'Formulář'}</CardTitle>
                {form.description && (
                  <p className="text-muted-foreground">{form.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className={`space-y-4 ${form.ui?.layout === 'two_column' ? 'grid grid-cols-2 gap-4' : ''}`}>
                  {form.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <Input placeholder={field.placeholder} disabled />
                      )}
                      {field.type === 'number' && (
                        <Input type="number" placeholder={field.placeholder} disabled />
                      )}
                      {field.type === 'date' && (
                        <Input type="date" disabled />
                      )}
                      {field.type === 'select' && (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Vyberte..."} />
                          </SelectTrigger>
                        </Select>
                      )}
                      {field.type === 'checkbox' && (
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" disabled />
                          <label className="text-sm">{field.label}</label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <Button disabled>
                    Uložit formulář (Náhled)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Formulář je prázdný</h3>
                <p className="text-muted-foreground mb-4">
                  Tento formulář neobsahuje žádná pole k zobrazení.
                </p>
                <Button onClick={() => router.push(`/admin/forms/${stepId}/edit`)}>
                  Upravit formulář
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Formulář nenalezen</h3>
            <p className="text-muted-foreground mb-4">
              Pro tento krok nebyl nalezen žádný formulář.
            </p>
            <Button onClick={() => router.push(`/admin/forms/${stepId}/edit`)}>
              Vytvořit formulář
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Information */}
      {form && form.fields && form.fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Informace o formuláři</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Celkem polí:</span>
                <div className="text-lg font-bold">{form.fields.length}</div>
              </div>
              <div>
                <span className="font-medium">Povinná pole:</span>
                <div className="text-lg font-bold">{form.fields.filter(f => f.required).length}</div>
              </div>
              <div>
                <span className="font-medium">Rozložení:</span>
                <div className="text-lg font-bold">
                  {form.ui?.layout === 'two_column' ? '2 sloupce' : '1 sloupec'}
                </div>
              </div>
              <div>
                <span className="font-medium">Verze schématu:</span>
                <div className="text-lg font-bold">{form.schemaVersion}</div>
              </div>
            </div>
            
            {form.fields.length > 0 && (
              <div className="mt-4">
                <span className="font-medium">Typy polí:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.from(new Set(form.fields.map(f => f.type))).map(type => (
                    <Badge key={type} variant="outline" className="capitalize">
                      {type} ({form.fields.filter(f => f.type === type).length})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}