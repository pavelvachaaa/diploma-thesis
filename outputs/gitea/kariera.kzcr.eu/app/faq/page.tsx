"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FaqItem {
    question: string;
    answer: string;
}

const faqData: FaqItem[] = [
    {
        question: "Jak se mohu ucházet o volnou pozici?",
        answer: "O volné pozice se můžete ucházet přímo přes formulář na stránce detailu konkrétní nabídky práce. Pokud jste nenašli vhodnou pozici, můžete nám zaslat svůj životopis prostřednictvím kontaktního formuláře na stránce Kontakt."
    },
    {
        question: "Jaké benefity Krajská zdravotní nabízí?",
        answer: "Nabízíme širokou škálu zaměstnaneckých benefitů, včetně náborových příspěvků, zvýhodněné dopravní karty Ústeckého kraje, dotovaného stravování, možnosti ubytování a stipendijních programů pro studenty. Více informací naleznete v sekci Benefity na úvodní stránce."
    },
    {
        question: "Kde najdu informace o stipendijních programech?",
        answer: "Podrobné informace o našich stipendijních programech pro studenty lékařských i nelékařských oborů naleznete v sekci Stipendia na úvodní stránce. Můžete se také obrátit na naše personální oddělení."
    },
    {
        question: "Mohu zaslat svůj životopis, i když není vypsaná žádná vhodná pozice?",
        answer: "Ano, samozřejmě! Vždy nás potěší, když projevíte zájem o práci v Krajské zdravotní. Svůj životopis nám můžete zaslat prostřednictvím kontaktního formuláře na stránce Kontakt. Budeme vás kontaktovat, jakmile se objeví vhodná příležitost."
    },
    {
        question: "Jaké nemocnice spadají pod Krajskou zdravotní?",
        answer: "Krajská zdravotní, a.s. sdružuje sedm nemocnic v Ústeckém kraji: Masarykova nemocnice v Ústí nad Labem, Nemocnice Děčín, Nemocnice Teplice, Nemocnice Most, Nemocnice Chomutov, Nemocnice Litoměřice a Nemocnice Rumburk. Jejich umístění si můžete prohlédnout na interaktivní mapě na úvodní stránce."
    },
    {
        question: "Jak mohu kontaktovat personální oddělení?",
        answer: "Specialistu náboru konkrétní nemocnice můžete kontaktovat telefonicky, e-mailem nebo prostřednictvím kontaktního formuláře na stránce Kontakt. Veškeré kontaktní údaje naleznete tamtéž."
    },
    {
        question: "Jaké jsou kontaktní údaje správce osobních údajů?",
        answer: "Správcem osobních údajů je Krajská zdravotní, a.s., IČ: 25488627, adresa: Sociální péče 3316/12a, 400 11 Ústí nad Labem – Severní Terasa. Telefon: +420 477 111 111, e-mail: sekretariat@kzcr.eu, ID datové schránky: 5gueuef."
    },
    {
        question: "Kdo je pověřenec pro ochranu osobních údajů (DPO)?",
        answer: "Pověřencem pro ochranu osobních údajů je Jobman, s.r.o., Ing. Michal Merta, MBA, MSc., LL.M. Kontaktní údaje: Adresa: Sedmidomky 456/2, Praha 10 – Michle, 101 00, Czech Republic. Tel. č.: +420 228 226 025, emailová adresa: dpo@kzcr.eu, datová schránka: tkyd8fz."
    },
    {
        question: "Jaký je dozorový úřad pro ochranu osobních údajů?",
        answer: "Dozorovým úřadem je Úřad pro ochranu osobních údajů, adresa: Pplk. Sochora 27, 170 00 Praha 7, tel.: 234 665 111, e-mail: posta@uoou.cz, www.uoou.cz."
    },
    {
        question: "Jaké jsou mé práva jako subjektu údajů dle GDPR?",
        answer: "Máte právo na přístup k osobním údajům, právo na opravu, právo na výmaz, právo na omezení zpracování, právo na přenositelnost údajů, právo vznést námitku, právo odvolat souhlas a právo podat stížnost k dozorovému úřadu. Podrobné informace naleznete na stránce Ochrana osobních údajů (GDPR)."
    },
    {
        question: "Jak mohu uplatnit svá práva týkající se zpracování osobních údajů?",
        answer: `Žádosti o výkon práv jsou přijímány:
        • v písemné podobě s úředně ověřeným podpisem a doručením poštou nebo osobně na podatelnu správce
        • v elektronické podobě opatřené kvalifikovaným elektronickým podpisem zaslané na emailovou adresu: sekretariat@kzcr.eu
        • prostřednictvím veřejné datové sítě z datové schránky žadatele do datové schránky správce. Id datové schránky je: 5gueuef
        • ústně do písemného protokolu u pověřence
        Podrobné informace naleznete na stránce Ochrana osobních údajů v patičce této stránky`
    }
];

export default function FaqPage() {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const handleQuestionSelect = (index: number) => {
        setSelectedIndex(index);
    };

    return (
        <div className="w-full min-h-screen bg-slate-50/30">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-20 bg-gradient-to-r from-[var(--color-info-bg)] to-blue-50 border-b">
                <div className="mx-auto max-w-7xl px-4 text-center">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-slate-900">
                        Často kladené dotazy
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Zde naleznete odpovědi na nejčastější otázky týkající se kariéry v Krajské zdravotní.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Questions List */}
                    <aside className="md:col-span-4 md:sticky top-28">
                        <Card className="shadow-md border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-xl">Témata dotazů</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <nav>
                                    <ul className="space-y-1">
                                        {faqData.map((item, index) => (
                                            <li key={index}>
                                                <Button
                                                    variant={selectedIndex === index ? "default" : "ghost"}
                                                    className={`w-full justify-start text-left h-auto py-3 px-4 font-normal whitespace-normal ${selectedIndex === index ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white" : "hover:bg-slate-100"}`}
                                                    onClick={() => handleQuestionSelect(index)}
                                                >
                                                    {item.question}
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Right Column: Answer Display */}
                    <div className="md:col-span-8">
                        <div className="space-y-8">
                            <Card className="shadow-lg border-slate-200">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-slate-900">{faqData[selectedIndex].question}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-slate-700 text-base leading-relaxed space-y-4">
                                    {faqData[selectedIndex].answer.split('\n').map((paragraph, i) => (
                                        <p key={i}>{paragraph}</p>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="mt-8 p-6 bg-blue-50/80 rounded-xl border border-blue-100 text-blue-900 shadow-sm flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
                                <HelpCircle className="h-16 w-16 sm:h-12 sm:w-12 text-[var(--primary)] shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Nenašli jste odpověď?</h3>
                                    <p className="text-blue-800/80 leading-relaxed mb-4">
                                        Pokud máte další otázky, neváhejte nás kontaktovat. Rádi vám pomůžeme.
                                    </p>
                                    <Link href="/kontaktuj-nas">
                                        <Button size="lg" className="btn-cta shadow-md">
                                            <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                                            Kontaktujte nás
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
