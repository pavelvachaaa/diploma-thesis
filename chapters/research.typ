#import "../template/abbreviations.typ": abbr

== Metodika rešerše a hodnoticí rámec
Rešerše dostupných softwarových řešení jsem provedl jako strukturované komparativní posouzení produktů z kategorií #abbr("ATS", "Applicant Tracking System"), onboardingových platforem a integrovaných #abbr("HCM", "Human Capital Management") suite. Hodnocení vychází z veřejně dostupné produktové dokumentace výrobců a z oficiálních ceníků či produktových stránek. Stav zdrojů odpovídá datu *21. 11. 2025*.

Cílem kapitoly není určit obecně nejlepší systém na trhu, ale identifikovat řešení nejvhodnější pro podmínky #abbr("KZ", none), tj. pro prostředí zdravotnického holdingu s požadavkem na on-premise provoz, auditovatelnost, multi-tenantní model a návaznost na specifické české procesy řízení odborné způsobilosti zdravotnických pracovníků.

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
      [K1], [Pokrytí náborového procesu (pozice, kandidáti, pipeline)], [R2, R3], [Must],
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

Pro účely rozhodnutí byla kritéria typu *Must* chápána jako diskvalifikační. Pokud řešení nesplní kterékoli kritérium K1-K5, není vhodné jako cílová platforma pro digitalizaci procesů #abbr("KZ", none), i když může být přínosné jako dílčí integrační komponenta.

== Specializované ATS platformy
Specializované ATS nástroje jsou navrženy primárně pro optimalizaci akviziční části náboru, tj. pro správu pozic, řízení kandidátského workflow, evidenci komunikace a publikaci pracovních nabídek. Jejich architektura zpravidla reflektuje potřeby obchodně orientovaného náboru a rychlé administrace výběrového řízení. V kontextu této práce je proto klíčové posoudit, nakolik takové systémy dokážou přirozeně pokračovat do vstupní agendy a adaptační fáze, které jsou v prostředí zdravotnické organizace procesně i regulatorně náročnější.

=== Teamio (Alma Career)
Teamio lze považovat za referenční ATS řešení českého trhu, zejména díky jeho úzkému propojení s dominantními inzertními kanály Jobs.cz a Práce.cz. Tato vazba je v podmínkách #abbr("KZ", none) významná, protože umožňuje snížit transakční náklady spojené s publikací inzerce a konsolidací reakcí uchazečů. Oficiální dokumentace současně uvádí možnost automatického importu pozic z interních systémů i z portálů provozovaných Alma Career. @teamioAutoImport2026

Z hlediska funkčního pokrytí Teamio naplňuje klíčové ATS scénáře a v komerční nabídce deklaruje i preboarding/onboarding rozšíření. @teamioPricing2026 Z pohledu požadavků této práce je však zásadní provozní model produktu, který je koncipován jako služba bez lokální instalace. @teamioTrial2026 Tento model je sice vhodný pro rychlé uvedení do provozu, avšak nevytváří přímý soulad s požadavkem #abbr("KZ", none) na on-premise nasazení a interní kontrolu datového provozu.

Z analytického hlediska je proto Teamio vhodné vnímat spíše jako specializovanou integrační komponentu pro inzerci a sběr kandidátských reakcí než jako plnohodnotný cílový systém pro end-to-end řízení náboru, vstupní agendy a adaptace.

=== Recruitis
Recruitis je ATS platforma orientovaná na digitalizaci náborového workflow, práci s talent poolem a reportingovou podporu náborových aktivit. Veřejné materiály zároveň uvádějí vazbu na onboardingové řešení Onbee, což potvrzuje interoperabilitu systému, ale zároveň ukazuje, že náborová a adaptační vrstva jsou řešeny odděleně. @recruitisWeb2026

Ve vztahu k enterprise požadavkům je důležitá deklarovaná podpora REST API integrace, #abbr("SSO", "Single Sign-On") a více právních subjektů. @recruitisWeb2026 Tyto parametry zvyšují použitelnost v heterogenním organizačním prostředí. Přesto i zde platí, že řešení komplexního adaptačního procesu by muselo být zajištěno navazujícím externím modulem, což zvyšuje závislost na mezisystémové koordinaci.

=== Datacruit
Datacruit deklaruje ATS funkcionalitu doplněnou o automatizační prvky a integrační otevřenost. @datacruitWeb2026 Z hlediska této práce je klíčové, že oficiální ceník u enterprise varianty uvádí možnost implementace na vlastní infrastruktuře zákazníka a licenční model, který není čistě subscription-based. @datacruitPricing2026

