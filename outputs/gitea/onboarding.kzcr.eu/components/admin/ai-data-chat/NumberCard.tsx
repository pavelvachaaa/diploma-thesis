"use client"

import { Card, CardContent } from "@/components/ui/card"

interface NumberCardProps {
    data: Record<string, unknown>[]
    explanation: string
}

export function NumberCard({ data, explanation }: NumberCardProps) {
    // Extract the single number value from the first row
    const value = data.length > 0 ? Object.values(data[0])[0] : null
    const displayValue = value !== null && value !== undefined ? String(value) : "—"

    return (
        <Card className="w-fit">
            <CardContent className="pt-6 pb-4 px-8 text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                    {displayValue}
                </div>
                <p className="text-sm text-muted-foreground">
                    {explanation}
                </p>
            </CardContent>
        </Card>
    )
}
