"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AuthorizedPerson, searchInternalUsers } from "@/lib/api/jobs"

interface AuthorizedPeopleSectionProps {
  value: AuthorizedPerson[]
  onChange: (people: AuthorizedPerson[]) => void
  readOnly?: boolean
  saveError?: string | null
}

const getPersonKey = (person: AuthorizedPerson): string => {
  const runtimePerson = person as AuthorizedPerson & {
    user_id?: string | null
    local_user_id?: string | null
    seat_location?: string | null
  }

  const email = String(person.email || "").trim().toLowerCase()
  const seatLocation = String(
    person.seatLocation
      || runtimePerson.seat_location
      || ""
  ).trim().toUpperCase()

  return String(
    person.localUserId
      || runtimePerson.local_user_id
      || person.userId
      || runtimePerson.user_id
      || person.id
      || `${email}:${seatLocation}`
  )
}

const getPersonLabel = (person: AuthorizedPerson): string => {
  return person.fullName
    || [person.name, person.surname].filter(Boolean).join(" ").trim()
    || person.email
}

export default function AuthorizedPeopleSection({
  value,
  onChange,
  readOnly = false,
  saveError = null,
}: AuthorizedPeopleSectionProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AuthorizedPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedKeys = useMemo(() => new Set(value.map(getPersonKey)), [value])

  useEffect(() => {
    if (readOnly) {
      return
    }

    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await searchInternalUsers(normalizedQuery)
        setResults(response)
      } catch (searchError) {
        setResults([])
        setError(searchError instanceof Error ? searchError.message : "Vyhledávání selhalo")
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [query, readOnly])

  const addPerson = (person: AuthorizedPerson) => {
    if (selectedKeys.has(getPersonKey(person))) {
      return
    }

    onChange([...value, person])
    setQuery("")
    setResults([])
  }

  const removePerson = (person: AuthorizedPerson) => {
    const personKey = getPersonKey(person)
    onChange(value.filter((item) => getPersonKey(item) !== personKey))
  }

  const availableResults = results.filter((person) => !selectedKeys.has(getPersonKey(person)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oprávněné osoby</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Přiřazené osoby</Label>
          {value.length > 0 ? (
            <div className="space-y-2">
              {value.map((person) => (
                <div
                  key={getPersonKey(person)}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{getPersonLabel(person)}</div>
                    <div className="text-sm text-muted-foreground">{person.email}</div>
                    <div className="flex flex-wrap gap-2">
                      {person.organizationName && (
                        <Badge variant="outline">{person.organizationName}</Badge>
                      )}
                      {person.seatLocation && (
                        <Badge variant="outline">{person.seatLocation}</Badge>
                      )}
                      {person.existsLocally && <Badge variant="outline">lokální účet</Badge>}
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePerson(person)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Zatím není přiřazena žádná oprávněná osoba.
            </p>
          )}
        </div>

        {!readOnly && (
          <>
            <div className="space-y-2">
              <Label htmlFor="authorized-people-search">Vyhledat interního zaměstnance</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="authorized-people-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zadejte jméno nebo e-mail..."
                  className="pl-9"
                />
              </div>
              {query.trim().length > 0 && query.trim().length < 2 && (
                <p className="text-sm text-muted-foreground">
                  Zadejte alespoň 2 znaky.
                </p>
              )}
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            {(loading || availableResults.length > 0) && (
              <div className="space-y-2 rounded-md border p-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Vyhledávám...
                  </div>
                ) : (
                  availableResults.map((person) => (
                    <button
                      type="button"
                      key={getPersonKey(person)}
                      onClick={() => addPerson(person)}
                      className="flex w-full items-center justify-between gap-4 rounded-md border px-3 py-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{getPersonLabel(person)}</div>
                        <div className="text-sm text-muted-foreground">{person.email}</div>
                        {(person.organizationName || person.seatLocation) && (
                          <div className="text-xs text-muted-foreground">
                            {[person.organizationName, person.seatLocation].filter(Boolean).join(" • ")}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
