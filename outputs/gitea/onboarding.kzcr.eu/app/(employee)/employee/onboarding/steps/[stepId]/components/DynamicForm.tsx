"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, FileText, Clock } from "lucide-react"
import type { StepForm, StepFormField, FieldValue } from "@/lib/types/onboarding-steps"

interface DynamicFormProps {
  form: StepForm
  userStep: any
  formValues: Record<string, FieldValue>
  onFormChange: (values: Record<string, FieldValue>) => void
  onSubmit: (answers: Record<string, any>) => Promise<void>
}

export default function DynamicForm({ 
  form, 
  userStep, 
  formValues, 
  onFormChange, 
  onSubmit 
}: DynamicFormProps) {
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Check if there are unsaved changes
    const currentAnswers = { ...userStep.form_response }
    delete currentAnswers.docReads // Remove docReads from comparison
    
    const hasChanges = JSON.stringify(formValues) !== JSON.stringify(currentAnswers)
    setHasChanges(hasChanges)
  }, [formValues, userStep.form_response])

  const handleFieldChange = (fieldId: string, value: FieldValue) => {
    const newValues = { ...formValues, [fieldId]: value }
    onFormChange(newValues)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      await onSubmit(formValues)
      setHasChanges(false)
    } catch (err) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: StepFormField) => {
    const value = formValues[field.id] || ''
    const fieldId = `field-${field.id}`

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="flex items-center gap-2">
              {field.label}
              {field.is_required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
            </Label>
            <Input
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.is_required}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={fieldId} className="flex items-center gap-2">
              {field.label}
              {field.is_required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
            </Label>
            <Textarea
              id={fieldId}
              value={value as string}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.is_required}
              rows={4}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.is_required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
            </Label>
            <Select
              value={value as string}
              onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.is_required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
            </Label>
            <RadioGroup
              value={value as string}
              onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                  <Label htmlFor={`${fieldId}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'checkbox':
        if (field.options && field.options.length > 0) {
          // Multi-select checkbox
          const selectedValues = (value as string[]) || []
          
          return (
            <div key={field.id} className="space-y-2">
              <Label className="flex items-center gap-2">
                {field.label}
                {field.is_required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
              </Label>
              <div className="space-y-2">
                {field.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldId}-${option}`}
                      checked={selectedValues.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFieldChange(field.id, [...selectedValues, option])
                        } else {
                          handleFieldChange(field.id, selectedValues.filter(v => v !== option))
                        }
                      }}
                    />
                    <Label htmlFor={`${fieldId}-${option}`}>{option}</Label>
                  </div>
                ))}
              </div>
            </div>
          )
        } else {
          // Single boolean checkbox
          return (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={fieldId}
                  checked={value as boolean}
                  onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
                />
                <Label htmlFor={fieldId} className="flex items-center gap-2">
                  {field.label}
                  {field.is_required && <Badge variant="outline" className="text-xs text-red-600">Required</Badge>}
                </Label>
              </div>
            </div>
          )
        }

      default:
        return null
    }
  }

  if (!form || !form.fields || form.fields.length === 0) {
    return null
  }

  const sortedFields = [...form.fields].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {form.title || 'Form'}
        </CardTitle>
        {form.description && (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {sortedFields.map(renderField)}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Saving...' : 'Save Form'}
            </Button>
            
            {hasChanges && (
              <Badge variant="outline" className="self-center">
                Unsaved changes
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}