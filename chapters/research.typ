#import "../template/abbreviations.typ": abbr

== Personální systémy a ATS (Applicant Tracking Systems)
Personální informační systém (HRIS/HRMS) lze chápat jako soubor aplikací a databází určených k získávání, ukládání, zpracování a distribuci informací o lidských zdrojích a HR procesech organizace. Typicky zahrnuje evidenci zaměstnanců, pracovní poměry, docházku, mzdy, reporting a podporu HR rozhodování. V praxi se HRIS často vyskytuje buď jako samostatná aplikace, nebo jako modul integrovaného ERP.

V českém kontextu se personální systémy často profilují především jako _core HR_ a mzdová agenda, tj. stabilní administrativní základ (kmenová data, smlouvy, výplatní páska, docházka, zákonné výstupy), na který se napojují specializované nástroje (nábor, vzdělávání, výkon). Tento rozdíl je důležitý pro pozdější srovnání, protože ovlivňuje integrační náročnost i vlastnictví dat (kde je primární zdroj pravdy o zaměstnanci).

ATS neboli applicant tracking system můžeme chápat jako specializovanou podkategorii systémů zaměřených na podporu náborového procesu. Tyto systémy zpravidla disponují funkcemi jako jsou správa pozic, workflow náboru, evidence kandidátů, komunikace, vyhodnocování kroků výběrového řízení a reporting náborových metrik. ATS typicky optimalizuje průchod kandidáta procesem (candidate pipeline) a standardizuje náborové kroky. 

Z pohledu hranice vůči personálním systémům je klíčové, že ATS pracuje primárně s entitou kandidát (nikoli zaměstnanec) a s daty relevantními pro výběr. Přenos kandidáta do stavu zaměstnance proto obvykle vyžaduje buď integrační vazbu na HRIS/HRMS, nebo  existenci onboardingového/modulového můstku mezi náborem a nástupem.

=== Teamio (LMC) jako ATS řešení českého trhu

Teamio je český #abbr("ATS", "Applicant Tracking System") vyvinutý společností LMC s.r.o., provozovatelem pracovních portálů Jobs.cz a Práce.cz. Systém je nabízen formou SaaS a patří mezi nejrozšířenější ATS řešení na českém trhu. Díky úzké vazbě na dominantní inzertní portály disponuje silnou integrací v oblasti publikace pracovních nabídek a příjmu reakcí uchazečů.

Z hlediska funkcionality Teamio nabízí správu náborových kampaní, evidenci uchazečů s vizualizací pipeline (kanban přehled), nástroje pro komunikaci (šablony e-mailů, hromadné rozesílání), základní analytické přehledy a podporu týmové spolupráce při hodnocení kandidátů. Přímá integrace s portály Jobs.cz a Práce.cz představuje významnou výhodu v českém prostředí, neboť umožňuje centralizovaný sběr reakcí a minimalizuje manuální práci při publikaci inzerátů.

Silnou stránkou řešení je jeho lokalizace, znalost českého pracovního trhu a relativně nízká vstupní cena ve srovnání se zahraničními enterprise ATS platformami. Pro organizace hledající nástroj primárně pro řízení náborové pipeline představuje Teamio robustní a osvědčené řešení.

Z pohledu požadavků #abbr("KZ", none) však Teamio pokrývá výhradně fázi náboru (R2, R3) a neposkytuje funkcionalitu řízení adaptačního procesu (R4). Chybí zde workflow management pro onboarding, dynamické formuláře, správa adaptačních plánů či pokročilý monitoring plnění úkolů. Systém rovněž neimplementuje multitenantní architekturu odpovídající holdingové struktuře #abbr("KZ", none) (R1) a je provozován výhradně v cloudovém režimu, což je relevantní ve vztahu k požadavku NF07.

Z těchto důvodů není Teamio uvažováno jako cílové řešení pro digitalizaci náboru a adaptace v #abbr("KZ", none). V této práci je zmíněno protože naopak může být v kontextu navrhované architektury použito jako integrační bod pro publikaci pracovních nabídek a příjem reakcí z externích pracovních portálů. Takový přístup umožňuje využít silné stránky platformy (distribuce inzerce a sběr kandidátů), aniž by bylo nutné přizpůsobovat vnitřní procesy organizace omezením čistě náborového nástroje a následnou integrací jiného nástroje pro adaptaci zaměstnance.


