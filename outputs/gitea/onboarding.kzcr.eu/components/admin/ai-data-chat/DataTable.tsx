"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TableIcon } from "lucide-react"

interface DataTableProps {
    data: Record<string, unknown>[]
}

export function DataTable({ data }: DataTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TableIcon className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Dotaz nevrátil žádná data</p>
            </div>
        )
    }

    const columns = Object.keys(data[0])

    return (
        <div className="rounded-md border overflow-auto max-h-96">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col} className="whitespace-nowrap font-semibold">
                                {col}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, i) => (
                        <TableRow key={i}>
                            {columns.map((col) => (
                                <TableCell key={col} className="whitespace-nowrap">
                                    {formatValue(row[col])}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "—"
    if (value instanceof Date) return value.toLocaleDateString("cs-CZ")
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
}
