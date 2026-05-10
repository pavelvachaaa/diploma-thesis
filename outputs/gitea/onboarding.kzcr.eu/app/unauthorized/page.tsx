import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
            <div className="max-w-md text-center space-y-6">
                <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-4 mx-auto">
                    <Lock className="h-10 w-10 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800">Přístup zamítnut</h1>
                <p className="text-gray-600 text-lg">
                    Nemáte oprávnění pro zobrazení této stránky. Zkontrolujte své přihlašovací údaje nebo se vraťte na domovskou stránku.
                </p>
                <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center">
                    <Link href="/login">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Přihlásit se znovu
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zpět na úvodní stránku
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
