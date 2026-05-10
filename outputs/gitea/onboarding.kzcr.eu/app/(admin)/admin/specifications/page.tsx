"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/hr-admin-ui"
import { PlusCircle, Search, Edit, Trash2, Filter, Loader2, Download } from "lucide-react"
import {
    getAllSectionTypes,
    getAllSectionItems,
    createSectionItem,
    updateSectionItem,
    deleteSectionItem,
    SectionType,
    SectionItem,
    SectionItemsResponse
} from "@/lib/api/section-items"
import { useDebounce } from "@/hooks/useDebounce"
import toast from "react-hot-toast"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import { Switch } from "@/components/ui/switch"

export default function SpecificationAdminPage() {
    const [sectionTypes, setSectionTypes] = useState<SectionType[]>([])
    const [sectionItems, setSectionItems] = useState<SectionItem[]>([])
    const [pagination, setPagination] = useState<SectionItemsResponse['pagination'] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedSectionType, setSelectedSectionType] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<SectionItem | null>(null)
    const [formData, setFormData] = useState({
        section_type_name: "",
        item_text: "",
        is_active: true,
        order_index: 0
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingItem, setDeletingItem] = useState<string | null>(null)

    // Debounce search term to avoid excessive API calls
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    useEffect(() => {
        loadSectionTypes()
    }, [])

    useEffect(() => {
        fetchSectionItems()
    }, [currentPage, pageSize, debouncedSearchTerm, selectedSectionType])

    const loadSectionTypes = async () => {
        try {
            const types = await getAllSectionTypes()
            setSectionTypes(types)
        } catch (err) {
            console.error('Failed to load section types:', err)
            toast.error('Chyba při načítání typů sekcí')
        }
    }

    const fetchSectionItems = async () => {
        try {
            setLoading(true)
            setError(null)

            const query = {
                page: currentPage - 1, // Convert to 0-based for backend
                limit: pageSize,
                q: debouncedSearchTerm || undefined,
                sectionType: selectedSectionType !== "all" ? selectedSectionType : undefined,
                activeOnly: false
            }

            const response = await getAllSectionItems(query)
            setSectionItems(response.data)
            setPagination({
                ...response.pagination,
                page: response.pagination.page + 1 // Convert back to 1-based for UI
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Chyba při načítání položek specifikací")
            console.error('Error fetching section items:', err)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize)
        setCurrentPage(1)
    }

    const handleFilterChange = () => {
        setCurrentPage(1)
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleFilterChange()
    }

    const handleSectionTypeChange = (value: string) => {
        setSelectedSectionType(value)
        handleFilterChange()
    }

    const openCreateDialog = () => {
        setEditingItem(null)
        setFormData({
            section_type_name: sectionTypes[0]?.name || "",
            item_text: "",
            is_active: true,
            order_index: 0
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (item: SectionItem) => {
        setEditingItem(item)
        setFormData({
            section_type_name: item.section_type_name,
            item_text: item.item_text,
            is_active: item.is_active,
            order_index: item.order_index
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.item_text.trim() || !formData.section_type_name) {
            toast.error("Text položky a typ sekce jsou povinné")
            return
        }

        try {
            setIsSubmitting(true)

            if (editingItem) {
                await updateSectionItem(editingItem.id, formData)
                toast.success("Položka byla úspěšně aktualizována")
            } else {
                await createSectionItem(formData)
                toast.success("Položka byla úspěšně vytvořena")
            }

            setIsDialogOpen(false)
            fetchSectionItems()
        } catch (err) {
            console.error('Failed to save section item:', err)
            toast.error("Chyba při ukládání položky")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (item: SectionItem) => {
        if (!confirm(`Opravdu chcete smazat položku "${item.item_text}"? Tato akce je nevratná.`)) {
            return
        }

        try {
            setDeletingItem(item.id)
            await deleteSectionItem(item.id)
            toast.success(`Položka byla úspěšně smazána`)
            fetchSectionItems()
        } catch (err) {
            console.error('Failed to delete section item:', err)
            toast.error('Chyba při mazání položky. Zkuste to prosím znovu.')
        } finally {
            setDeletingItem(null)
        }
    }

    const renderSectionItemsTable = () => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Typ sekce</TableHead>
                        <TableHead>Text položky</TableHead>
                        <TableHead>Pořadí</TableHead>
                        <TableHead>Aktivní</TableHead>
                        <TableHead className="text-right">Akce</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                <p className="mt-2 text-muted-foreground">Načítání položek specifikací...</p>
                            </TableCell>
                        </TableRow>
                    ) : error ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                <p className="text-red-600">{error}</p>
                                <Button variant="outline" onClick={fetchSectionItems} className="mt-2">
                                    Zkusit znovu
                                </Button>
                            </TableCell>
                        </TableRow>
                    ) : sectionItems.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                                <p className="text-muted-foreground">Žádné položky nenalezeny</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        sectionItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.section_type_description || item.section_type_name}</TableCell>
                                <TableCell className="max-w-md">
                                    <div className="truncate" title={item.item_text}>
                                        {item.item_text}
                                    </div>
                                </TableCell>
                                <TableCell>{item.order_index}</TableCell>
                                <TableCell>
                                    {item.is_active ? (
                                        <span className="text-green-600">✓ Ano</span>
                                    ) : (
                                        <span className="text-gray-400">✗ Ne</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(item)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Upravit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(item)}
                                            disabled={deletingItem === item.id}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Smazat</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Specifikace pozicí</h1>
                        <p className="text-muted-foreground">Správa položek pro sekce "Požadavky", "Náplň práce", "Nabízíme"</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchSectionItems} disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            {loading ? 'Načítá...' : 'Obnovit'}
                        </Button>
                        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Přidat položku
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Přehled položek specifikací {pagination && `(${pagination.total})`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
                            <div className="flex-1 space-y-2">
                                <label htmlFor="search" className="text-sm font-medium">
                                    Vyhledat
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Hledat podle textu..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-[200px] space-y-2">
                                <label htmlFor="sectionType" className="text-sm font-medium">
                                    Typ sekce
                                </label>
                                <Select value={selectedSectionType} onValueChange={handleSectionTypeChange}>
                                    <SelectTrigger id="sectionType">
                                        <SelectValue placeholder="Všechny typy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Všechny typy</SelectItem>
                                        {sectionTypes.map((type) => (
                                            <SelectItem key={type.name} value={type.name}>
                                                {type.description || type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => {
                                    handleSearchChange("")
                                    handleSectionTypeChange("all")
                                }}
                            >
                                <Filter className="h-4 w-4" />
                                <span className="sr-only">Vymazat filtry</span>
                            </Button>
                        </div>

                        {renderSectionItemsTable()}

                        {pagination && (
                            <div className="mt-4">
                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                    pageSize={pagination.limit}
                                    totalItems={pagination.total}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Upravit položku specifikace' : 'Přidat novou položku specifikace'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="section_type_name">Typ sekce *</Label>
                                <Select
                                    value={formData.section_type_name}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, section_type_name: value }))}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Vyberte typ sekce" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sectionTypes.map((type) => (
                                            <SelectItem key={type.name} value={type.name}>
                                                {type.description || type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="item_text">Text položky *</Label>
                                <Textarea
                                    id="item_text"
                                    value={formData.item_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, item_text: e.target.value }))}
                                    placeholder="Zadejte text položky..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="order_index">Pořadí</Label>
                                <Input
                                    id="order_index"
                                    type="number"
                                    min="0"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                                />
                                <Label htmlFor="is_active">Aktivní</Label>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Zrušit
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Ukládám...' : (editingItem ? 'Aktualizovat' : 'Vytvořit')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}
