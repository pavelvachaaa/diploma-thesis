"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefineButton } from "@/components/admin/ai-job-chat/RefineButton"
import { JobFormData } from "@/lib/api/jobs"
import SectionAutocompleteInput from "./SectionAutocompleteInput"

type JobSectionKey = keyof JobFormData["sections"]

interface JobSectionsEditorProps {
  sections: JobFormData["sections"]
  jobTitle: string
  canUseAiAssistant: boolean
  onSectionChange: (section: JobSectionKey, index: number, value: string) => void
  onAddSectionItem: (section: JobSectionKey) => void
  onInsertSectionItem: (section: JobSectionKey, index: number) => void
  onRemoveSectionItem: (section: JobSectionKey, index: number) => void
  onSectionRefine: (section: JobSectionKey, refined: string) => void
}

const SECTION_CONFIG: Array<{
  section: JobSectionKey
  title: string
  placeholder: string
  fieldType: "duty" | "requirement" | "benefit"
}> = [
  {
    section: "duties",
    title: "Náplň práce",
    placeholder: "Poskytování odborné péče pacientům",
    fieldType: "duty",
  },
  {
    section: "requirements",
    title: "Požadavky",
    placeholder: "Odpovídající vzdělání a praxe",
    fieldType: "requirement",
  },
  {
    section: "benefits",
    title: "Nabízíme",
    placeholder: "Odpovídající mzdové ohodnocení",
    fieldType: "benefit",
  },
]

export default function JobSectionsEditor({
  sections,
  jobTitle,
  canUseAiAssistant,
  onSectionChange,
  onAddSectionItem,
  onInsertSectionItem,
  onRemoveSectionItem,
  onSectionRefine,
}: JobSectionsEditorProps) {
  const [pendingFocus, setPendingFocus] = useState<{
    section: JobSectionKey
    index: number
  } | null>(null)

  const handleCommitByEnter = (section: JobSectionKey, index: number) => {
    setPendingFocus({
      section,
      index: index + 1,
    })
    onInsertSectionItem(section, index + 1)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {SECTION_CONFIG.map(({ section, title, placeholder, fieldType }) => (
        <Card key={section}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            {canUseAiAssistant && (
              <RefineButton
                text={sections[section].filter((item) => item.trim()).join("\n")}
                fieldType={fieldType}
                jobTitle={jobTitle}
                onRefine={(refined) => onSectionRefine(section, refined)}
              />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {sections[section].map((item, index) => (
              <div key={index} className="flex gap-2">
                <SectionAutocompleteInput
                  section={section}
                  value={item}
                  placeholder={placeholder}
                  onChange={(value) => onSectionChange(section, index, value)}
                  shouldAutoFocus={pendingFocus?.section === section && pendingFocus.index === index}
                  onAutoFocusHandled={() => setPendingFocus(null)}
                  onCommitByEnter={() => handleCommitByEnter(section, index)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveSectionItem(section, index)}
                  aria-label="Smazat položku"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddSectionItem(section)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Přidat položku
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
