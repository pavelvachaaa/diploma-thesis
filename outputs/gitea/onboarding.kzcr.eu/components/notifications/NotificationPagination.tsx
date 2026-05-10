'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface NotificationPaginationProps {
    currentPage: number
    pageSize: number
    totalLoaded: number
    canGoNext: boolean
    canGoPrev: boolean
    loading: boolean
    onNextPage: () => void
    onPrevPage: () => void
    onPageSizeChange: (size: number) => void
}

export function NotificationPagination({
    currentPage,
    pageSize,
    totalLoaded,
    canGoNext,
    canGoPrev,
    loading,
    onNextPage,
    onPrevPage,
    onPageSizeChange
}: NotificationPaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalLoaded)

    return (
        <div className="flex items-center justify-between px-2 py-3">
            <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">
                    Zobrazeno {startItem}-{endItem} z načtených {totalLoaded}
                    {canGoNext ? '+' : ''} záznamů
                </p>
            </div>
            
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Řádků na stránku</p>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(parseInt(value))}
                        disabled={loading}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 50, 100].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-700">
                        Stránka {currentPage}
                    </p>
                </div>
                
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPrevPage}
                        disabled={!canGoPrev || loading}
                        className="h-8 px-3"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Předchozí
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNextPage}
                        disabled={!canGoNext || loading}
                        className="h-8 px-3"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <>
                                Další
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}