import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export function ErrorMessage({
    title = "Chyba",
    message,
    onRetry
}: ErrorMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="btn-cta">
                    Zkusit znovu
                </Button>
            )}
        </div>
    );
}