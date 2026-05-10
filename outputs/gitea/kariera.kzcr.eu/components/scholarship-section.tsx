'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { getAssetPath } from '@/lib/paths'
import { ClipboardList, Eye, Phone, Smartphone, Mail, Globe, ChevronDown, Download } from 'lucide-react'

type ScholarshipType = 'doctors' | 'nurses' | null

export default function ScholarshipSection() {
    const [active, setActive] = useState<ScholarshipType>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const toggle = (type: ScholarshipType) => {
        setActive(prev => prev === type ? null : type)
    }

    return (
        <div
            ref={containerRef}
            onMouseLeave={() => setActive(null)}
        >
            <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
                <h2 className="text-3xl font-bold sm:text-5xl mb-5">Stipendijní programy</h2>
                <p className="leading-relaxed mb-4 max-w-lg font-medium">
                    Podporujeme studenty lékařských i&nbsp;nelékařských oborů během jejich studia. Získejte finanční
                    podporu a&nbsp;jistotu budoucího uplatnění.
                </p>
                <p className="text-[var(--primary)] text-sm font-bold mb-6">
                    Pro akademický rok 2025/2026 jsme vypsaly tyto stipendijní programy:
                </p>

                <div className="space-y-3">
                    {/* Lékaři a farmaceuti */}
                    <div>
                        <button
                            onClick={() => toggle('doctors')}
                            onMouseEnter={() => setActive('doctors')}
                            className="w-full text-left cursor-pointer"
                        >
                            <div className={`flex items-start gap-4 p-4 bg-[var(--color-info-bg)] transition-all ${active === 'doctors' ? 'ring-2 ring-[var(--primary)]' : ''}`}>
                                <div className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center">
                                    <ClipboardList className="h-7 w-7 text-[var(--primary)]" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">Lékaři a&nbsp;farmaceuti</h4>
                                    <p className="text-sm mt-0.5">Pro studenty 4.–6. ročníků medicíny. Měsíční stipendium až 7&nbsp;000&nbsp;Kč.</p>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-[var(--primary)] shrink-0 mt-1 transition-transform duration-300 ${active === 'doctors' ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${active === 'doctors' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="bg-[var(--color-info-bg)]/50 px-4 pb-4 pt-4 space-y-2 text-sm border-t border-[var(--primary)]/10">
                                    <ul className="space-y-2 ml-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>6. ročník VŠ prezenčního studia se závazkem studia v&nbsp;jednom z&nbsp;vybraných oborů v&nbsp;oboru lékař – až <strong>150&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>4.&nbsp;a&nbsp;vyšší ročník VŠ prezenčního studia v&nbsp;oboru farmaceut – až <strong>100&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>4.&nbsp;a&nbsp;vyšší ročník VŠ prezenčního studia všeobecného lékařství a&nbsp;zubního lékařství – až <strong>100&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nelékařské zdravotnické obory */}
                    <div>
                        <button
                            onClick={() => toggle('nurses')}
                            onMouseEnter={() => setActive('nurses')}
                            className="w-full text-left cursor-pointer"
                        >
                            <div className={`flex items-start gap-4 p-4 bg-[var(--color-info-bg)] transition-all ${active === 'nurses' ? 'ring-2 ring-[var(--primary)]' : ''}`}>
                                <div className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center">
                                    <Eye className="h-7 w-7 text-[var(--primary)]" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">Nelékařské zdravotnické obory</h4>
                                    <p className="text-sm mt-0.5">Pro studenty ošetřovatelství, radiologie a&nbsp;dalších oborů. Podpora během celého studia.</p>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-[var(--primary)] shrink-0 mt-1 transition-transform duration-300 ${active === 'nurses' ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${active === 'nurses' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="bg-[var(--color-info-bg)]/50 px-4 pb-4 pt-4 space-y-2 text-sm border-t border-[var(--primary)]/10">
                                    <ul className="space-y-2 ml-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>1. ročník VŠ/VOŠ prezenčního studia v&nbsp;oborech všeobecná sestra, dětská sestra, radiologický asistent, zdravotnický záchranář – až <strong>50&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>3.&nbsp;a&nbsp;vyšší ročník SŠ prezenčního studia v&nbsp;oborech zdravotnický asistent, praktická sestra – až <strong>50&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>2.&nbsp;a&nbsp;vyšší ročník VŠ/VOŠ prezenčního studia v&nbsp;oborech všeobecná sestra, dětská sestra, porodní asistentka, zdravotnický záchranář, zdravotní laborant a&nbsp;radiologický asistent – až <strong>100&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[var(--primary)] mt-0.5">&#9658;</span>
                                            <span>4.&nbsp;a&nbsp;vyšší ročník VŠ nebo 1.&nbsp;a&nbsp;vyšší ročník navazujícího Mgr studia s&nbsp;předpokladem získání specializované způsobilosti v&nbsp;oborech psycholog a&nbsp;logoped – až <strong>100&nbsp;000&nbsp;Kč</strong></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-row gap-3">
                    <a
                        href="https://www.kzcr.eu/Data/Files/a7f5b4a8-2c4d-4d9a-acbf-76743475eef1-zadost-o-stipendium-lekar-farmaceut-2.docx?download=true&cname=%C5%BD%C3%A1dost%20o%20stipendium-L%C3%A9ka%C5%99_Farmaceut"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
                    >
                        <Download className="h-4 w-4 shrink-0" />
                        Žádost – Lékař
                    </a>
                    <a
                        href="https://www.kzcr.eu/Data/Files/a7f5b4a8-2c4d-4d9a-acbf-76743475eef1-zadost-o-stipendium-nelekar-4.doc?download=true&cname=%C5%BD%C3%A1dost%20o%20stipendium-Nel%C3%A9ka%C5%99"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
                    >
                        <Download className="h-4 w-4 shrink-0" />
                        Žádost – Nelékař
                    </a>
                </div>
            </div>

            {/* Right column – image */}
            <div className="relative h-[300px] lg:h-auto lg:self-stretch shadow-xl">
                <Image
                    src={getAssetPath("/stipend.webp")}
                    alt="Studenti medicíny"
                    fill
                    className="object-cover"
                />
            </div>
            </div>

            <div className="border-t border-slate-100 pt-6 mt-8 space-y-2">
                <p className="text-sm font-bold mb-3">Bližší informace lze získat v&nbsp;pracovních dnech:</p>
                <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-[var(--primary)] shrink-0" />
                    <span>+420&nbsp;477&nbsp;117&nbsp;952</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-[var(--primary)] shrink-0" />
                    <span>+420&nbsp;705&nbsp;622&nbsp;512</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-[var(--primary)] shrink-0" />
                    <span>nadacni.fond@kzcr.eu</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-[var(--primary)] shrink-0" />
                    <span>nf.kzcr.eu</span>
                </div>
            </div>

            <p className="mt-6 text-sm text-[var(--color-purple)] font-bold">
                Stipendijní programy pro následující akademický rok zveřejníme v&nbsp;červnu 2026.
            </p>
        </div>
    )
}
