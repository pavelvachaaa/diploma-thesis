'use client'

import React from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export interface TableColumn<T = any> {
  key: string
  title: string
  sortable?: boolean
  render?: (value: any, item: T, index: number) => React.ReactNode
  className?: string
  width?: string
}

export interface AdminTableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  
  // Selection
  selectable?: boolean
  selectedItems?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  getItemId?: (item: T) => string
  
  // Sorting
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null
  onSort?: (key: string) => void
  
  // Pagination
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  
  // Actions
  onRowClick?: (item: T, index: number) => void
  
  // Styling
  className?: string
  emptyMessage?: string
}

function AdminTable<T = any>({
  data,
  columns,
  loading = false,
  error,
  selectable = false,
  selectedItems = new Set(),
  onSelectionChange,
  getItemId = (item: any) => item.id,
  sortConfig,
  onSort,
  pagination,
  onPageChange,
  onRowClick,
  className = '',
  emptyMessage = 'Žádné záznamy nenalezeny'
}: AdminTableProps<T>) {
  
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      const allIds = new Set(data.map(getItemId))
      onSelectionChange(allIds)
    } else {
      onSelectionChange(new Set())
    }
  }
  
  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (!onSelectionChange) return
    
    const newSelection = new Set(selectedItems)
    if (checked) {
      newSelection.add(itemId)
    } else {
      newSelection.delete(itemId)
    }
    onSelectionChange(newSelection)
  }
  
  const handleSort = (columnKey: string) => {
    if (!onSort) return
    onSort(columnKey)
  }
  
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }
  
  const renderCell = (column: TableColumn<T>, item: T, index: number) => {
    const value = (item as any)[column.key]
    
    if (column.render) {
      return column.render(value, item, index)
    }
    
    // Default rendering for common types
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Ano' : 'Ne'}
        </Badge>
      )
    }
    
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }
    
    return String(value)
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">Chyba při načítání dat</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    )
  }
  
  const allSelected = data.length > 0 && data.every(item => selectedItems.has(getItemId(item)))
  const someSelected = data.some(item => selectedItems.has(getItemId(item)))
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {selectable && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((item, index) => {
                const itemId = getItemId(item)
                const isSelected = selectedItems.has(itemId)
                
                return (
                  <TableRow
                    key={itemId}
                    className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${isSelected ? 'bg-muted/30' : ''}`}
                    onClick={() => onRowClick?.(item, index)}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectItem(itemId, !!checked)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell 
                        key={column.key}
                        className={column.className}
                      >
                        {renderCell(column, item, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Zobrazeno {((pagination.page) * pagination.limit) + 1}-{Math.min((pagination.page + 1) * pagination.limit, pagination.total)} z {pagination.total} záznamů
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(0)}
              disabled={pagination.page === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Stránka {pagination.page + 1} z {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.totalPages - 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTable