"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Phone, Mail, MapPin, Building, ShieldCheck, Scale, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
    return (
        <div className="w-full min-h-screen bg-slate-50/30">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-20 bg-gradient-to-r from-[var(--color-info-bg)] to-blue-50 border-b">
                <div className="mx-auto max-w-7xl px-4 text-center">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-slate-900">
                        Ochrana osobních údajů (GDPR)
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Informace o zpracování osobních údajů společností Krajská zdravotní, a.s.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
                <p className="text-lg text-slate-700 leading-relaxed">
                    Při zpracování osobních údajů Krajská zdravotní, a.s. (dále jen „správce“) postupuje vždy v souladu s nařízením Evropského parlamentu a Rady (EU) 2016/679 ze dne 27. dubna 2016 o ochraně fyzických osob v souvislosti se zpracováním osobních údajů a o volném pohybu těchto údajů a o zrušení směrnice 95/46/ES (obecné nařízení o ochraně osobních údajů (dále jen „GDPR“), se zákonem č. 110/2019 Sb., o zpracování osobních údajů v platném znění, a s příslušnými vnitrostátními předpisy upravujícími oblast ochrany osobních údajů nebo regulujícími činnost správce. V této souvislosti správce informuje o podrobnostech zpracování osobních údajů a o právech subjektu údajů. V případě, že tyto informace budou nedostačující, lze se obrátit na pověřence pro ochranu osobních údajů (dále jen „DPO“) s níže uvedenými kontaktními údaji.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="https://www.kzcr.eu/Data/Files/c9c72500-6f62-443f-92dd-d999ebb64bc9-kz01_fo0011-zadost-o-uplatneni-prav-subjektu-udaju-dle-gdpr-1_.doc?download=true&cname=Formulář%20pro%20uplatnění%20práv%20dle%20GDPR" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Formulář pro uplatnění práv (DOC)
                        </Button>
                    </Link>
                    <Link href="https://www.kzcr.eu/Data/Files/c79d9a51-f689-4c10-abfe-114730d23506-informace-o-zpracovani-osobnich-udaju-2.pdf?download=true&cname=Informace%20o%20zpracování%20osobních%20údajů%20(GDPR)" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Informace o zpracování údajů (PDF)
                        </Button>
                    </Link>
                </div>

                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-[var(--primary)]" />
                            Webová analytika kariérního portálu
                        </CardTitle>
                        <CardDescription>
                            Anonymní statistiky návštěvnosti a používání webu kariera.kzcr.eu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-slate-700">
                        <p>
                            Pro web <strong>kariera.kzcr.eu</strong> používáme analytický nástroj Umami provozovaný interně společností Krajská zdravotní, a.s. za účelem měření návštěvnosti, výkonu náborového webu a vyhodnocení používání jednotlivých částí kariérního portálu.
                        </p>
                        <p>
                            V rámci této analytiky sledujeme pouze anonymní statistické údaje o návštěvách a interakcích, například zobrazení stránek, použití filtrů nabídek práce nebo úspěšné odeslání formuláře. Do analytiky nejsou předávány osobní údaje, jako jsou jméno, e-mail, telefon, adresa nebo obsah nahraných dokumentů.
                        </p>
                        <p>
                            Tato implementace sama o sobě nezavádí nové marketingové cookies. Pokud by se rozsah analytiky v budoucnu změnil, budou tyto informace odpovídajícím způsobem aktualizovány.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-[var(--primary)]" />
                            Informace pro uchazeče o zaměstnání podle čl. 13 GDPR
                        </CardTitle>
                        <CardDescription>
                            Samostatné informační sdělení pro reakce na pracovní pozice a zařazení do databáze zájemců
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-slate-700">
                        <div className="space-y-3">
                            <p>
                                Toto sdělení se vztahuje na osobní údaje poskytované prostřednictvím kariérního portálu
                                <strong> kariera.kzcr.eu</strong>, zejména při reakci na konkrétní pracovní pozici a při dobrovolném zařazení do databáze zájemců o zaměstnání u Krajské zdravotní, a.s.
                            </p>
                            <p>
                                Správcem osobních údajů je Krajská zdravotní, a.s. Kontaktní údaje správce, pověřence pro ochranu osobních údajů a dozorového úřadu jsou uvedeny v oddílech I až III této stránky.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3">Kategorie zpracovávaných údajů</h3>
                            <p>
                                Zpracováváme zejména identifikační a kontaktní údaje, údaje uvedené v životopisu, motivačním dopisu a dalších přílohách, údaje o vzdělání, kvalifikaci, praxi, předchozím zaměstnání, preferované pozici a lokalitě, obsah vzájemné komunikace a technické údaje nezbytné pro bezpečný provoz webu. Zvláštní kategorie osobních údajů neposkytujte, pokud nejsou pro konkrétní pozici nebo splnění právní povinnosti nezbytné.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3">Účely zpracování a právní základy</h3>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-900">
                                        <tr>
                                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Účel zpracování</th>
                                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Právní základ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-slate-100">
                                        <tr>
                                            <td className="px-4 py-3">Vyřízení reakce na konkrétní pracovní pozici</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. b) GDPR</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Komunikace s uchazečem v rámci vyřízení reakce na konkrétní pozici</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. b) GDPR</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Ověření kvalifikace, praxe a splnění předpokladů pro konkrétní pozici</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. b) GDPR</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Ověření splnění zákonných předpokladů pro výkon práce, pokud to vyžaduje právní předpis</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. c) GDPR</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Uchování údajů pro budoucí pracovní nabídky v databázi zájemců</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. a) GDPR - souhlas</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Ochrana právních nároků správce</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. f) GDPR</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Technické zajištění provozu webu a bezpečnostní logy</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. f) GDPR</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Webová analytika kariérního portálu v rozsahu základních agregovaných statistik bez cookies a bez identifikace uchazeče</td>
                                            <td className="px-4 py-3">čl. 6 odst. 1 písm. f) GDPR - oprávněný zájem správce na měření návštěvnosti, funkčnosti a používání kariérního portálu</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Analytika je nastavena bez cookies a bez identifikace návštěvníků. Do analytiky nejsou předávány osobní údaje z formulářů ani obsah nahraných dokumentů.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3">Doba uchování</h3>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-900">
                                        <tr>
                                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Účel</th>
                                            <th className="border-b border-slate-200 px-4 py-3 font-semibold">Doba uchování</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-slate-100">
                                        <tr>
                                            <td className="px-4 py-3">Reakce na konkrétní pracovní pozici</td>
                                            <td className="px-4 py-3">po dobu výběrového řízení a následně nejdéle 6 měsíců po jeho ukončení pro ochranu právních nároků</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Databáze zájemců / talent pool</td>
                                            <td className="px-4 py-3">12 měsíců od udělení souhlasu nebo poslední aktualizace profilu</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Vybraný uchazeč</td>
                                            <td className="px-4 py-3">údaje nezbytné pro vznik pracovního poměru jsou převedeny do personální agendy</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Uplatněný nárok, spor nebo kontrola</td>
                                            <td className="px-4 py-3">po dobu nezbytnou k ochraně práv a splnění zákonných povinností</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Příjemci a zpracovatelé</h3>
                                <p>
                                    Osobní údaje mohou být zpřístupněny pověřeným zaměstnancům správce, personalistům, vedoucím zaměstnancům zapojeným do výběrového řízení, personálního nebo náborového systému a IT podpory. Údaje mohou být předány také orgánům veřejné moci, pokud to vyžaduje právní předpis nebo ochrana práv správce.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Předávání mimo EU/EHP</h3>
                                <p>
                                    U kariérního portálu nedochází k předávání osobních údajů mimo Evropskou unii ani Evropský hospodářský prostor. Pokud by v budoucnu mělo dojít k předání osobních údajů do třetí země nebo mezinárodní organizaci, bude takové předání provedeno pouze za podmínek stanovených GDPR a při zajištění odpovídajících záruk.                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Automatizované rozhodování</h3>
                                <p>
                                    Při náboru nedochází k rozhodování založenému na automatizovaném zpracování ani k profilování s právními nebo obdobně významnými účinky pro uchazeče.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-3">Souhlas a jeho odvolání</h3>
                                <p>
                                    Souhlas je vyžadován pouze pro zařazení do databáze zájemců za účelem kontaktování s vhodnou pracovní nabídkou. Souhlas lze kdykoliv odvolat na adrese <Link href="mailto:dpo@kzcr.eu" className="text-[var(--primary)] hover:underline">dpo@kzcr.eu</Link> nebo prostřednictvím kontaktní osoby personálního oddělení. Odvoláním souhlasu není dotčena zákonnost zpracování před jeho odvoláním.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section I */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <Building className="h-6 w-6 text-[var(--primary)]" />
                            I. Správce osobních údajů
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-slate-700">
                        <p><strong>Název subjektu:</strong> Krajská zdravotní, a.s.</p>
                        <p><strong>IČ:</strong> 25488627</p>
                        <p><strong>Adresa:</strong> Sociální péče 3316/12a, 400 11 Ústí nad Labem – Severní Terasa</p>
                        <p><strong>Telefonní číslo:</strong> +420 477 111 111</p>
                        <p><strong>Číslo faxu:</strong> +420 477 114 900</p>
                        <p><strong>ID datové schránky:</strong> 5gueuef</p>
                        <p><strong>e-mailová adresa:</strong> <Link href="mailto:sekretariat@kzcr.eu" className="text-[var(--primary)] hover:underline">sekretariat@kzcr.eu</Link></p>
                        <p className="mt-4">
                            Společnost je vedená u Krajského soudu v Ústí nad Labem pod spisovou značkou B 1550. Odštěpné závody: Masarykova nemocnice v Ústí nad Labem; pracoviště Rumburk Nemocnice Děčín Nemocnice Chomutov Nemocnice Most Nemocnice Teplice Nemocnice Litoměřice (dále jen „správce“) Správce jako největší akciová společnost v oblasti zdravotnictví, sdružující 7 nemocnic v Ústeckém kraji, poskytuje základní, specializovanou a super specializovanou zdravotní péči a služby v lékařských oborech, formou ambulantní a lůžkové péče pro děti, dospělé a seniory.
                        </p>
                    </CardContent>
                </Card>

                {/* Section II */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-[var(--primary)]" />
                            II. Pověřenec pro ochranu osobních údajů
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-slate-700">
                        <p><strong>Jobman, s.r.o.</strong></p>
                        <p><strong>Ing. Michal Merta, MBA, MSc., LL.M</strong></p>
                        <p><strong>Adresa:</strong> Sedmidomky 456/2, Praha 10 – Michle, 101 00, Czech Republic</p>
                        <p><strong>Tel. č.:</strong> +420 228 226 025</p>
                        <p><strong>emailová adresa:</strong> <Link href="mailto:dpo@kzcr.eu" className="text-[var(--primary)] hover:underline">dpo@kzcr.eu</Link></p>
                        <p><strong>datová schránka:</strong> tkyd8fz</p>
                    </CardContent>
                </Card>

                {/* Section III */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <Scale className="h-6 w-6 text-purple-600" />
                            III. Dozorový úřad pro ochranu osobních údajů
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-slate-700">
                        <p><strong>Úřad pro ochranu osobních údajů</strong></p>
                        <p><strong>Adresa:</strong> Pplk. Sochora 27, 170 00 Praha 7</p>
                        <p><strong>tel.:</strong> 234 665 111</p>
                        <p><strong>e-mail:</strong> <Link href="mailto:posta@uoou.cz" className="text-[var(--primary)] hover:underline">posta@uoou.cz</Link></p>
                        <p><strong>www:</strong> <Link href="http://www.uoou.cz" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">www.uoou.cz</Link></p>
                    </CardContent>
                </Card>

                {/* Section IV */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">IV. Rozsah zpracování osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>
                            Osobní údaje jsou zpracovány v rozsahu, v jakém je příslušný subjekt údajů správci poskytl, a to v souvislosti s uzavřením smluvního či jiného právního vztahu se správcem, nebo které správce shromáždil jinak a zpracovává je v souladu s platnými právními předpisy v rozsahu nezbytně nutném pro splnění účelu, pro který jsou osobní údaje zpracovávány.
                        </p>
                    </CardContent>
                </Card>

                {/* Section V */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">V. Zdroje osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>Osobní údaje jsou správcem získávány zejména z následujících zdrojů:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                            <li>od subjektů údajů, zejména v rámci registrace, v souvislosti s poskytováním zdravotních služeb a vedením zdravotnické dokumentace, kontaktních formulářů, vizitek, z dotazníků, životopisů, motivačního dopisu, aj., formou ústní, písemnou, emaily, telefonicky, webových stránek apod.</li>
                            <li>jiným způsobem, zejména z veřejně přístupných rejstříků, seznamů a evidencí (např. obchodní rejstřík, živnostenský rejstřík, katastr nemovitostí, zdravotní registry apod.)</li>
                            <li>z obchodních vztahů, vztahů spolupracujících subjektů na základě smluvních vztahů apod.</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Section VI */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">VI. Kategorie osobních údajů, které jsou předmětem zpracování</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>Správce o subjektu údajů zpracovává zejména tyto osobní údaje, které jsou nezbytné pro výkon povinností správce:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                            <li>adresní a identifikační údaje sloužící k jednoznačné a nezaměnitelné identifikaci subjektu údajů (např. jméno, příjmení, titul, příp. rodné číslo, datum narození, adresa trvalého pobytu, IČ, DIČ) a údaje umožňující kontakt se subjektem údajů (kontaktní údaje např. kontaktní adresa, číslo telefonu, číslo faxu, e-mailová adresa a jiné obdobné informace)</li>
                            <li>osobní údaje zpracovávané v rámci poskytování zdravotních služeb (údaje o zdravotním stavu, údaje potřebné ke stanovení diagnózy a postupu léčení, údaje předávané do Národních zdravotních registrů)</li>
                            <li>popisné údaje (např. bankovní spojení)</li>
                            <li>další údaje nezbytné pro plnění smluvních povinností</li>
                            <li>údaje poskytnuté nad rámec příslušných zákonů správce zpracovává v rámci uděleného souhlasu ze strany subjektu údajů (zpracování fotografií, použití osobních údajů za účelem personálních záležitostí, např. pro účely příspěvku k penzijnímu připojištění, zpracování údajů v rámci vědeckovýzkumných projektů, aj.). Osobní údaje zpracovávané se souhlasem subjektu údajů jsou specifikovány vždy v konkrétním souhlasu se zpracováním osobních údajů, který je udělen</li>
                            <li>záznamy z kamerového systému (videozáznamy)</li>
                            <li>finanční informace (úhrada placených služeb, doplatky za léky apod.)</li>
                            <li>pořizování záznamů telefonních hovorů na vybraných telefonních číslech (urgentní příjmy, MET linky, helpdesk, linky na operačním středisku). Informace o pořízení záznamu je sdělována na příslušném čísle před zahájením hovoru</li>
                            <li>údaje související s uzavřením pracovněprávního poměru</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Section VII */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">VII. Kategorie subjektů údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>pacient</li>
                            <li>zaměstnanec</li>
                            <li>příbuzný, osoba blízká pacientům, zákonný zástupce, poručník, opatrovník</li>
                            <li>dobrovolník</li>
                            <li>osoba procházející areály nemocnic monitorovaných kamerovým systémem</li>
                            <li>osoba vstupující do neveřejných částí budov</li>
                            <li>zaměstnanec využívající ubytovací službu</li>
                            <li>osoba volající (nebo volaná) na monitorované telefonní linky</li>
                            <li>sponzor a dárce</li>
                            <li>osoba přistupující na webové stránky</li>
                            <li>obchodní partner, dodavatel</li>
                            <li>student nebo lékař na praxi</li>
                            <li>uchazeč o zaměstnání</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Section VIII */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">VIII. Kategorie osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700 space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">1. Pacient</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>osobní údaje potřebné ke zjištění identity (data narození, rodná čísla a jména, údaje o zdravotním pojištění)</li>
                                <li>osobní údaje potřebné pro komunikaci (bydliště, příbuzní nebo osoby blízké, u dětí jména rodičů, opatrovníků, poručníků, zákonných zástupců, telefon, e-mail)</li>
                                <li>anamnestické údaje, potřebné ke stanovení diagnózy a postupu léčení, včetně subjektivního popisu aktuálního zdravotního stavu</li>
                                <li>přijaté osobní údaje o pacientech od jiných poskytovatelů, od dopravní služby, od záchranné služby</li>
                                <li>objektivně zjištěné údaje o zdravotním stavu, získané přímými vyšetřovacími a diagnostickými postupy</li>
                                <li>objektivně zjištěné údaje o zdravotním stavu, získané přístrojovými vyšetřeními těla pacienta (záznamy křivek EKG, EEG, EMG, rentgenové a ultrazvukové snímky, záznamy ze speciálních vyšetřovacích přístrojů, snímky těla apod.)</li>
                                <li>objektivně zjištěné údaje o zdravotním stavu, získané laboratorními vyšetřeními biologických vzorků (hodnoty z tělních tekutin, stěrů, odběrů tkání, dechu, genetické výsledky na úrovni molekulární genetiky atd.)</li>
                                <li>stanovená hlavní a vedlejší diagnóza, klasifikace pro systém DRG</li>
                                <li>informace o léčivech formou elektronického receptu</li>
                                <li>plány zdravotnických činností (plán léčby, plán ošetřovatelské péče apod.)</li>
                                <li>popisy zdravotnických činností (záznam o ambulantním vyšetření, operační protokol, dekurz, epikríza, plán léčby, plán ošetřovatelské péče apod.)</li>
                                <li>popisy výsledku péče (např. propouštěcí zpráva)</li>
                                <li>zdravotní výkony pro proplacení úhrady poskytovateli za jejich provedení zdravotní pojišťovnou</li>
                                <li>finanční informace (úhrada placených služeb, doplatky za léky apod.)</li>
                                <li>záznamy z kamerového systému</li>
                                <li>Kázetka (aplikace sloužící k rezervaci léků a komunikaci pacienta s lékárníkem, kterou provozuje správce osobních údajů)</li>
                                <li>evidence identifikačních údajů osoby při vstupu do neveřejných objektů</li>
                                <li>záznamy telefonních hovorů na vybraných telefonních číslech</li>
                                <li>registrační značky vozidel v areálech nemocnic</li>
                                <li>údaje o zaměstnavateli a profesi v případě vystavení pracovní neschopnosti</li>
                                <li>podrobný rozpis kategorií osobních údajů, které je správce povinen zpracovávat na základě Zákona o zdravotních službách v rámci poskytování zdravotních služeb (část šestá a Příloha k zákonu č. 372/2011 Sb. a vyhláška č. 98/2012 Sb.)</li>
                                <li>v případě, že jsou splněny podmínky pro předání údajů do Národních zdravotních registrů, které spravuje Ústav zdravotnických informací a statistiky ČR (ÚZIS), jsou zpracovávány další kategorie osobních údajů. Jejich rozsah se liší v závislosti, o jaký národní zdravotní registr se jedná. Rozsah údajů je stanoven v příloze k zákonu č. 372/2011 Sb., o zdravotních službách</li>
                                <li>fotografie a videozáznamy pro účely porovnání stavu pacienta před a po rekonstrukci</li>
                                <li>fotografie a videozáznamy pro účely prezentace a propagace správce osobních údajů</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">2. Zaměstnanec</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>identifikační údaje, tj. jméno včetně titulů, RČ, číslo občanského průkazu, pasu, řidičského průkazu, číslo bankovního účtu, identifikátor datové schránky</li>
                                <li>kontaktní osobní údaje – bydliště (trvalé, přechodné), rodinní příslušníci, telefonní čísla, emailové adresy</li>
                                <li>vzdělání – vysvědčení, diplomy, doklady o odborných kurzech a školeních apod.</li>
                                <li>profesní životopis včetně pracovních posudků</li>
                                <li>pracovní zařazení – zastávaná funkce, pracoviště</li>
                                <li>aktivity pracovní a s prací související – prováděné výkony, zařazení do směn a služeb</li>
                                <li>přístupy do počítačových systémů, nastavení přístupů ke konkrétním zpracovávaným osobním údajům</li>
                                <li>přístupy do chráněných prostor</li>
                                <li>evidence docházky a pracovní doby</li>
                                <li>závodní stravování – objednávky a platby</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">3. Příbuzný, osoba blízká pacientům, poručník, opatrovník, zákonný zástupce</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>identifikační údaje – jméno, příjmení</li>
                                <li>kontaktní údaje – bydliště, telefon, e-mail, faxové číslo</li>
                                <li>dílčí údaje o zdravotním stavu (v rodinné anamnéze pacienta, je-li to zapotřebí)</li>
                                <li>v případě, že jsou splněny podmínky pro předání údajů do Národních zdravotních registrů, které spravuje Ústav zdravotnických informací a statistiky ČR (ÚZIS), jsou zpracovávány další kategorie osobních údajů. Jejich rozsah se liší v závislosti, o jaký národní zdravotní registr se jedná. Rozsah údajů je stanoven v příloze k zákonu č. 372/2011 Sb., o zdravotních službách. Jedná se např. o rodinnou anamnézu</li>
                                <li>záznamy z kamerového systému</li>
                                <li>evidence identifikačních údajů osoby při vstupu do neveřejných objektů</li>
                                <li>záznamy telefonních hovorů na vybraných telefonních číslech</li>
                                <li>registrační značka vozidla</li>
                                <li>fotografie a videozáznamy z prezentačních nebo dobrovolnických akcí pořádaných správcem osobních údajů</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">4. Dobrovolník</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>identifikační údaje – jméno, příjmení, datum narození</li>
                                <li>kontaktní údaje – bydliště, telefon, e-mail</li>
                                <li>identifikace zástupců vysílající organizace</li>
                                <li>záznamy z kamerového systému</li>
                                <li>evidence identifikačních údajů osoby při vstupu do neveřejných objektů fotografie z různých akcí (např. vánoční besídky, konference apod.)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">5. Osoba procházející areálem správce a budovami monitorovanými kamerovým záznamem</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>videozáznam postavy a obličeje. Pořízené záběry jsou využívány k identifikaci fyzických osob v souvislosti s určitým jednáním</li>
                                <li>vozidlo a jeho reg. značka, kterým přijela osoba do areálů nemocnic</li>
                            </ul>
                            <p className="mt-2">
                                Osobní údaje z kamerového systému spravuje pouze správce. Mohou být poskytnuty v případě žádosti státním orgánům, resp. orgánům veřejné moci, tj. soudům, orgánům činným v trestním řízení, orgánům ve správním řízení, popř. jiným dotčeným subjektům pro naplnění účelu zpracování, např. komerční pojišťovně.
                            </p>
                            <p className="mt-2">
                                Doba uchovávání kamerových záznamů jsou 4 dny, poté jsou data smazána. V případě, že by kamerové záznamy měly sloužit jako důkazní prostředek, mohou být kopie záznamu uchovávány déle.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">6. Osoba vstupující do neveřejných částí budov</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>jména osoby vstupující do objektu, datum a čas vstupu, cíl a účel vstupu</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">7. Zaměstnanec využívající ubytovací služby</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>jméno, příjmení, adresa bydliště, telefon, email, datum narození, číslo občanského průkazu, profese, bankovní spojení</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">8. Osoba volající (nebo volaná) na monitorované telefonní linky</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>volající (volané) telefonní číslo, kontaktní údaje (dle potřeby), zdravotní údaje – dle důvodu volání, jiné údaje ovlivňující vyžádání služby, obsah hovoru</li>
                                <li>údaje se zpracovávají formou záznamu telefonního hovoru</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">9. Sponzor a dárce</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>kontaktní údaje (jméno, bydliště, datum narození, telefon, e-mail, IČ a DIČ OSVČ)</li>
                                <li>bankovní spojení, číslo účtu</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">10. Osoba přistupující na webové stránky</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Kariérní portál, kariera.kzcr.eu, nepoužívá analytické ani marketingové cookies.</li>
                                <li>kzcr.eu - technické a analytické cookies, zejména za účelem zajištění komfortního procházení webu a analýzy návštěvnosti stránek</li>
                                <li>Kázetka – aplikace, která slouží pacientům pro komunikaci s lékárnou a k rezervaci léků</li>
                                <li>Portál pacienta – aplikace, přes něhož se pacient může např. objednat k lékaři</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">11. Obchodní partner, dodavatel</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>kontaktní údaje (jméno, adresa, telefon, e-mail, IČ a DIČ OSVČ)</li>
                                <li>platební údaje (bankovní spojení, číslo účtu)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">12. Student nebo lékař na praxi</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>kontaktní údaje (jméno, adresa, telefon, e-mail)</li>
                                <li>dosažené vzdělání (vysvědčení, doklady prokazující vzdělání nebo praxi studenta)</li>
                                <li>způsobilost k vykonání praxe (očkování, potvrzení od lékaře)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">13. Uchazeč o zaměstnání</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>kontaktní údaje (jméno, adresa, telefon, email)</li>
                                <li>dosažené vzdělání, praxe (doklady prokazující vzdělání nebo praxi, CV)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Section IX */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">IX. Kategorie příjemců osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>zdravotní pojišťovny v rozsahu nezbytném pro vyúčtování zdravotní péče</li>
                            <li>jiní poskytovatelé zdravotních a sociálních služeb, např. praktický lékař pacienta, jiný poskytovatel, laboratoře</li>
                            <li>v mezích své pracovní náplně příslušní lékaři a nelékařští zdravotničtí pracovníci, např. zdravotní sestry, porodní asistentky, ergoterapeuti, radiologičtí asistenti, zdravotní laboranti, farmaceutičtí asistenti atd., a v nezbytném rozsahu další zaměstnanci, kteří mají dle své pracovní náplně a vnitřních předpisů oprávnění k manipulaci s těmito záznamy</li>
                            <li>pacienti, jichž se osobní údaje týkají</li>
                            <li>státní a jiné orgány v rámci plnění zákonných povinností stanovených příslušnými právními předpisy, např. Ústav zdravotnických informací a statistiky ČR, Státní ústav pro kontrolu léčiv, Státní ústav pro jadernou bezpečnost, Úřad pro ochranu osobních údajů, Národní úřad pro kybernetickou a informační bezpečnost, Policie ČR, soudy, orgány činné v trestním řízení, orgány sociálního zabezpečení, Úřad práce, obecní úřady, exekutor, orgán sociálně-právní ochrany dětí apod.</li>
                            <li>osoby ve smluvním vztahu, např. zpracovatelé osobních údajů</li>
                            <li>zákonní zástupci nezletilých, opatrovníci, poručníci</li>
                            <li>se souhlasem pacienta nebo na jeho písemný pokyn mohou být osobní údaje poskytnuty dalším subjektům</li>
                            <li>další příjemci, např. předání osobních údajů do zahraničí – státy EU, třetí země, a to dle příslušných právních předpisů nebo uděleného souhlasu subjektu údajů</li>
                            <li>osoby oprávněné nahlížet do zdravotnické dokumentace podle zákona č. 372/2011 Sb., o zdravotních službách</li>
                            <li>studenti středních a vysokých škol, vzdělávajících se u správce, pod dohledem vyučujícího, a to pouze pokud s tím pacient předem vyslovil souhlas a pouze v nejnutnějším rozsahu</li>
                            <li>lékaři na praxi</li>
                            <li>pojišťovny z titulu pracovních úrazů a nemocí z povolání zaměstnanců</li>
                            <li>soudní znalci, např. při vedení soudního sporu</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Section X */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">X. Účel zpracování osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>Správce zpracovává osobní údaje zejména z následujících důvodů:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                            <li>za účelem poskytnutí zdravotních služeb (ambulantní, lůžková a následná péče, poskytnutí léků a jiných přípravků, laboratorní zpracování biologického materiálu, poskytnutí rehabilitační péče apod.)</li>
                            <li>za účelem obsaženým v rámci uděleného souhlasu subjektem údajů. Konkrétní účel je specifikován podle povahy a rozsahu v příslušném textu souhlasu, se kterým je subjekt údajů seznámen</li>
                            <li>v rámci obchodních vztahů a jednání o smluvním vztahu, plnění smlouvy. Účelem zpracování osobních údajů je adekvátní plnění předmětu smlouvy a spolupráce se smluvní stranou, jedná se zejména o emailové adresy, jména a příjmení kontaktních osob</li>
                            <li>za účelem ochrany práv správce, příjemce nebo jiných dotčených osob (např. soudní spory, záznamy z kamerového systému pro ochranu majetku správce, kontinuity informací, obezřetnosti, zajištění potřeb, ochrany zdraví pacientů, kontrolních mechanismů nebo jiných opatření nezbytných pro zajištění fungování správce)</li>
                            <li>za účelem vedení archivnictví na základě platných právních předpisů a vnitřních předpisů správce</li>
                            <li>za účelem vedení personální agendy, za účelem výběrových řízení na volná pracovní místa, vzdělávání zdravotnického personálu</li>
                            <li>uzavření pracovněprávního vztahu, vedení mzdové agendy, podání daňového přiznání</li>
                            <li>v rámci jednání před orgány státní správy</li>
                            <li>za účelem plnění zákonných povinností ze strany správce</li>
                            <li>za účelem ochrany životně důležitých zájmů subjektu údajů</li>
                            <li>za účelem poskytování zdravotní dopravní služby</li>
                            <li>za účelem realizace dobrovolnického programu, stáží</li>
                            <li>pro některé vědecko-výzkumné účely</li>
                            <li>poskytování stravování</li>
                            <li>prezentace společnosti</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Section XI */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XI. Způsob zpracování</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>
                            Zpracování osobních údajů provádí správce nebo zpracovatel. Zpracování je prováděno jednotlivými pověřenými a proškolenými zaměstnanci správce, anebo zaměstnanci zpracovatele. Ke zpracování dochází prostřednictvím výpočetní techniky, popř. i manuálním způsobem u osobních údajů v listinné podobě za dodržení všech bezpečnostních zásad pro správu a zpracování osobních údajů.
                        </p>
                    </CardContent>
                </Card>

                {/* Section XII */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XII. Doba zpracování osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>
                            Doba zpracování je odvislá od lhůt uvedených v příslušných právních předpisech, ve spisovém a skartačním řádu správce, v příslušných smlouvách, nebo doby plynoucí ze souhlasu subjektu údajů.
                        </p>
                    </CardContent>
                </Card>

                {/* Section XIII */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XIII. Zabezpečení osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>
                            Správce zpracovává osobní údaje způsobem, který zajišťuje odpovídající zabezpečení osobních údajů, včetně ochrany před neoprávněným nebo nezákonným zpracováním a před náhodnou ztrátou, zničením nebo poškozením, a to za použití vhodných technicko organizačních opatření. Správce se řídí právními předpisy, směrnicemi, provozními postupy, které se týkají ochrany, důvěrnosti a zabezpečení osobních údajů, a pravidelně přezkoumává vhodnost zavedených opatření, aby bylo zachována bezpečnost osobních údajů. Správce přijímá přiměřená opatření, aby bylo zajištěno, že osobní údaje, které správce zpracovává, jsou přesné a aktualizované. Nepřesné nebo neúplné osobní údaje, s ohledem na účely, pro které jsou zpracovávány, jsou neprodleně vymazány, opraveny nebo doplněny. Správce přijal přiměřená opatření, aby bylo zajištěno, že rozsah osobních údajů, které jsou zpracovávány, je přiměřeně nezbytný v souvislosti s účely uvedenými v tomto dokumentu.
                        </p>
                    </CardContent>
                </Card>

                {/* Section XIV */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XIV. Zákonnost zpracování</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700">
                        <p>Správce zpracovává údaje se souhlasem subjektu údajů s výjimkou zákonem stanovených případů, kdy zpracování osobních údajů nevyžaduje souhlas subjektu údajů.</p>
                        <p className="mt-2">V souladu s čl. 6 odst. 1 GDPR je zpracování údaje zákonné pokud:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                            <li>subjekt údajů udělil souhlas pro jeden či více konkrétních účelů</li>
                            <li>zpracování je nezbytné pro splnění smlouvy, jejíž smluvní stranou je subjekt údajů, nebo pro provedení opatření přijatých před uzavřením smlouvy na žádost tohoto subjektu údajů</li>
                            <li>zpracování je nezbytné pro splnění právní povinnosti, která se na správce vztahuje</li>
                            <li>zpracování je nezbytné pro ochranu životně důležitých zájmů subjektu údajů nebo jiné fyzické osoby</li>
                            <li>zpracování je nezbytné pro splnění úkolu prováděného ve veřejném zájmu nebo při výkonu veřejné moci, kterým je pověřen správce</li>
                            <li>zpracování je nezbytné pro účely oprávněných zájmů příslušného správce či třetí strany, kromě případů, kdy před těmito zájmy mají přednost zájmy nebo základní práva a svobody subjektu údajů vyžadující ochranu osobních údajů</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Section XV */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XV. Práva subjektů údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700 space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">1) Právo na přístup k osobním údajům a k následujícím informacím o:</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>účelu zpracování</li>
                                <li>kategorii dotčených osobních údajů</li>
                                <li>příjemci nebo kategorie příjemců, kterým osobní údaje byly nebo budou zpřístupněny</li>
                                <li>plánované době, po kterou budou osobní údaje uloženy</li>
                                <li>zdroji osobních údajů</li>
                                <li>skutečnosti, zda dochází k automatizovanému rozhodování, včetně profilování</li>
                                <li>délce sběru a zpracování</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">2) Právo na opravu</h3>
                            <p>Pokud se subjekt údajů domnívá, že osobní údaje, které jsou o něm zpracovávány, jsou nepřesné či jinak neodpovídají skutečnosti.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">3) Právo na výmaz</h3>
                            <p>Takové žádosti lze obecně vyhovět pouze v případě, kdy předmětné osobní údaje:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>není správce povinen zpracovávat z titulu plnění povinností vyplývajících z platných právních předpisů či smlouvy</li>
                                <li>které již správce nepotřebuje pro určení, výkon nebo obhajobu právních nároků</li>
                                <li>poté, co byla vznesena námitka proti zpracování, a správce shledal, že jeho oprávněný zájem na zpracování těchto osobních údajů pominul</li>
                                <li>osobní údaje byly zpracovávány na základě poskytnutého souhlasu, který byl subjektem údajů odvolán</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">4) Právo na omezení zpracování, které lze uplatnit zejména v těchto případech:</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>subjekt údajů popírá přesnost zpracování osobních údajů</li>
                                <li>zpracování je protiprávní a subjekt údajů odmítá výmaz osobních údajů a žádá místo toho o omezení jejich použití</li>
                                <li>osobní údaje již správce nepotřebuje pro účely zpracování, ale subjekt údajů je požaduje pro určení, výkon a obhajobu právních nároků</li>
                                <li>subjekt údajů vznesl námitku proti zpracování a zatím nebylo ověřeno, zda oprávněné zájmy správce převažují nad zájmy nebo základními právy a svobodami subjektu údajů</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">5) Právo na přenositelnost údajů</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>předmětem tohoto práva jsou pouze ty osobní údaje, které správce zpracovává na základě souhlasu subjektu údajů, anebo plnění smlouvy</li>
                                <li>tyto údaje na žádost poskytne správce v elektronické strukturované podobě</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">6) Právo vznést námitku</h3>
                            <p>Toto právo lze uplatnit v případech zpracování osobních údajů na základě oprávněného zájmu správce nebo na základě veřejného zájmu.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">7) Právo odvolat souhlas</h3>
                            <p>Toto právo může subjekt údajů uplatnit v případech zpracování osobních údajů, k jejichž zpracování dostal správce nebo zpracovatel od subjektu údajů souhlas a pokud neexistuje jiný účel zpracování, pro který se musí osobní údaje zpracovávat.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">8) Právo podat stížnost k dozorovému úřadu</h3>
                            <p>Pokud se subjekt údajů domnívá, že zpracováním jeho osobních údajů došlo k porušení právních předpisů, má právo podat stížnost u dozorového úřadu, zejména v členském státě Evropské unie jeho obvyklého bydliště, místa výkonu zaměstnání nebo místa, kde došlo k údajnému porušení.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">9) Právo nebýt předmětem rozhodnutí založeného výhradně na automatizovaném zpracování včetně profilování</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Section XVI - Contact for info */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XVI. Kam se může subjekt údajů obrátit pro další informace, nebo kde může uplatnit svá práva ve vztahu ke zpracování osobních údajů</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700 space-y-4">
                        <p>Žádosti o výkon práv ve vztahu ke zpracování osobních údajů jsou přijímány:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>v písemné podobě s úředně ověřeným podpisem a doručením poštou nebo osobně na podatelnu správce</li>
                            <li>v elektronické podobě opatřené kvalifikovaným elektronickým podpisem zaslané na emailovou adresu: <Link href="mailto:sekretariat@kzcr.eu" className="text-[var(--primary)] hover:underline">sekretariat@kzcr.eu</Link></li>
                            <li>prostřednictvím veřejné datové sítě z datové schránky žadatele do datové schránky správce. Id datové schránky je: 5gueuef</li>
                            <li>ústně do písemného protokolu u pověřence</li>
                        </ul>
                        <p>
                            Právo na opravu osobních údajů může subjekt údajů uplatnit přímo u zdravotnického personálu, který poskytuje zdravotní služby. V případech, kdy nebude možné ověřit identifikaci žadatele/subjektu údajů, bude požádán o její dodatečné prokázání. Pokud subjekt údajů zjistí nebo se domnívá, že při zpracování osobních údajů došlo ze strany správce nebo dalších subjektů provádějících zpracování, k porušení práv subjektu údajů či k porušení povinností stanovených zákonem, může se subjekt údajů domáhat nápravy s využitím všech prostředků, které k tomu platná právní úprava poskytuje. V případě, kdy se nemůže domoci práv jiným způsobem, může se též obrátit nebo podat stížnost u dozorového orgánu.
                        </p>
                    </CardContent>
                </Card>

                {/* Section XVII - Legal Regulations */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-2xl">XVII. Právní předpisy opravňující zpracovávat osobní údaje při poskytování zdravotních služeb</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700 space-y-4">
                        <p>Zejména:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>zákon č. 372/2011 Sb., o zdravotních službách a podmínkách jejich poskytování (zákon o zdravotních službách)</li>
                            <li>zákon č. 373/2011 Sb., o specifických zdravotních službách</li>
                            <li>zákon č. 108/2006 Sb., o sociálních službách</li>
                            <li>zákon č. 378/2007 Sb., o léčivech</li>
                            <li>zákon č. 592/1992 Sb., o pojistném na veřejné zdravotní pojištění</li>
                            <li>zákon č. 374/2011 Sb., o zdravotnické záchranné službě, ve znění pozdějších předpisů</li>
                            <li>zákon č. 268/2014 Sb., o diagnostických zdravotnických prostředcích in vitro</li>
                            <li>zákon č. 258/2000 Sb., o ochraně veřejného zdraví a o změně některých souvisejících zákonů</li>
                            <li>zákon č. 285/2002 Sb., transplantační zákon</li>
                            <li>zákon č. 296/2008 Sb., o lidských tkáních a buňkách</li>
                            <li>zákon č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů</li>
                            <li>zákon č. 48/1997 Sb., o veřejném zdravotním pojištění a o změně a doplnění některých souvisejících zákonů</li>
                            <li>zákon č. 110/2019 Sb., o zpracování osobních údajů</li>
                            <li>zákon č. 111/2019 sb., kterým se mění některé zákony v souvislosti s přijetím zákona 110/2019 Sb.</li>
                            <li>zákon č. 133/2000 Sb., o evidenci obyvatel</li>
                            <li>vyhláška č. 98/2012 Sb., o zdravotnické dokumentaci</li>
                            <li>vyhláška č. 84/2008 Sb., o správné lékárenské praxi, bližších podmínkách zacházení s léčivy v lékárnách, zdravotnických zařízeních a u dalších provozovatelů a zařízení vydávajících léčivé přípravky</li>
                            <li>vyhláška č. 143/2008 Sb., o lidské krvi</li>
                            <li>vyhláška 373/2016 Sb., o předávání údajů do NZIS</li>
                            <li>nařízení vlády 201/2010 Sb., o způsobu evidence úrazů, hlášení a zasílání záznamu o úraze</li>
                            <li>prováděcí právní předpisy k citovaným zákonům</li>
                        </ul>
                        <p className="mt-4 font-semibold">Další právní předpisy opravňující zpracovávat osobní údaje, zejména:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>zákon č. 262/2006 Sb., zákoník práce</li>
                            <li>zákon č. 563/1991 Sb., o účetnictví</li>
                            <li>zákon č. 582/1991 Sb., o organizaci a provádění sociálního zabezpečení</li>
                            <li>zákon č. 589/1992 Sb., o pojistném na sociální zabezpečení a příspěvku na státní politiku zaměstnanosti</li>
                            <li>zákon č. 592/1992 Sb., o pojistném na veřejné zdravotní pojištění</li>
                            <li>zákon č. 258/2000 Sb., o ochraně veřejného zdraví</li>
                            <li>zákon č. 181/2014 Sb., o kybernetické bezpečnosti</li>
                            <li>zákon č. 133/2000 Sb., o evidenci obyvatel</li>
                            <li>zákon č. 187/2006 Sb., o nemocenském pojištění</li>
                            <li>zákon č. 586/1992 Sb., o daních z příjmů</li>
                            <li>vyhláška č. 82/2018 Sb., o kybernetické bezpečnosti</li>
                            <li>vyhláška č. 317/2014 Sb., o významných informačních systémech</li>
                        </ul>
                        <p className="mt-4">
                            Toto prohlášení je veřejně přístupné na internetových stránkách správce na adrese <Link href="http://www.kzcr.eu" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">www.kzcr.eu</Link>.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
