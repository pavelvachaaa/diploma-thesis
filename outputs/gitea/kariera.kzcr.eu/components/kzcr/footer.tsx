import Image from "next/image";
import Link from "next/link";
import { getAssetPath } from '@/lib/paths';

export default function Footer() {
    return (
        <footer className="bg-[var(--color-purple)] text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 text-left">
                    <div>
                        <div className="mb-4">
                            <Image
                                src={getAssetPath("/kz-uk-white.png")}
                                alt="Krajská zdravotní nemocnice Ústeckého kraje"
                                width={250}
                                height={90}
                                className="block h-auto ml-[-20px] mt-[-18px]"
                            />
                        </div>
                        <p className="text-sm font-bold">Zjednodušujeme vám cestu budovat kariéru v&nbsp;našich nemocnicích.</p>
                    </div>
                    <div className="md:px-12 px-0">
                        <h3 className="text-lg font-bold text-white mb-4">Rychlé odkazy</h3>
                        <ul className="space-y-2 text-sm font-bold">
                            <li>
                                <Link href="/jobs" className="hover:text-[var(--primary)]">
                                    Volné pozice
                                </Link>
                            </li>
                            <li>
                                <Link href="/kontaktuj-nas" className="hover:text-[var(--primary)]">
                                    Kontakt
                                </Link>
                            </li>
                           
                        </ul>
                    </div>
                    <div>
                        <ul className="space-y-2 text-sm font-bold mt-[3.25rem]">
                            <li>
                                <Link href="/faq" className="hover:text-[var(--primary)]">
                                    Časté dotazy
                                </Link>
                            </li>
                             <li>
                                <Link href="/privacy" className="hover:text-[var(--primary)]">
                                    Ochrana osobních údajů
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/20 pt-8 text-center text-sm font-bold">
                    <p>© 2026 Krajská Zdravotní a.s. Všechna práva vyhrazena.</p>
                </div>
            </div>
        </footer>
    );
}