Tento parametr činí Datacruit z porovnávaných ATS systémů nejbližším kandidátem ve vztahu k požadavku NF07. Funkční těžiště produktu je však nadále v oblasti náboru. Plnohodnotná podpora adaptačního procesu zdravotnických pracovníků by tedy vyžadovala další produktovou vrstvu nebo zakázkové rozšíření, což zvyšuje architektonickou i provozní složitost cílového řešení.

=== Sloneek (ATS modul)
Sloneek nabízí ATS modul jako součást širší HR platformy. @sloneekAts2026 Tento přístup je výhodný z pohledu sjednocení základních personálních agend, avšak dostupná dokumentace současně uvádí omezení v oblasti přímé integrace ATS modulu na externí platformy. @sloneekAts2026

V prostředí #abbr("KZ", none) tak Sloneek představuje využitelnou variantu pro obecnou digitalizaci HR činností, nikoli však jednoznačně vhodného kandidáta pro cílové řešení s požadovanou mírou specializace na zdravotnické procesy, multi-tenantní řízení a on-premise provoz.

== Onboardingové platformy
=== Onbee
Onbee představuje specializovanou onboarding/offboarding platformu zaměřenou na procesní koordinaci nástupu zaměstnance, práci s checklisty a správu související dokumentace. Ve veřejné produktové dokumentaci jsou deklarovány integrační možnosti na ATS/HRIS, podpora #abbr("SSO", none) i možnost on-premise instalace. @onbeeWeb2026

Z hlediska hodnoticího rámce tak Onbee velmi dobře pokrývá část požadavků spojených s adaptací (R4) a částečně i provozní požadavky NF07. Jeho limit spočívá v tom, že nejde o plnohodnotné ATS řešení, takže by organizace musela paralelně provozovat a integračně udržovat další náborový systém. Vznikla by tak vícevrstvá architektura s vyšší závislostí na kvalitě integračních vazeb.

== Integrované HCM suite (enterprise)
Integrované #abbr("HCM", none) platformy mají oproti specializovaným ATS nebo onboarding nástrojům jiný strategický cíl: pokrýt co největší část zaměstnaneckého cyklu v jednotném datovém a procesním modelu. Tento koncept je z hlediska metodiky enterprise architektury konzistentní, protože snižuje fragmentaci dat. V praxi však bývá spojen s vyšší implementační náročností, výraznějšími náklady na změnové řízení a s provozním modelem orientovaným na cloud.

=== SAP SuccessFactors
SAP SuccessFactors je výrobcem prezentován jako cloud-based HCM suite s moduly pro recruiting i onboarding. @sapSuccessfactorsWhatIs2026 @sapSuccessfactorsOnboarding2026 Z hlediska funkční šíře jde o robustní platformu schopnou pokrýt velkou část HR procesů, včetně centralizovaného reportingu a governance.

V podmínkách #abbr("KZ", none) je však hlavním limitem provozní model orientovaný na cloud a nutnost rozsáhlé konfigurace na lokální zdravotnické specifikum. Rizikem je i vyšší implementační setrvačnost při změnách procesního modelu během projektu.

=== Workday
Workday deklaruje jednotnou cloud platformu pro HR a související procesy včetně talent acquisition. @workdayUnifiedCloud2026 @workdayTalentAcquisition2026 Ve srovnání s tradičním modulárním přístupem poskytuje silný důraz na datovou konzistenci a analytiku napříč procesy.

Stejně jako u SAP SuccessFactors je však v této práci rozhodující nesoulad mezi cloudovým provozním modelem a požadavkem #abbr("KZ", none) na provoz na vlastní infrastruktuře. Dalším faktorem je náročnost lokalizace na české regulatorní prostředí a specifika zdravotnických rolí.

=== Oracle Fusion Cloud HCM
Oracle Fusion Cloud HCM je výrobcem prezentován jako kompletní cloudové řešení zahrnující recruiting i onboarding procesy. @oracleHcm2026 @oracleRecruiting2026 Z hlediska procesního pokrytí jde o srovnatelně široký koncept jako u předchozích enterprise platforem.

V případě #abbr("KZ", none) však i zde převažuje stejná bariéra: nesoulad s požadavkem na on-premise provoz a vysoká míra přizpůsobení nutná pro české zdravotnické procesy, zejména ve vazbě na národní registry a interní organizační členění holdingu.

