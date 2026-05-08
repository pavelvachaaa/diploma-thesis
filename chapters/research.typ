#import "../template/abbreviations.typ": abbr


= Existující softwarová řešení
Rozhodnutí o vlastním vývoji je obhajitelné pouze tehdy, pokud je zřejmé, proč dostupná řešení nedokážou naplnit požadavky organizace bez nepřiměřených kompromisů. Tato kapitola proto porovnává vybraná řešení a hodnotí jejich vhodnost vzhledem k podmínkám KZ.


== Metodika rešerše
Rešerše byla provedena jako komparativní posouzení řešení ze tří kategorií: #abbr("ATS", "Applicant Tracking System"), platformy pro vstupní agendu (adaptaci) a #abbr("HCM", "Human Capital Management") systémy. Na základě analyzovaných požadavků vznikla kritéria pro hodnocení uvedená níže v @tab:research-kriteria.


#figure(
  [
    #set par(justify: false)
    #table(
      columns: (auto, 2.3fr, 1.2fr, 1fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [ID], [Hodnoticí kritérium], [Vazba na požadavky], [Typ],
      [K1], [Pokrytí celého náborového procesu], [R2, R3], [Must],
      [K2], [Pokrytí vstupní agendy a adaptace zaměstnance], [R4], [Must],
      [K3], [Podpora holdingového členění (oddělená data + centrální dohled)], [R1], [Must],
      [K4], [Integrace a rozšiřitelnost (API, datové vazby)], [R5], [Must],
      [K5], [Možnost provozu na vlastní infrastruktuře], [NF07], [Must],
      [K6], [Reporting a analytika napříč závody], [R6], [Should],
      [K7], [Lokalizace pro české prostředí], [NF09], [Should],
      [K8], [Podpora publikace inzerce na externích portálech], [R2], [Could],
    )
  ],
  caption: [Hodnoticí rámec rešerše dostupných řešení]
) <tab:research-kriteria>

Hodnocení vychází z veřejně dostupné dokumentace výrobců, produktových stránek a oficiálních ceníků *(stav k 21. 11. 2025)*.

Pro účely rozhodnutí byla kritéria typu *Must* chápána jako diskvalifikační. Pokud řešení nesplní kterékoli kritérium K1–K5, není vhodné jako cílová platforma pro digitalizaci procesů #abbr("KZ", none), i když může být přínosné jako dílčí integrační komponenta.

== Specializované náborové platformy
Specializované ATS nástroje jsou zaměřeny především na počáteční fázi náboru. Silné jsou zejména v oblasti správy pracovních pozic, evidence uchazečů, komunikace s nimi a zveřejňování pracovních nabídek. Pro účely této práce však není klíčové pouze to, jak efektivně dokážou nábor zahájit, ale zda na něj dokážou plynule navázat i v oblasti vstupní agendy a adaptačního procesu. Právě tyto fáze jsou v prostředí zdravotnické organizace výrazně složitější než v běžném komerčním náboru.

=== Teamio (Alma Career)
Teamio lze považovat za referenční ATS řešení českého trhu, zejména díky jeho úzkému propojení s dominantními inzertními kanály jobs.cz a prace.cz. Tato vazba je v podmínkách #abbr("KZ", none) významná, protože umožňuje snížit transakční náklady spojené s publikací inzerce a konsolidací reakcí uchazečů. Oficiální dokumentace současně uvádí možnost automatického importu pozic z interních systémů i z portálů provozovaných Alma Career. @teamioAutoImport2026

Z hlediska funkčního pokrytí Teamio naplňuje klíčové ATS scénáře a v komerční nabídce deklaruje i preboarding/onboarding (před nástupní a nástupní agenda) rozšíření @teamioPricing2026.  Z pohledu požadavků této práce je však zásadní provozní model produktu, který je koncipován jako služba bez lokální instalace @teamioTrial2026. Tento model je sice vhodný pro rychlé uvedení do provozu, avšak nevytváří přímý soulad s požadavkem #abbr("KZ", none) na on-premise nasazení a interní kontrolu datového provozu.

Z analytického hlediska je proto Teamio vhodné vnímat spíše jako specializovanou integrační komponentu pro inzerci a sběr kandidátských reakcí než jako plnohodnotný cílový systém pro end-to-end řízení náboru, vstupní agendy a adaptace.

=== Recruitis
Recruitis je ATS platforma orientovaná na digitalizaci náborového procesu, práci s databází uchazečů a podporu přehledu náborových aktivit. Veřejné materiály zároveň uvádějí vazbu na řešení pro vstupní agendu Onbee, což potvrzuje interoperabilitu systému, ale zároveň ukazuje, že náborová a adaptační vrstva jsou řešeny odděleně. @recruitisWeb2026

Ve vztahu k enterprise požadavkům je důležitá deklarovaná podpora REST API integrace, #abbr("SSO", "Single Sign-On") a více právních subjektů @recruitisWeb2026. Tyto parametry zvyšují použitelnost v heterogenním organizačním prostředí. Přesto i zde platí, že řešení komplexního adaptačního procesu by muselo být zajištěno navazujícím externím modulem, což zvyšuje závislost na mezisystémové koordinaci.

=== Datacruit
Datacruit deklaruje ATS funkcionalitu doplněnou o automatizační prvky a integrační otevřenost  @datacruitWeb2026. Z hlediska této práce je klíčové, že oficiální ceník u enterprise varianty uvádí možnost implementace na vlastní infrastruktuře zákazníka a licenční model, který není založeň čistě na předplatném.

Tento parametr činí Datacruit z porovnávaných ATS systémů nejbližším kandidátem ve vztahu k požadavku NF07 (on-premise nasaditelnost). Funkční těžiště produktu je však nadále v oblasti náboru. Plnohodnotná podpora adaptačního procesu zdravotnických pracovníků by tedy vyžadovala další produktovou vrstvu nebo zakázkové rozšíření, což zvyšuje architektonickou i provozní složitost cílového řešení.

=== Sloneek
Sloneek nabízí ATS modul jako součást širší HR platformy. Tento přístup je výhodný z pohledu sjednocení základních personálních agend, avšak dostupná dokumentace současně uvádí omezení v oblasti přímé integrace ATS modulu na externí platformy. @sloneekAts2026

V prostředí #abbr("KZ", none) tak Sloneek představuje využitelnou variantu pro obecnou digitalizaci HR činností, nikoli však jednoznačně vhodného kandidáta pro cílové řešení s požadovanou mírou specializace na zdravotnické procesy, multi-tenantní řízení a on-premise provoz.

== Platformy pro vstupní agendu a adaptaci
Samostatnou skupinu tvoří řešení zaměřená na fázi po výběru kandidáta, tedy na vstupní agendu, předávání dokumentů, plnění úkolů a řízení adaptačního procesu. Oproti ATS platformám se méně soustředí na získání uchazeče a více na koordinaci nástupu zaměstnance. Pro #abbr("KZ", none) je tato oblast důležitá zejména proto, že právě po rozhodnutí o přijetí vzniká velké množství administrativních kroků mezi HR, zaměstnancem a organizační jednotkou.

=== Onbee
Onbee představuje specializovanou platformu pro vstupní agendu a adaptaci zaměřenou na procesní koordinaci nástupu zaměstnance, práci s checklisty a správu související dokumentace. Ve veřejné produktové dokumentaci jsou deklarovány integrační možnosti na ATS/HRIS, podpora #abbr("SSO", none) i možnost on-premise instalace. @onbeeWeb2026

Z hlediska hodnoticího rámce tak Onbee velmi dobře pokrývá část požadavků spojených s adaptací (R4) a částečně i provozní požadavky NF07. Jeho limit spočívá v tom, že nejde o plnohodnotné ATS řešení, takže by organizace musela paralelně provozovat a integračně udržovat další náborový systém. Vznikla by tak vícevrstvá architektura s vyšší závislostí na kvalitě integračních vazeb.

