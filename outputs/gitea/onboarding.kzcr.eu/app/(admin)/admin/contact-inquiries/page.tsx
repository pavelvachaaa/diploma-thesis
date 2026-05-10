"use client"

import React, { useEffect, useMemo, useState } from "react"
import { AdminComponentErrorBoundary, AdminFilters, AdminPageErrorBoundary, AdminTable } from "@/components/admin"
import type { FilterDefinition, TableColumn } from "@/components/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDebounce } from "@/hooks/useDebounce"
import {
  getAllContactInquiries,
  getContactInquiryById,
  sendReplyToContactInquiry,
  type ContactInquiry,
  type ContactInquiriesResponse,
} from "@/lib/api/contact_inquiries"
import { Eye, Mail, Loader2, MessageSquare, Phone, RefreshCw, Send } from "lucide-react"
import toast from "react-hot-toast"

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) {
    return "-"
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const getResponderLabel = (inquiry: ContactInquiry) => {
  const fullName = [inquiry.last_replied_by_name, inquiry.last_replied_by_surname].filter(Boolean).join(" ").trim()
  return fullName || inquiry.last_replied_by_email || "-"
}

export default function AdminContactInquiriesPage() {
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([])
  const [pagination, setPagination] = useState<ContactInquiriesResponse["pagination"] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({ status: "all" })
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyForm, setReplyForm] = useState({ subject: "", message: "" })

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const pageSize = 10

  const filterDefinitions: FilterDefinition[] = useMemo(() => ([
    {
      key: "status",
      label: "Stav",
      type: "select",
      options: [
        { value: "all", label: "Všechny dotazy" },
        { value: "unanswered", label: "Nezodpovězené" },
        { value: "answered", label: "Zodpovězené" },
      ],
      defaultValue: "all",
    },
  ]), [])

  const loadContactInquiries = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getAllContactInquiries({
        page: currentPage + 1,
        limit: pageSize,
        search: debouncedSearchTerm || undefined,
        status: filters.status as 'all' | 'answered' | 'unanswered',
      })

      setContactInquiries(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se načíst kontaktní dotazy")
    } finally {
      setIsLoading(false)
    }
  }

  const loadInquiryDetail = async (id: string) => {
    const inquiry = await getContactInquiryById(id)
    setSelectedInquiry(inquiry)
    return inquiry
  }

  useEffect(() => {
    loadContactInquiries()
  }, [currentPage, debouncedSearchTerm, filters])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const handleFiltersChange = (nextFilters: Record<string, unknown>) => {
    setFilters({ status: nextFilters.status || "all" })
    setCurrentPage(0)
  }

  const handleOpenDetail = async (inquiry: ContactInquiry) => {
    try {
      const detail = await loadInquiryDetail(inquiry.id)
      setSelectedInquiry(detail)
      setIsDetailOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nepodařilo se načíst detail dotazu")
    }
  }

  const handleOpenReply = async (inquiry: ContactInquiry) => {
    try {
      const detail = await loadInquiryDetail(inquiry.id)
      setSelectedInquiry(detail)
      setReplyForm({
        subject: detail.last_reply_subject || "Re: váš dotaz",
        message: "",
      })
      setIsReplyOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nepodařilo se načíst dotaz")
    }
  }

  const handleSendReply = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedInquiry) {
      return
    }

    if (!replyForm.subject.trim() || !replyForm.message.trim()) {
      toast.error("Vyplňte předmět i zprávu")
      return
    }

    setIsReplying(true)
    try {
      const response = await sendReplyToContactInquiry(selectedInquiry.id, {
        subject: replyForm.subject.trim(),
        message: replyForm.message.trim(),
      })

      toast.success(response.message || "Email byl úspěšně odeslán")
      setSelectedInquiry(response.inquiry)
      setIsReplyOpen(false)
      setReplyForm({ subject: "", message: "" })
      await loadContactInquiries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nepodařilo se odeslat odpověď")
    } finally {
      setIsReplying(false)
    }
  }

  const handleCopyEmail = async (email: string, event?: React.MouseEvent) => {
    event?.stopPropagation()

    try {
      await navigator.clipboard.writeText(email)
      toast.success(`Email ${email} zkopírován do schránky`)
    } catch {
      toast.error("Nepodařilo se zkopírovat email do schránky")
    }
  }

  const columns: TableColumn<ContactInquiry>[] = [
    {
      key: "name",
      title: "Jméno",
      render: (value) => value || "-",
    },
    {
      key: "email",
      title: "Email",
      render: (value) => value ? (
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={(event) => {
            void handleCopyEmail(value, event)
          }}
        >
          {value}
        </button>
      ) : "-",
    },
    {
      key: "phone",
      title: "Telefon",
      render: (value) => value || "-",
    },
    {
      key: "status",
      title: "Stav",
      render: (value) => value === "answered" ? (
        <Badge variant="outline" className="bg-green-50 text-green-700">Zodpovězeno</Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-50 text-amber-700">Nezodpovězeno</Badge>
      ),
    },
    {
      key: "submitted_at",
      title: "Přijato",
      render: (value) => formatDateTime(value),
    },
    {
      key: "last_replied_at",
      title: "Naposledy odpovězeno",
      render: (value) => formatDateTime(value),
    },
    {
      key: "last_replied_by_name",
      title: "Odpověděl",
      render: (_value, inquiry) => getResponderLabel(inquiry),
    },
    {
      key: "actions",
      title: "Akce",
      className: "text-right",
      render: (_value, inquiry) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              void handleOpenDetail(inquiry)
            }}
            title="Zobrazit detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              void handleOpenReply(inquiry)
            }}
            title="Odpovědět emailem"
          >
            <Mail className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kontaktní dotazy</h1>
            <p className="text-muted-foreground">Centrální inbox dotazů z veřejného formuláře /kontaktuj-nas</p>
          </div>
          <Button variant="outline" onClick={loadContactInquiries} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isLoading ? "Načítá..." : "Obnovit"}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Přehled kontaktních dotazů {pagination && `(${pagination.total})`}</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminComponentErrorBoundary componentName="ContactInquiryFilters">
              <AdminFilters
                filters={filterDefinitions}
                values={filters}
                onChange={handleFiltersChange}
                searchPlaceholder="Hledat podle jména, emailu, telefonu nebo textu..."
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                variant="inline"
              />
            </AdminComponentErrorBoundary>

            <AdminComponentErrorBoundary componentName="ContactInquiryTable">
              <AdminTable
                data={contactInquiries}
                columns={columns}
                loading={isLoading}
                error={error || undefined}
                pagination={pagination ? {
                  page: pagination.page - 1,
                  limit: pagination.limit,
                  total: pagination.total,
                  totalPages: pagination.totalPages,
                } : undefined}
                onPageChange={handlePageChange}
                onRowClick={(item) => {
                  void handleOpenDetail(item)
                }}
                emptyMessage="Žádné kontaktní dotazy nenalezeny"
              />
            </AdminComponentErrorBoundary>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detail kontaktního dotazu</DialogTitle>
            <DialogDescription>Kompletní informace o odeslaném dotazu</DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="min-h-0 space-y-6 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Jméno</label>
                  <p className="mt-1 text-base font-medium">{selectedInquiry.name}</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="mt-1 text-base">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={(event) => {
                        void handleCopyEmail(selectedInquiry.email, event)
                      }}
                    >
                      {selectedInquiry.email}
                    </button>
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Telefon
                  </label>
                  <p className="mt-1 text-base">{selectedInquiry.phone || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stav</label>
                  <div className="mt-1">
                    {selectedInquiry.status === "answered" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">Zodpovězeno</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Nezodpovězeno</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Přijato</label>
                  <p className="mt-1 text-base">{formatDateTime(selectedInquiry.submitted_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Naposledy odpovězeno</label>
                  <p className="mt-1 text-base">{formatDateTime(selectedInquiry.last_replied_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Odpověděl</label>
                  <p className="mt-1 text-base">{getResponderLabel(selectedInquiry)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Předmět poslední odpovědi</label>
                  <p className="mt-1 text-base">{selectedInquiry.last_reply_subject || "-"}</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Zpráva
                </label>
                <div className="mt-2 max-h-[260px] overflow-y-auto rounded-md border bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>

              {selectedInquiry.last_reply_message && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Send className="h-4 w-4" />
                    Poslední odeslaná odpověď
                  </label>
                  <div className="mt-2 max-h-[260px] overflow-y-auto rounded-md border bg-blue-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {selectedInquiry.last_reply_message}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailOpen(false)
                    void handleOpenReply(selectedInquiry)
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Odpovědět emailem
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Odpovědět na dotaz</DialogTitle>
            <DialogDescription>
              Odpověď bude odeslána na email tazatele a dotaz se označí jako zodpovězený.
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recipient" className="text-right">Příjemce</Label>
                  <div className="col-span-3">
                    <Input
                      id="recipient"
                      value={`${selectedInquiry.name} (${selectedInquiry.email})`}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">Předmět *</Label>
                  <div className="col-span-3">
                    <Input
                      id="subject"
                      value={replyForm.subject}
                      onChange={(event) => setReplyForm((prev) => ({ ...prev, subject: event.target.value }))}
                      disabled={isReplying}
                      placeholder="Předmět odpovědi"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="message" className="pt-2 text-right">Zpráva *</Label>
                  <div className="col-span-3">
                    <textarea
                      id="message"
                      value={replyForm.message}
                      onChange={(event) => setReplyForm((prev) => ({ ...prev, message: event.target.value }))}
                      disabled={isReplying}
                      rows={8}
                      className="flex min-h-[180px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Napište odpověď..."
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsReplyOpen(false)} disabled={isReplying}>
                  Zrušit
                </Button>
                <Button type="submit" disabled={isReplying}>
                  {isReplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Odesílání...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Odeslat email
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageErrorBoundary>
  )
}
