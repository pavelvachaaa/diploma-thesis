"use client"

import React, { useState, useEffect, use } from "react"
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import Link from "next/link"
import { getJobRoleById, JobRole } from "@/lib/api/job-roles"
import {
    getAllSectionTypes,
    getSectionItemsBySectionType,
    getJobRoleSectionItems,
    replaceJobRoleSectionItems,
    SectionType,
    SectionItem,
    JobRoleSectionItem
} from "@/lib/api/section-items"
import toast from "react-hot-toast"

interface SectionItemSelection {
    section_item_id?: string
    custom_text?: string
    item_text?: string
    is_from_catalog: boolean
}

export default function JobRoleSpecificationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [jobRole, setJobRole] = useState<JobRole | null>(null)
    const [sectionTypes, setSectionTypes] = useState<SectionType[]>([])
    const [catalogItems, setCatalogItems] = useState<Record<string, SectionItem[]>>({})
    const [assignedItems, setAssignedItems] = useState<Record<string, SectionItemSelection[]>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedSectionType, setSelectedSectionType] = useState<string | null>(null)
    const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<string>>(new Set())
    const [customText, setCustomText] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [originalAssignedItems, setOriginalAssignedItems] = useState<Record<string, SectionItemSelection[]>>({})

    useEffect(() => {
        fetchData()
    }, [id])

    // Warn user about unsaved changes when leaving page
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                return (e.returnValue = '')
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [jobRoleData, types, assignedData] = await Promise.all([
                getJobRoleById(id),
                getAllSectionTypes(),
                getJobRoleSectionItems(id)
            ])

            setJobRole(jobRoleData)
            setSectionTypes(types)

            // Load catalog items for all section types
            const catalogPromises = types.map(type =>
                getSectionItemsBySectionType(type.name, true)
            )
            const catalogResults = await Promise.all(catalogPromises)

            const catalogMap: Record<string, SectionItem[]> = {}
            types.forEach((type, index) => {
                catalogMap[type.name] = catalogResults[index]
            })
            setCatalogItems(catalogMap)

            // Group assigned items by section type
            const groupedAssigned: Record<string, SectionItemSelection[]> = {}
            types.forEach(type => {
                groupedAssigned[type.name] = []
            })

            assignedData.forEach((item: JobRoleSectionItem) => {
                if (!groupedAssigned[item.section_type_name]) {
                    groupedAssigned[item.section_type_name] = []
                }

                groupedAssigned[item.section_type_name].push({
                    section_item_id: item.section_item_id || undefined,
                    custom_text: item.custom_text || undefined,
                    item_text: item.item_text || item.custom_text || "",
                    is_from_catalog: !!item.section_item_id
                })
            })

            setAssignedItems(groupedAssigned)
            setOriginalAssignedItems(JSON.parse(JSON.stringify(groupedAssigned)))
            setHasUnsavedChanges(false)
        } catch (err) {
            console.error('Error fetching data:', err)
            setError(err instanceof Error ? err.message : "Chyba při načítání dat")
            toast.error("Chyba při načítání dat")
        } finally {
            setLoading(false)
        }
    }

    const openAddItemsDialog = (sectionType: string) => {
        setSelectedSectionType(sectionType)
        setSelectedCatalogItems(new Set())
        setCustomText("")
        setIsDialogOpen(true)
    }

    const handleToggleCatalogItem = (itemId: string) => {
        const newSelected = new Set(selectedCatalogItems)
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId)
        } else {
            newSelected.add(itemId)
        }
        setSelectedCatalogItems(newSelected)
    }

    const handleAddItems = async () => {
        if (!selectedSectionType) return

        const newItems: SectionItemSelection[] = []

        // Add selected catalog items
        selectedCatalogItems.forEach(itemId => {
            const catalogItem = catalogItems[selectedSectionType]?.find(item => item.id === itemId)
            if (catalogItem) {
                newItems.push({
                    section_item_id: itemId,
                    item_text: catalogItem.item_text,
                    is_from_catalog: true
                })
            }
        })

        // Add custom text if provided
        if (customText.trim()) {
            newItems.push({
                custom_text: customText.trim(),
                item_text: customText.trim(),
                is_from_catalog: false
            })
        }

        if (newItems.length === 0) {
            toast.error("Vyberte alespoň jednu položku nebo zadejte vlastní text")
            return
        }

        // Update assigned items
        setAssignedItems(prev => ({
            ...prev,
            [selectedSectionType]: [...(prev[selectedSectionType] || []), ...newItems]
        }))
        setHasUnsavedChanges(true)

        setIsDialogOpen(false)
        toast.success(`Přidáno ${newItems.length} položek`)
    }

    const handleRemoveItem = (sectionType: string, index: number) => {
        setAssignedItems(prev => ({
            ...prev,
            [sectionType]: prev[sectionType].filter((_, i) => i !== index)
        }))
        setHasUnsavedChanges(true)
    }

    const handleSaveChanges = async () => {
        if (!jobRole) return

        try {
            setIsSaving(true)

            // Save each section type separately
            for (const sectionType of sectionTypes) {
                const items = assignedItems[sectionType.name] || []
                await replaceJobRoleSectionItems(id, sectionType.name, items)
            }

            toast.success("Změny byly úspěšně uloženy")
            setHasUnsavedChanges(false)
            fetchData() // Reload data to get fresh state
        } catch (err) {
            console.error('Error saving changes:', err)
            toast.error("Chyba při ukládání změn")
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Načítání...</p>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    if (error || !jobRole) {
        return (
            <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
                <div className="container mx-auto py-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Chyba při načítání</h3>
                            <p className="text-red-600">{error || "Pracovní role nenalezena"}</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/job-roles">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Zpět
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{jobRole.name}</h1>
                            <p className="text-muted-foreground">Správa specifikací pozice</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/job-roles/${id}/documents`}>
                            <Button variant="outline">
                                <List className="mr-2 h-4 w-4" />
                                Dokumenty
                            </Button>
                        </Link>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={isSaving || !hasUnsavedChanges}
                            className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Ukládám...' : 'Uložit změny'}
                        </Button>
                    </div>
                </div>

                {/* Unsaved Changes Warning */}
                {hasUnsavedChanges && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-orange-800">Neuložené změny</h3>
                            <p className="text-orange-700 text-sm">Máte neuložené změny. Nezapomeňte je uložit tlačítkem "Uložit změny".</p>
                        </div>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Uložit nyní
                        </Button>
                    </div>
                )}

                {/* Section Types Cards */}
                <div className="grid gap-6">
                    {sectionTypes.map(sectionType => (
                        <Card key={sectionType.name}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{sectionType.description || sectionType.name}</CardTitle>
                                    </div>
                                    <Button
                                        onClick={() => openAddItemsDialog(sectionType.name)}
                                        size="sm"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Přidat položku
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {(!assignedItems[sectionType.name] || assignedItems[sectionType.name].length === 0) ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Žádné položky nebyly přiřazeny</p>
                                        <Button
                                            onClick={() => openAddItemsDialog(sectionType.name)}
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Přidat první položku
                                        </Button>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {assignedItems[sectionType.name].map((item, index) => (
                                            <li
                                                key={index}
                                                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm">{item.item_text}</p>
                                                    <div className="mt-1">
                                                        <Badge variant={item.is_from_catalog ? "default" : "secondary"} className="text-xs">
                                                            {item.is_from_catalog ? "Z katalogu" : "Vlastní text"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(sectionType.name, index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Items Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Přidat položky do sekce: {selectedSectionType}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Catalog Items */}
                            {selectedSectionType && catalogItems[selectedSectionType] && (
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Vybrat z katalogu</Label>
                                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                                        {catalogItems[selectedSectionType].length === 0 ? (
                                            <div className="p-4 text-center text-muted-foreground">
                                                Žádné položky v katalogu
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {catalogItems[selectedSectionType].map(item => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                                                        onClick={() => handleToggleCatalogItem(item.id)}
                                                    >
                                                        <Checkbox
                                                            checked={selectedCatalogItems.has(item.id)}
                                                            onCheckedChange={() => handleToggleCatalogItem(item.id)}
                                                        />
                                                        <span className="text-sm flex-1">{item.item_text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Custom Text */}
                            <div className="space-y-3">
                                <Label htmlFor="custom_text" className="text-base font-semibold">
                                    Nebo zadat vlastní text
                                </Label>
                                <Textarea
                                    id="custom_text"
                                    value={customText}
                                    onChange={(e) => setCustomText(e.target.value)}
                                    placeholder="Zadejte vlastní položku..."
                                    rows={3}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Zrušit
                                </Button>
                                <Button onClick={handleAddItems}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Přidat položky
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}