== Platformy pro řízení lidských zdrojů
Integrované #abbr("HCM", none) platformy sledují jiný strategický cíl než specializované ATS nebo nástroje pro vstupní agendu. Snaží se pokrýt co největší část zaměstnaneckého cyklu v jednom datovém a procesním modelu. Z pohledu enterprise architektury jde o logický přístup, protože snižuje fragmentaci dat. V praxi však bývá vykoupen vyšší implementační náročností, větším rozsahem změnového řízení a velmi často i cloudovým provozním modelem @mauro2024digital.

=== SAP SuccessFactors
SAP SuccessFactors je výrobcem prezentován jako cloud-based HCM suite s moduly pro nábor i adaptaci @sapSuccessfactorsWhatIs2026 @sapSuccessfactorsOnboarding2026. Z hlediska funkční šíře jde o robustní platformu schopnou pokrýt velkou část HR procesů, včetně centralizovaného reportingu a governance.

V podmínkách #abbr("KZ", none) je však hlavním limitem provozní model orientovaný na cloud a nutnost rozsáhlé konfigurace na lokální zdravotnické specifikum. Rizikem je také vyšší implementační setrvačnost, tedy obtížnost a časová náročnost provádění změn procesního modelu v průběhu projektu.

=== Workday
Workday deklaruje jednotnou cloud platformu pro HR a související procesy včetně strategického získávání pracovníků @workdayUnifiedCloud2026 @workdayTalentAcquisition2026.  Ve srovnání s tradičním modulárním přístupem poskytuje silný důraz na datovou konzistenci a analytiku napříč procesy.

Stejně jako u SAP SuccessFactors je však v této práci rozhodující nesoulad mezi cloudovým provozním modelem a požadavkem #abbr("KZ", none) na provoz na vlastní infrastruktuře. Dalším faktorem je náročnost lokalizace na české regulatorní prostředí a specifika zdravotnických rolí.

=== Oracle Fusion Cloud HCM
Oracle Fusion Cloud HCM je výrobcem prezentován jako kompletní cloudové řešení zahrnující nábor i adaptační procesy. @oracleHcm2026 @oracleRecruiting2026 Z hlediska procesního pokrytí jde o srovnatelně široký koncept jako u předchozích enterprise platforem.

V případě #abbr("KZ", none) však i zde převažuje stejná bariéra: nesoulad s požadavkem na on-premise provoz a vysoká míra přizpůsobení nutná pro české zdravotnické procesy, zejména ve vazbě na národní registry a interní organizační členění holdingu.

== Porovnání řešení vůči požadavkům organizace
Následující tabulky shrnují vybraná řešení podle diskvalifikačních kritérií K1–K5 a doplňkových kritérií K6–K8 uvedených v @tab:research-kriteria. Hodnocení je provedeno kvalitativně ve škále *Ano / Částečně / Ne* na základě veřejně doložitelných informací.

Pro @tab:porovnani-diskvalifikace platí: K1 = nábor, K2 = adaptace, K3 = multi-tenantní podpora, K4 = integrace/API, K5 = on-premise provoz.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.8fr, auto, auto, auto, auto, auto),
      inset: 6pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Řešení], [K1], [K2], [K3], [K4], [K5],

      [Teamio], [Ano], [Částečně], [Částečně], [Ano], [Ne],
      [Recruitis], [Ano], [Částečně], [Částečně], [Ano], [Ne],
      [Datacruit], [Ano], [Částečně], [Částečně], [Ano], [Ano],
      [Sloneek], [Částečně], [Částečně], [Částečně], [Částečně], [Ne],
      [Onbee], [Ne], [Ano], [Částečně], [Ano], [Ano],
      [SAP SuccessFactors], [Ano], [Ano], [Ano], [Ano], [Ne],
      [Workday], [Ano], [Ano], [Ano], [Ano], [Ne],
      [Oracle HCM], [Ano], [Ano], [Ano], [Ano], [Ne],
    )
  ],
  caption: [Porovnání vybraných řešení podle diskvalifikačních kritérií]
) <tab:porovnani-diskvalifikace>

