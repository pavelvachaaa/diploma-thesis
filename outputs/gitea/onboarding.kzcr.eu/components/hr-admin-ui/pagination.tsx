"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  disabled = false
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Zobrazeno {totalItems} z {totalItems} záznamů
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Řádků na stránku</p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
            disabled={disabled}
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
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Zobrazeno {startItem}-{endItem} z {totalItems} záznamů
        </p>
      </div>
      
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Řádků na stránku</p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
            disabled={disabled}
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
          <p className="text-sm font-medium">
            Stránka {currentPage} z {totalPages}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || disabled}
          >
            <span className="sr-only">Přejít na první stránku</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
          >
            <span className="sr-only">Přejít na předchozí stránku</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="flex h-8 w-8 items-center justify-center text-sm">
                    ...
                  </span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={disabled}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
          >
            <span className="sr-only">Přejít na další stránku</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || disabled}
          >
            <span className="sr-only">Přejít na poslední stránku</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}