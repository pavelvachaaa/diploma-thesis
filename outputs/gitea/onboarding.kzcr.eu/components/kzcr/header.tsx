'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAssetPath } from '@/lib/basePath';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="border-b">
            <div className="mx-auto max-w-7xl w-full flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0 min-w-[180px]">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src={getAssetPath("/logo.png")}
                            alt="Krajská zdravotní"
                            width={180}
                            height={50}
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex gap-6 justify-center flex-1">
                    <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">Domů</Link>
                    <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">O systému</Link>
                    <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4">Kontakt</Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center justify-end min-w-[180px] gap-4">
                    <Link href="/login" className="hidden md:block cursor-pointer ">
                        <Button className="cursor-pointer btn-primary">Přihlásit se</Button>
                    </Link>
                    <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden px-4 py-2 space-y-2 border-t bg-white">
                    <Link href="/" className="block text-sm font-medium hover:underline underline-offset-4">Domů</Link>
                    <Link href="/about" className="block text-sm font-medium hover:underline underline-offset-4">O nás</Link>
                    <Link href="/contact" className="block text-sm font-medium hover:underline underline-offset-4">Kontakt</Link>
                    <Link href="/login" className="block w-full pt-2">
                        <Button asChild className="w-full cursor-pointer btn-primary">
                            <span>Přihlásit se</span>
                        </Button>
                    </Link>
                </div>
            )}
        </header>
    );
}