A k tomu @tab:porovnani-doplnkova, která je uvedená níže s doplňkovými kriteriimi na reporting, lokalizaci systému a inzerci na externích portálech.
#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.8fr, auto, auto, auto),
      inset: 6pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Řešení], [K6 Reporting], [K7 Lokalizace], [K8 Inzerce],

      [Teamio], [Ano], [Ano], [Ano],
      [Recruitis], [Ano], [Ano], [Ano],
      [Datacruit], [Ano], [Částečně], [Ano],
      [Sloneek], [Ano], [Ano], [Částečně],
      [Onbee], [Částečně], [Ano], [Ne],
      [SAP SuccessFactors], [Ano], [Částečně], [Částečně],
      [Workday], [Ano], [Částečně], [Částečně],
      [Oracle HCM], [Ano], [Částečně], [Částečně],
    )
  ],
  caption: [Porovnání vybraných řešení podle doplňkových kritérií K6-K8]
) <tab:porovnani-doplnkova>

Interpretace výsledků v @tab:porovnani-diskvalifikace ukazuje, že žádný z hodnocených produktů nesplňuje současně všechna diskvalifikační kritéria K1–K5. Enterprise HCM platformy dosahují vysokého funkčního pokrytí náboru i adaptace, avšak jejich cloudová orientace je v přímém rozporu s provozními omezeními #abbr("KZ", none). Specializované ATS platformy naopak přinášejí vysokou efektivitu v akviziční části náboru, nicméně navazující adaptační proces obvykle pokrývají jen částečně nebo prostřednictvím odděleného nástroje.

Z porovnání doplňkových kritérií vyplývá, že rozdíly mezi produkty se zmenšují v oblastech reportingu a obecné lokalizace, které jsou v komerčních řešeních obvykle dobře pokryty. Rozhodující je proto schopnost naplnit specifické požadavky domény zdravotnictví a interní architektonická omezení organizace, nikoli pouze šíře standardních HR funkcí.

Specifickým požadavkem zdravotnického prostředí je napojení na ověřování odborné způsobilosti zdravotnických pracovníků (NRZP), které je v českém eGovernment ekosystému dostupné jako samostatná služba @govNrzpOvereni2026.  Ve veřejné dokumentaci hodnocených komerčních produktů nebyla k datu rešerše doložena explicitní, hotová podpora tohoto procesu bez doplňkového vývoje nebo integrační nadstavby.

== Identifikovaná omezení dostupných produktů a volba cílového přístupu
Zjištění ukazují, že hlavní limit dostupných produktů neleží v absenci jednotlivých funkcí. Leží v nesouladu mezi jejich produktovou logikou a cílovou architekturou #abbr("KZ", none). První omezení představuje provozní model. Významná část funkčně robustních enterprise platforem je koncipována jako cloud-native služba, zatímco #abbr("KZ", none) vyžaduje provoz na vlastní infrastruktuře z důvodu interních pravidel řízení a správy IT (governance), bezpečnostních politik a provozní autonomie.

Druhé omezení se týká procesní kontinuity. U specializovaných ATS řešení je často vysoká kvalita náborové části, avšak adaptační proces bývá realizován v odděleném nástroji. Vzniká tak architektura "best of breed", která je funkčně flexibilní, ale z pohledu provozu přináší rizika roztříštěnosti dat, složitější správu identit a vyšší náklady na dlouhodobé integrační testování.

Třetí omezení spočívá v doménové specificitě českého zdravotnictví. Hodnocené produkty jsou navrženy jako obecně použitelné HR platformy pro více odvětví a zemí. To je jejich komerční výhoda, ale současně limit v situaci, kdy organizace potřebuje cíleně implementovat lokální procesní logiku, například ověřování odborné způsobilosti, auditovatelný průchod zdravotnickou adaptací nebo detailní vazbu na interní předpisy jednotlivých závodů.

Čtvrtým omezením je dlouhodobá provozní závislost na produktových plánech dodavatelů. U klíčových procesů, které jsou pro #abbr("KZ", none) strategické, představuje tato závislost významné riziko. Organizace by musela adaptovat interní postupy podle vývojového směru třetí strany, což je v rozporu s cílem řídit transformaci procesů primárně podle vlastních potřeb.