== LMS a Onboarding platformy
Onboarding představuje řízený adaptační proces nového zaměstnance v prvních týdnech až měsících. V praxi zahrnuje organizační úkony (přístupy, BOZP), předání interních informací a dokumentace, a v případě zdravotnických profesí také odborné seznámení s provozními postupy pracoviště. Z technologického hlediska onboardingové platformy obvykle kombinují workflow úkolů napříč rolemi (HR, IT, vedoucí, buddy), sběr informací a dokumentů, automatické notifikace a monitoring plnění plánu nově nastupujícího zaměstnance.

V českém a evropském prostředí existují specializované onboardingové nástroje (např. Onbee), které umožňují definovat adaptační plány dle typů pozic nebo regionů a navazovat časovou posloupnost úkolů včetně sběru dokumentů a formulářů. @onbeeWeb

TODO: Zvážit jestli LMSko nevyhodit v práci, tohle řeší Vema ale kromě toho, že to někdy uhlídá kvalifikace je to k ničemu...
#abbr("LMS", "Learning Management System") je systém určený pro řízení vzdělávání (správa kurzů, evidence absolvování, testování, reporting). LMS zpravidla neřeší celý onboarding (např. smluvní dokumentaci, pre-boarding, přístupová oprávnění), ale představuje klíčovou komponentu v oblastech povinného vzdělávání a compliance. V prostředí #abbr("KZ", none) je navíc významná návaznost na sledování kvalifikací a povinných školení, což dále zvyšuje integrační nároky a požadavek na jednotný reporting (R6).


== Integrované HR systémy používané ve zdravotnictví

Integrované HR platformy (#abbr("HCM", "Human Capital Management") suite) typicky pokrývají větší část životního cyklu zaměstnance: recruiting, onboarding, learning a následně další oblasti (výkon, odměňování, HR administrativu). Výhodou tohoto přístupu je existence jednotného datového modelu a možnosti end-to-end reportingu napříč procesy. Zároveň však jde často o enterprise řešení, která jsou implementačně náročná a typicky provozovaná jako cloudová služba, což je v prostředí #abbr("KZ", none) vyloučeno.

Pro referenční srovnání byly uvažovány platformy SAP SuccessFactors (Recruiting + Onboarding + Learning + Employee Central), Workday (Recruiting a HR pro healthcare) a Oracle Fusion Cloud HCM. 

Z pohledu zdravotnictví je pro navazující návrh systému klíčové, že specializované požadavky (např. validace odborné způsobilosti, lokální regulatorní integrace a specifické datové zdroje) jsou v komerčních platformách zpravidla řešeny až formou konfigurace a integrací (což přináší další mnohem vyšší náklady na pořízení a provozování), nikoliv jako hotová funkcionalita pro české prostředí.

== Porovnání řešení z hlediska definovaných požadavků
Předpřipravená tabulka, zatím na random
#figure(
  table(
    columns: (1.4fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
    inset: 6pt,
    align: horizon,
    fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
    stroke: 0.5pt + gray,

    [Kritérium], [Recruitis], [Datacruit], [Sloneek], [Onbee], [SAP SF], [Workday], [Oracle HCM],

    [Kariérní portál], [2], [1–2], [1], [0], [2], [2], [2],
    [Evidence kandidátů], [2], [2], [1–2], [0], [2], [2], [2],
    [Talent pool], [1–2], [1–2], [1], [0], [2], [2], [2],
    [Onboarding], [0–1], [0–1], [1], [2], [2], [2], [2],
    [LMS], [0], [0], [0–1], [0–1], [2], [1–2], [1–2],
    [Reporting], [1–2], [1–2], [1], [1], [2], [2], [2],
    [SSO/OAuth2 (enterprise ready)], [1], [1], [1], [1], [2], [2], [2],
    [On-prem], [0–1], [0–1], [0–1], [0–1], [0], [0], [0],
    [NRZP integrace], [0–1], [0–1], [0–1], [0–1], [0–1], [0–1], [0–1],
  ),
  caption: [Srovnání vybraných řešení vůči požadavkům KZ (škála 0–2)]
) <tab:porovnani-reseni>

== Identifikovaná omezení dostupných produktů
