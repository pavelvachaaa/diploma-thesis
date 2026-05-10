'use client'

import * as React from 'react'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

export interface AsyncComboboxItem {
    id: string
}

interface AsyncComboboxProps<T extends AsyncComboboxItem> {
    label: string
    placeholder: string
    searchPlaceholder?: string
    disabled?: boolean
    error?: boolean
    initialDisplayValue?: string
    /** Fetch items based on search value */
    fetchItems: (search: string) => Promise<T[]>

    /** How to render item label */
    getItemLabel: (item: T) => string

    /** Optional secondary line */
    getItemDescription?: (item: T) => string

    /** Selection callback */
    onSelect: (item: T) => void
}

export function AsyncCombobox<T extends AsyncComboboxItem>({
    label,
    placeholder,
    searchPlaceholder = 'Hledat…',
    initialDisplayValue = '',
    disabled,
    error,
    fetchItems,
    getItemLabel,
    getItemDescription,
    onSelect,
}: AsyncComboboxProps<T>) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [items, setItems] = React.useState<T[]>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedLabel, setSelectedLabel] = React.useState('')


    React.useEffect(() => {
        setSelectedLabel(initialDisplayValue)
    }, [initialDisplayValue])
    React.useEffect(() => {
        if (!open) return

        const run = async () => {
            setLoading(true)
            try {
                const result = await fetchItems(search)
                setItems(result)
            } catch (e) {
                console.error('AsyncCombobox fetch failed', e)
                setItems([])
            } finally {
                setLoading(false)
            }
        }

        const t = setTimeout(run, 300)
        return () => clearTimeout(t)
    }, [search, open, fetchItems])

    return (
        <div className="space-y-2">
            <Label className={cn(error && 'text-destructive')}>{label}</Label>

            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-between font-normal',
                            !selectedLabel && 'text-muted-foreground',
                            error && 'border-destructive'
                        )}
                    >
                        {selectedLabel || placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                    <Command shouldFilter={false}>
                        <CommandInput
                            value={search}
                            onValueChange={setSearch}
                            placeholder={searchPlaceholder}
                            autoComplete="off"
                        />

                        <CommandList>
                            {loading && (
                                <div className="flex items-center justify-center p-4 text-sm">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Načítání…
                                </div>
                            )}

                            {!loading && items.length === 0 && (
                                <CommandEmpty>Žádné výsledky</CommandEmpty>
                            )}

                            <CommandGroup>
                                {items.map(item => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.id}
                                        onSelect={() => {
                                            const label = getItemLabel(item)
                                            setSelectedLabel(label)
                                            onSelect(item)
                                            setOpen(false)
                                        }}
                                        className="flex cursor-pointer flex-col items-start py-2"
                                    >
                                        <span className="font-medium">
                                            {getItemLabel(item)}
                                        </span>

                                        {getItemDescription && (
                                            <span className="text-xs text-muted-foreground">
                                                {getItemDescription(item)}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