Na základě uvedených zjištění jsem zvolil jako nejvhodnější přístup založený na vývoji vlastního řešení. Tento přístup mi umožňuje navrhnout jednotný datový model pro nábor, vstupní agendu i adaptaci, implementovat multi-tenantní architekturu odpovídající uspořádání #abbr("KZ", none) a současně respektovat požadavek NF07 na on-premise provoz bez kompromisů.

Vlastní řešení zároveň snižuje riziko, že kritické doménové požadavky budou odloženy kvůli externímu produktovému plánu. Integrace, které jsou pro #abbr("KZ", none) skutečně přínosné, lze realizovat selektivně a v řízeném rozsahu, například pro distribuci inzerce nebo výměnu dat s externími registry. Tím se kombinuje výhoda procesní suverenity s pragmatickým využitím existujícího softwarového ekosystému.

Orientační dohledání konkrétních produktů používaných českými zdravotnickými zařízeními ukazuje, že nemocnice veřejně nakupují především placenou inzerci a nástroje pro první fázi náboru. Ve smlouvách se opakovaně objevují služby Alma Career, například jobs.cz, prace.cz, atmoskop.cz, Práce za rohem nebo náborový #abbr("ATS", none) Teamio. Tyto služby lze dohledat například u FN Ostrava @registrFnoAlma2024, FNUSA @registrFnusaAlmaNabor2025, Masarykova onkologického ústavu @registrMouTeamioProfessional2025, FN Brno @registrFnBrnoJobs2026 nebo FN Bulovka @registrBulovkaAlmaInzeraty2025.

K navrhovanému řešení mají částečně blízko širší #abbr("HRIS", "Human Resources Information System") systémy, například Vema, která uvádí moduly pro nástup a adaptaci zaměstnance @vemaZamestnaneckyPortal2026. V oblasti adaptace jsou pak veřejně dohledatelné hlavně systémy pro vzdělávání zaměstnanců, tedy #abbr("LMS", "Learning Management System"). Ty slouží pro kurzy, školení, testy a evidenci splněného vzdělávání. Příkladem může být Moodle od PragoData Consulting ve FN Hradec Králové @registrFnhkLms2021 nebo e-learningová platforma Educasoft Solutions ve FNUSA @registrFnusaEducasoftElearning2021.

Z veřejných zdrojů se však nepodařilo potvrdit, že by české nemocnice běžně používaly jeden systém, který by pokrýval celý proces od uchazeče až po vyhodnocenou odbornou adaptaci. Pravděpodobnější je, že navazující kroky často probíhají kombinací HR systému, e-mailové komunikace, tabulek, interních metodik a papírových podkladů, podobně jako tomu bylo v #abbr("KZ", none) před zahájením digitalizace.

Při cíleném dohledání se mi nepodařilo najít český produkt, který by současně pokrýval nábor, vstupní agendu, adaptační proces a zdravotnické integrace na NRZP nebo datové zdroje akreditací #abbr("MZČR", "Ministerstvo zdravotnictví České republiky"). Tyto vazby jsou přitom pro uchazeče ve zdravotnictví významné.

NRZP poskytuje rozhraní pro práci s údaji zdravotnických pracovníků @ncezKrzpApi2026. Portál akreditace.mzcr.cz zase zveřejňuje akreditační data, která jsou pro uchazeče důležitá, protože ukazují, která zdravotnická zařízení mají akreditaci pro konkrétní obory specializačního vzdělávání. Ve veřejných zdrojích se tedy nepodařilo potvrdit existenci hotového produktu, který by pokrýval stejný rozsah jako navrhované řešení.


Z metodického hlediska tedy tato kapitola nevede k závěru, že komerční produkty jsou obecně nevhodné. Vede k závěru, že pro konkrétní kombinaci požadavků R1–R6 a NF01–NF11 je v podmínkách #abbr("KZ", none) vlastní řešení variantou s nejvyšší mírou strategické a provozní shody.
