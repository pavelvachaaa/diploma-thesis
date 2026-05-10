'use client';
import Image from "next/image";
import Link from "next/link";
import { getAssetPath } from "@/lib/basePath";

export default function Footer() {

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto max-w-screen-xl px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Image
                                src={getAssetPath("/logo-pat-kz-w.png")}
                                alt="Krajská zdravotní nemocnice Ústeckého kraje"
                                width={250}
                                height={90}
                            />
                        </div>
                        <p className="text-sm">Zjednodušujeme proces onboardingu zaměstnanců pro zdravotnická zařízení.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Rychlé odkazy</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-blue-400">
                                    Domů
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-blue-400">
                                    O systému
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-blue-400">
                                    Kontakt
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Zdroje</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/faq" className="hover:text-blue-400">
                                    Časté dotazy
                                </Link>
                            </li>
                            <li>
                                <Link href="/help" className="hover:text-blue-400">
                                    Centrum nápovědy
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-blue-400">
                                    Ochrana osobních údajů
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Kontakt</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="mailto:podpora@kzcr.eu" className="hover:text-blue-400">
                                    podpora@kzcr.eu
                                </Link>
                            </li>
                            <li>
                                <Link href="tel:+420123456789" className="hover:text-blue-400">
                                    +420 123 456 789
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm">
                    <p>© 2025 Krajská Zdravotní a.s. Všechna práva vyhrazena.</p>
                </div>
            </div>
        </footer>

    );
}