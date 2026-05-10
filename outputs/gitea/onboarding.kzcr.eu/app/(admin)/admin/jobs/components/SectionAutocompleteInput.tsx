"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { useDebounce } from "@/hooks/useDebounce"
import { getSectionItemsBySectionType, SectionItem } from "@/lib/api/section-items"
import { JobFormData } from "@/lib/api/jobs"

const SUGGESTION_LIMIT = 8

type JobSectionKey = keyof JobFormData["sections"]

interface SectionAutocompleteInputProps {
  section: JobSectionKey
  value: string
  placeholder: string
  onChange: (value: string) => void
  shouldAutoFocus?: boolean
  onAutoFocusHandled?: () => void
  onCommitByEnter?: () => void
}

export default function SectionAutocompleteInput({
  section,
  value,
  placeholder,
  onChange,
  shouldAutoFocus = false,
  onAutoFocusHandled,
  onCommitByEnter,
}: SectionAutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SectionItem[]>([])
  const [selectedSuggestionId, setSelectedSuggestionId] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const suppressOpenOnFocusRef = useRef(false)
  const debouncedQuery = useDebounce(value, 300)
  const trimmedValue = value.trim()
  const normalizedValue = trimmedValue.toLocaleLowerCase()
  const selectedSuggestion = useMemo(
    () => suggestions.find((item) => item.id === selectedSuggestionId),
    [selectedSuggestionId, suggestions]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    const loadSuggestions = async () => {
      setLoading(true)

      try {
        const items = await getSectionItemsBySectionType(section, {
          activeOnly: true,
          q: debouncedQuery.trim() || undefined,
          limit: SUGGESTION_LIMIT,
        })

        if (!cancelled) {
          setSuggestions(items)
        }
      } catch (error) {
        console.error("Failed to load section item suggestions:", error)
        if (!cancelled) {
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadSuggestions()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open, section])

  useEffect(() => {
    if (suggestions.length === 0) {
      setSelectedSuggestionId("")
      return
    }

    const exactMatch = suggestions.find(
      (item) => item.item_text.trim().toLocaleLowerCase() === normalizedValue
    )

    setSelectedSuggestionId((currentValue) => {
      if (exactMatch) {
        return exactMatch.id
      }

      return suggestions.some((item) => item.id === currentValue)
        ? currentValue
        : suggestions[0].id
    })
  }, [normalizedValue, suggestions])

  useEffect(() => {
    if (!shouldAutoFocus) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      onAutoFocusHandled?.()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [onAutoFocusHandled, shouldAutoFocus])

  useEffect(() => {
    if (!open || !selectedSuggestionId || loading) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const selectedItem = listRef.current?.querySelector<HTMLElement>(
        '[data-slot="command-item"][data-selected="true"]'
      )

      selectedItem?.scrollIntoView({
        block: "nearest",
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [loading, open, selectedSuggestionId, suggestions])

  const focusInput = () => {
    if (document.activeElement === inputRef.current) {
      return
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  const closeSuggestions = ({ restoreInputFocus = false } = {}) => {
    setOpen(false)

    if (!restoreInputFocus) {
      return
    }

    if (document.activeElement === inputRef.current) {
      suppressOpenOnFocusRef.current = false
      return
    }

    suppressOpenOnFocusRef.current = true
    focusInput()
  }

  const selectNextSuggestion = () => {
    if (suggestions.length === 0) {
      return
    }

    setSelectedSuggestionId((currentValue) => {
      const currentIndex = suggestions.findIndex((item) => item.id === currentValue)
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % suggestions.length : 0
      return suggestions[nextIndex].id
    })
  }

  const selectPreviousSuggestion = () => {
    if (suggestions.length === 0) {
      return
    }

    setSelectedSuggestionId((currentValue) => {
      const currentIndex = suggestions.findIndex((item) => item.id === currentValue)
      const previousIndex = currentIndex >= 0
        ? (currentIndex - 1 + suggestions.length) % suggestions.length
        : suggestions.length - 1
      return suggestions[previousIndex].id
    })
  }

  const applySuggestion = (
    item: SectionItem,
    options: { source: "keyboard" | "pointer" } = { source: "pointer" }
  ) => {
    const isSameValue = item.item_text.trim().toLocaleLowerCase() === normalizedValue

    if (isSameValue) {
      setSelectedSuggestionId(item.id)
      closeSuggestions({ restoreInputFocus: true })

      if (options.source === "keyboard") {
        onCommitByEnter?.()
      }

      return
    }

    setSelectedSuggestionId(item.id)
    onChange(item.item_text)
    closeSuggestions({ restoreInputFocus: true })

    if (options.source === "keyboard") {
      onCommitByEnter?.()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (suppressOpenOnFocusRef.current) {
              suppressOpenOnFocusRef.current = false
              return
            }

            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeSuggestions()
              return
            }

            if (event.key === "ArrowDown") {
              event.preventDefault()
              if (!open) {
                setOpen(true)
              }
              selectNextSuggestion()
              return
            }

            if (event.key === "ArrowUp") {
              event.preventDefault()
              if (!open) {
                setOpen(true)
              }
              selectPreviousSuggestion()
              return
            }

            if (event.key === "Enter") {
              event.preventDefault()

              if (open && selectedSuggestion && !loading) {
                applySuggestion(selectedSuggestion, { source: "keyboard" })
                return
              }

              closeSuggestions({ restoreInputFocus: true })

              if (trimmedValue) {
                onCommitByEnter?.()
              }
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1"
        />
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-[min(32rem,calc(100vw-2rem))] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <Command
          shouldFilter={false}
          loop
          value={selectedSuggestionId}
          onValueChange={setSelectedSuggestionId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              closeSuggestions({ restoreInputFocus: true })
            }
          }}
        >
          <CommandList ref={listRef}>
            {loading && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Načítání návrhů…
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <CommandGroup heading="Návrhy">
                {suggestions.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onSelect={() => applySuggestion(item, { source: "pointer" })}
                  >
                    {item.item_text}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!loading && suggestions.length === 0 && trimmedValue && (
              <div className="p-3 text-sm text-muted-foreground">
                Položka se uloží do specifikací při uložení nabídky.
              </div>
            )}

            {!loading && suggestions.length === 0 && !trimmedValue && (
              <div className="p-3 text-sm text-muted-foreground">
                Žádné uložené návrhy pro tuto sekci.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
