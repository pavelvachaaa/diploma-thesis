'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Applicant, getAllApplicants } from '@/lib/api/applicants';

interface ApplicantSearchSelectProps {
    onSelect: (applicantId: string, applicant?: Applicant) => void;
    disabled?: boolean;
    error?: boolean;
}

export default function ApplicantSearchSelect({ onSelect, disabled, error }: ApplicantSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDisplay, setSelectedDisplay] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            if (!open) return;
            setIsLoading(true);
            try {
                const response = await getAllApplicants({ search: searchValue, limit: 5 });
                setApplicants(response.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300); // Debounce
        return () => clearTimeout(timer);
    }, [searchValue, open]);

    return (
        <div className="space-y-2">
            <Label className={cn(error && "text-destructive")}>Uchazeč *</Label>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between font-normal",
                            !selectedDisplay && "text-muted-foreground",
                            error && "border-destructive"
                        )}
                        disabled={disabled}
                    >
                        {selectedDisplay || "Vyhledejte uchazeče..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Hledat jméno, email..."
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            name="applicant-search-field"
                            id="applicant-search-field"
                            value={searchValue}
                            onValueChange={setSearchValue}
                        />
                        <CommandList>
                            {isLoading && (
                                <div className="flex items-center justify-center p-4 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Načítání...
                                </div>
                            )}
                            {!isLoading && applicants.length === 0 && (
                                <CommandEmpty>Žádný uchazeč nebyl nalezen.</CommandEmpty>
                            )}
                            <CommandGroup>
                                {applicants.map((a) => (
                                    <CommandItem
                                        key={a.id}
                                        value={a.id}
                                        onSelect={() => {
                                            setSelectedDisplay(`${a.name} ${a.surname}`)
                                            onSelect(a.id, a)
                                            setOpen(false)
                                        }}
                                        className="flex flex-col items-start py-2 cursor-pointer"
                                    >
                                        <span className="font-medium">{a.name} {a.surname}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {a.job_title} • {a.email}
                                        </span>
                                    </CommandItem>

                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}