== Porovnání řešení vůči požadavkům KZ
Následující tabulky shrnují vybraná řešení podle diskvalifikačních kritérií K1-K5 a doplňkových kritérií K6-K8. Hodnocení je provedeno kvalitativně ve škále *Ano / Částečně / Ne* na základě veřejně doložitelných informací.

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

Interpretace výsledků v @tab:porovnani-diskvalifikace ukazuje, že žádný z hodnocených produktů nesplňuje současně všechna diskvalifikační kritéria K1-K5. Enterprise HCM platformy dosahují vysokého funkčního pokrytí náboru i adaptace, avšak jejich cloudová orientace je v přímém rozporu s provozními omezeními #abbr("KZ", none). Specializované ATS platformy naopak přinášejí vysokou efektivitu v akviziční části náboru, nicméně navazující adaptační proces obvykle pokrývají jen částečně nebo prostřednictvím odděleného nástroje.

Z porovnání doplňkových kritérií vyplývá, že rozdíly mezi produkty se zmenšují v oblastech reportingu a obecné lokalizace, které jsou v komerčních řešeních obvykle dobře pokryty. Rozhodující je proto schopnost naplnit specifické požadavky domény zdravotnictví a interní architektonická omezení organizace, nikoli pouze šíře standardních HR funkcí.

Specifickým požadavkem zdravotnického prostředí je napojení na ověřování odborné způsobilosti zdravotnických pracovníků (NRZP), které je v českém eGovernment ekosystému dostupné jako samostatná služba. @govNrzpOvereni2026 Ve veřejné dokumentaci hodnocených komerčních produktů nebyla k datu rešerše doložena explicitní, hotová podpora tohoto procesu bez doplňkového vývoje nebo integrační nadstavby.

== Identifikovaná omezení dostupných produktů a volba cílového přístupu
Zjištění ukazuje, že hlavní limit dostupných produktů není v absenci jednotlivých funkcí, ale v nesouladu mezi jejich produktovou logikou a cílovou architekturou #abbr("KZ", none). První omezení představuje provozní model. Významná část funkčně robustních enterprise platforem je koncipována jako cloud-native služba, zatímco #abbr("KZ", none) požaduje provoz na vlastní infrastruktuře z důvodu interní governance, bezpečnostních politik a provozní autonomie.

Druhé omezení se týká procesní kontinuity. U specializovaných ATS řešení je často vysoká kvalita náborové části, avšak adaptační proces bývá realizován v odděleném nástroji. Vzniká tak architektura "best of breed", která je funkčně flexibilní, ale z pohledu provozu přináší rizika fragmentace dat, složitější správu identit a vyšší náklady na dlouhodobé integrační testování.

Třetí omezení spočívá v doménové specificitě českého zdravotnictví. Hodnocené produkty jsou navrženy jako obecně použitelné HR platformy pro více odvětví a zemí. To je jejich komerční výhoda, ale současně limit v situaci, kdy organizace potřebuje cíleně implementovat lokální procesní logiku, například ověřování odborné způsobilosti, auditovatelný průchod zdravotnickou adaptací nebo detailní vazbu na interní předpisy jednotlivých závodů.

Čtvrtým omezením je dlouhodobá provozní závislost na produktových plánech dodavatelů. U klíčových procesů, které jsou pro #abbr("KZ", none) strategické, představuje tato závislost významné riziko. Organizace by musela adaptovat interní postupy podle vývojového směru třetí strany, což je v rozporu s cílem řídit transformaci procesů primárně podle vlastních potřeb.

Na základě uvedených zjištění jsem zvolil jako nejvhodnější přístup založený na vývoji vlastního řešení. Tento přístup mi umožňuje navrhnout jednotný datový model pro nábor, vstupní agendu i adaptaci, implementovat multi-tenantní architekturu odpovídající holdingovému uspořádání a současně respektovat požadavek na on-premise provoz bez kompromisních výjimek.

Vlastní řešení zároveň snižuje riziko, že kritické doménové požadavky budou odloženy kvůli externí produktovému plánu. Integrace, které jsou pro #abbr("KZ", none) skutečně přínosné, lze realizovat selektivně a v řízeném rozsahu, například pro distribuci inzerce nebo výměnu dat s externími registry. Tím se kombinuje výhoda procesní suverenity s pragmatickým využitím existujícího softwarového ekosystému.

Z metodického hlediska tedy tato kapitola nevede k absolutnímu závěru, že komerční produkty jsou obecně nevhodné, ale k závěru, že pro konkrétní kombinaci požadavků R1-R6 a NF01-NF12 je vlastní řešení v podmínkách #abbr("KZ", none) variantou s nejvyšší mírou strategické a provozní shody.
