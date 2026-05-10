'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAssetPath } from '@/lib/paths';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navItem =
        "text-sm font-medium relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-[var(--primary)] after:transition-all hover:after:w-full";
    return (
        <header className="border-b sticky top-0 z-50 bg-white">
            <div className="mx-auto max-w-7xl w-full flex h-16 items-center justify-between px-4 md:px-6 overflow-hidden">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0 md:min-w-[220px]">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src={getAssetPath("/logo.png")}
                            alt="Krajská zdravotní"
                            width={220}
                            height={60}
                            className="h-14 w-auto"
                        />
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className={`${geistSans.className} font-bold hidden md:flex gap-6 justify-center flex-1`}>
                    <Link href="/" className={navItem}>Domů</Link>
                    <Link href="/jobs" className={navItem}>Volné pozice</Link>
                    <Link href="/hospitals" className={navItem}>Nemocnice</Link>
                    <Link href="/#benefits" className={navItem}>Benefity</Link>
                    <Link href="/#scholarships" className={navItem}>Stipendia</Link>
                    <Link href="/faq" className={navItem}>FAQ</Link>
                    <Link href="/contacts" className={navItem}>Chci práci</Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center justify-end md:min-w-[220px] gap-4">
                    <Link href="/jobs" className="hidden md:block">
                        <Button className="btn-cta-main bg-[var(--color-purple)] font-bold cursor-pointer">Volné pozice</Button>
                    </Link>
                    <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden px-4 py-2 space-y-2 border-t bg-white font-[family-name:var(--font-geist-sans)]">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">Domů</Link>
                    <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">Volná místa</Link>
                    <Link href="/hospitals" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">Nemocnice</Link>
                    <Link href="/#benefits" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">Benefity</Link>
                    <Link href="/#scholarships" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">Stipendia</Link>
                    <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">FAQ</Link>
                    <Link href="/contacts" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:underline underline-offset-4">Chci práci</Link>
                    <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button className="w-full mt-2 btn-cta-main">Volné pozice</Button>
                    </Link>
                </div>
            )}
        </header>
    );
}
