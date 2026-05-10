"use client"

import { JobRoleSectionItem } from "@/lib/api/job-roles"
import { JobFormData } from "@/lib/api/jobs"

export type JobSections = JobFormData["sections"]
export type SectionPrefillMode = "merge" | "replace"

export const hasSectionContent = (sections: JobSections): boolean => {
  return Object.values(sections).some((items) => items.some((item) => item.trim()))
}

export const mapJobRoleSectionItemsToSections = (
  sectionItems: JobRoleSectionItem[]
): JobSections => {
  const duties: string[] = []
  const requirements: string[] = []
  const benefits: string[] = []

  sectionItems.forEach((item) => {
    const text = item.custom_text || item.item_text || ""
    if (!text) return

    switch (item.section_type_name) {
      case "duties":
        duties.push(text)
        break
      case "requirements":
        requirements.push(text)
        break
      case "benefits":
        benefits.push(text)
        break
    }
  })

  return {
    duties: duties.length > 0 ? duties : [""],
    requirements: requirements.length > 0 ? requirements : [""],
    benefits: benefits.length > 0 ? benefits : [""],
  }
}

export const mergeJobSections = (
  existingSections: JobSections,
  incomingSections: JobSections
): JobSections => {
  const append = (existing: string[], incoming: string[]) => {
    const cleanedExisting = existing.filter((item) => item.trim())
    const cleanedIncoming = incoming.filter((item) => item.trim())
    const mergedItems = [...cleanedExisting, ...cleanedIncoming]
    return mergedItems.length > 0 ? mergedItems : [""]
  }

  return {
    duties: append(existingSections.duties, incomingSections.duties),
    requirements: append(existingSections.requirements, incomingSections.requirements),
    benefits: append(existingSections.benefits, incomingSections.benefits),
  }
}
