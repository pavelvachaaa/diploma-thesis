"use client";
import Link from "next/link";

export default function Footer() {

    return (
        <footer className="border-t bg-white px-4 py-4">
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-sm text-gray-500 md:text-left">
                    &copy; 2025 Krajská zdravotní, a.s. Všechna práva vyhrazena.
                </p>
                <div className="flex items-center gap-4">
                    <Link href="/help" className="text-sm text-gray-500 hover:text-blue-600">
                        Centrum nápovědy
                    </Link>
                    <Link href="/privacy" className="text-sm text-gray-500 hover:text-blue-600">
                        Ochrana osobních údajů
                    </Link>
                    <Link href="/contact" className="text-sm text-gray-500 hover:text-blue-600">
                        Kontakt
                    </Link>
                </div>
            </div>
        </footer>

    );
}
