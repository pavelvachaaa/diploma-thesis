"use client"

import { useMemo, useState } from "react"
import { AlertCircle, BadgeCheck, Search, UserRound } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  lookupQualification,
  type QualificationItem,
  type QualificationLookupResult,
  type QualificationSearchType,
  type QualificationWorker
} from "@/lib/api/qualifications"

const formatBirthDateValue = (value: number | null) => {
  if (value === null || value === undefined) {
    return "-"
  }

  const baseDate = Date.UTC(1840, 11, 31)
  const date = new Date(baseDate + value * 24 * 60 * 60 * 1000)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat("cs-CZ").format(date)
}

const hasMeaningfulWorker = (worker: QualificationWorker | null) => {
  if (!worker) {
    return false
  }

  return Boolean(
    worker.nrzpCislo
    || worker.jmeno
    || worker.prijmeni
    || worker.datumNarozeni
    || worker.statniObcanstvi
  )
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
    {message}
  </div>
)

const SearchTypeOption = ({
  id,
  value,
  label,
  hint,
}: {
  id: string
  value: QualificationSearchType
  label: string
  hint: string
}) => (
  <Label
    htmlFor={id}
    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/60"
  >
    <RadioGroupItem value={value} id={id} className="mt-0.5" />
    <span className="space-y-0.5">
      <span className="block text-sm font-medium leading-none">{label}</span>
      <span className="block text-xs text-muted-foreground">{hint}</span>
    </span>
  </Label>
)

const WorkerCard = ({
  worker,
  title = "Pracovník",
}: {
  worker: QualificationWorker
  title?: string
}) => (
  <div className="rounded-md border bg-background p-4">
    <h4 className="mb-3 text-sm font-medium">{title}</h4>
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Jméno</dt>
        <dd className="font-medium">{worker.jmeno || "-"} {worker.prijmeni || ""}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">NRZP číslo</dt>
        <dd className="font-medium">{worker.nrzpCislo ?? "-"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Datum narození</dt>
        <dd className="font-medium">{formatBirthDateValue(worker.datumNarozeni)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Státní občanství</dt>
        <dd className="font-medium">{worker.statniObcanstvi || "-"}</dd>
      </div>
    </dl>
  </div>
)

const QualificationsSection = ({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: QualificationItem[]
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <EmptyState message="V této sekci nebyly nalezeny žádné záznamy." />
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div key={`${title}-${item.nrzpCislo ?? "na"}-${index}`} className="rounded-md border bg-background p-4">
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">NRZP číslo</dt>
                  <dd className="font-medium">{item.nrzpCislo ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Typ způsobilosti</dt>
                  <dd className="font-medium">{item.typZpusobilosti || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Obor</dt>
                  <dd className="font-medium">{item.obor || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Odbornost</dt>
                  <dd className="font-medium">{item.odbornost || "-"}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QualificationLookupPanel() {
  const [searchType, setSearchType] = useState<QualificationSearchType>("nrzp")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QualificationLookupResult | null>(null)

  const queryPlaceholder = useMemo(() => {
    return searchType === "nrzp"
      ? "Zadejte NRZP číslo (např. 122036563)"
      : "Zadejte rodné číslo (např. 850101/1234)"
  }, [searchType])

  const resultStateVariant = result?.upstream.success === 1 ? "default" : "destructive"

  const handleLookup = async () => {
    if (!query.trim()) {
      setError("Vyhledávací hodnota je povinná.")
      setResult(null)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await lookupQualification({
        searchType,
        query: query.trim(),
      })

      const qualificationCount = response.counts.odborneZpusobilosti
        + response.counts.specializovaneZpusobilosti
        + response.counts.zvlastniOdborneZpusobilosti
      const hasData = hasMeaningfulWorker(response.worker) || response.workers.length > 0 || qualificationCount > 0
      const isSuccess = response.upstream.success === 1

      if (!isSuccess || !hasData) {
        setError("Kvalifikace se nepodařilo načíst.")
        setResult(null)
        return
      }

      setResult(response)
    } catch (err) {
      setError("Kvalifikace se nepodařilo načíst.")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Kvalifikace</CardTitle>
          <CardDescription>Ověření kvalifikací přes NRZP registr.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label>Vyhledat podle</Label>
            <RadioGroup
              value={searchType}
              onValueChange={(value) => setSearchType(value as QualificationSearchType)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <SearchTypeOption
                id="lookup-nrzp"
                value="nrzp"
                label="NRZP číslo"
                hint="Přímé vyhledání podle čísla pracovníka."
              />
              <SearchTypeOption
                id="lookup-rodne"
                value="rodne_cislo"
                label="Rodné číslo"
                hint="Vyhledání osoby a jejích kvalifikací."
              />
            </RadioGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="qualification-query">Hledaný údaj</Label>
              <Input
                id="qualification-query"
                placeholder={queryPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void handleLookup()
                  }
                }}
              />
            </div>
            <Button onClick={() => void handleLookup()} disabled={loading} className="h-10 sm:min-w-36">
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Ověřuji…" : "Ověřit"}
            </Button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {searchType === "nrzp" ? "Pouze číslice." : "Můžete zadat i formát se znakem /."}
            </p>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lookup selhal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && result && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Výsledek ověření</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={resultStateVariant}>Stav: {result.upstream.stav || "Neznámý"}</Badge>
                <Badge variant="outline">Maska dotazu: {result.queryMasked || "-"}</Badge>
                <Badge variant="secondary">Nalezených pracovníků: {result.counts.workers}</Badge>
                {result.upstream.operation && (
                  <Badge variant="outline">Operace: {result.upstream.operation}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.worker ? (
                <WorkerCard worker={result.worker} />
              ) : (
                <EmptyState message="Pracovník nebyl v odpovědi nalezen." />
              )}

              {result.workers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Seznam vrácených pracovníků</h4>
                  <div className="grid gap-3">
                    {result.workers.map((worker, index) => (
                      <WorkerCard
                        key={`workers-${worker.nrzpCislo ?? "na"}-${index}`}
                        worker={worker}
                        title={`Pracovník ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Kvalifikace</CardTitle>
              </div>
              <CardDescription>Rozpad podle typu způsobilosti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Odborné: {result.counts.odborneZpusobilosti}</Badge>
                <Badge variant="secondary">Specializované: {result.counts.specializovaneZpusobilosti}</Badge>
                <Badge variant="secondary">Zvláštní odborné: {result.counts.zvlastniOdborneZpusobilosti}</Badge>
              </div>

              <QualificationsSection
                title="Odborné způsobilosti"
                description="Základní odborná kvalifikace pracovníka."
                items={result.qualifications.odborneZpusobilosti}
              />
              <QualificationsSection
                title="Specializované způsobilosti"
                description="Specializační kvalifikace navázané na obor."
                items={result.qualifications.specializovaneZpusobilosti}
              />
              <QualificationsSection
                title="Zvláštní odborné způsobilosti"
                description="Zvláštní odborná oprávnění."
                items={result.qualifications.zvlastniOdborneZpusobilosti}
              />
            </CardContent>
          </Card>

          {(result.upstream.message || result.upstream.error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upozornění poskytovatele</AlertTitle>
              <AlertDescription>
                {result.upstream.message || result.upstream.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {!loading && !error && !result && (
        <EmptyState message="Zadejte identifikátor a spusťte ověření kvalifikace." />
      )}
    </div>
  )
}
