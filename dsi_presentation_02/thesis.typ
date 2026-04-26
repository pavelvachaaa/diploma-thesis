#import "template/template.typ": *

#show: tultemplate2.with(
  faculty: "fm",
  document: "presentation",
  lang: "cs",
  title: (
    cs: [Digitální transformace procesů náboru \ a adaptace pracovníků ve zdravotnické organizaci],
    
  ),
  supervisor: "Ing. Jana Vitvarová, Ph.D.",

  presentation: (
    append_thanks: true,
    wide: true,
    first_heading_is_fullpage: true,
  ),
  author: [Bc. Pavel Vácha],
  citations: "citations.bib"
)

== Zadání
1. Analyzujte procesy náboru a adaptace pracovníků ve zdravotnické organizaci a definujte požadavky na jejich digitalizaci.

2. Proveďte rešerši existujících softwarových řešení pokrývajících požadovanou funkcionalitu a specifikujte jejich omezení.

3. Na základě požadavků a rešerše navrhněte softwarovou architekturu a implementujte vlastní řešení.

4. Nasaďte výsledný produkt do testovacího prostředí.

5. Získejte zpětnou vazbu od uživatelů, analyzujte ji a navrhněte další směřování vývoje a odstranění nedostatků.

== Analýza procesů a definování požadoavků

- Strukturované rozhovory s náboráři, pracovníky z personalního a mzdového oddělení.

- Mapování procesů pomocí notace BPMN. Zmapáváno *pět* klíčových procesů pro digitalizaci \ od inzerce až po adaptaci.

  - Proces P01 - Vystavení inzerátu
  - Proces P02 - Příjem a výběr kandidátů k oslovení
  - Proces P03 - Pohovor a uzavření pracovního poměru
  - Proces P04 - Nástup zaměstnance
  - Proces P05 - Adaptace zaměstnance

- Excelové soubory v 11 tisícovém holdingu se 7 odštěpnými závody napříč ústeckým krajem, time-to-hire, atestace, komory, NRZP, *200 nástupů měsíčně*, v *sezóně až 180 životopisů*.


===

#figure(
  image(
    "p02_prijem_prihlasek.svg",
    width: 100%,
  ),
  caption: [BPMN Proces P02 - Příjem a výběr kandidátů k oslovení]
) <obr:process-p02>


== Analýza procesů a definování požadoavků


- Využita MoSCoW (Must, should, Could have, Won't have) pro prioritizace požadavků vycházející z analýzy.
    #grid(columns: (2fr,2fr), gutter: 50pt,
     block(fill: rgb("#FFF8F0"), stroke: 0.6pt + rgb("#E8C99A"), radius: 2pt,
        inset: 12pt, width: 100%,
      )[
        #v(0.2cm)
        #text(size: 18.5pt, weight: "bold", [Klíčové problémy])
        #line(length: 100%, stroke: 0.4pt + rgb("#E8C99A"))
        #set text(size: 17.5pt, )
        - P1: Tabulková a papírová agenda
        - P4: Absence auditní stopy
        - P5: Chybové ověřování kvalifikací
        - P6: Komunikační smyčka mezi HR a vedoucí
        - P9: Nepřehledný stav vstupní agendy
        - P10: Papírová adaptační dokumentace

      ],
    
  block(fill: rgb("#FFF8F0"), stroke: 0.6pt + rgb("#E8C99A"), radius: 2pt,
        inset: 12pt, width: 100%,
      )[
        #v(0.2cm)
        #text(size: 18.5pt, weight: "bold", [Klíčové požadavky])
        #line(length: 100%, stroke: 0.4pt + rgb("#E8C99A"))
        #set text(size: 17.5pt, )
        - R1: Multi-tenantní architektura
        - R2: Veřejný kariérní portál
        - R3: Interní administrační rozhraní 
        - R4: Adaptační portál
        - R5: Integrace NRZP
        - R6: Reporting a analytika
      ],

    )

== Rešerše 
- V práci je více kritérií, zde uvedeny nejdůležištější.
- Žádné řešení nesplňuje současně všechna kritéria K1 až K8 → vlastní vývoj.

#figure(

table(
  
  columns: (1.7fr, 1fr, 1.2fr, 1.3fr, 1.1fr, 1.2fr,1fr),

  [*Řešení*], [Nábor], [Adaptace], [Multi-tenant], [Lokalizace], [On-premise],[NRZP],

  [Teamio], [✓], [Částečně], [Částečně], [✓], [✗],[✗],
  [Recruitis], [✓], [Částečně], [Částečně], [✓], [✗],[✗],
  [Datacruit], [✓], [Částečně], [Částečně], [✗], [✓],[✗],
  [Onbee], [✗], [✓], [Částečně], [✓], [✓],[✗],
  [SAP SuccessFactors], [✓], [✓], [✓], [Částečně], [✗],[✗],
  [Workday], [✓], [✓], [✓], [✗], [✗],[✗],
  [Oracle HCM], [✓], [✓], [✓], [✗], [✗],[✗],
),
  caption: [Zjednodušená tabulka porovnávající produkty dle předem definovaných kritérií]
) 

== Návrh softwarové architektury

#pad(x: 0.7cm, top: 0.15cm)[
  #set text(size: 15.5pt, fill: rgb("#1F2937"))
  - Návrh vycházel z BPMN analýzy procesů P01–P05, identifikovaných problémů P1–P10 a požadavků R1–R6.
  - Zvažovány byly čtyři varianty: klasický monolit, modulární monolit, microservices-first a hybridní přístup.
  - Jako nejvhodnější se ukázal hybridní model: transakční jádro zůstává kompaktní, ale výpočetně náročné a integračně odlišné části jsou odděleny.
  - Doménové jádro je navrženo podle principů DDD a hexagonální architektury (Ports and Adapters), aby byly jasné hranice modulů a integrací.
  - Pro spolehlivé zpracování vedlejších efektů návrh počítá s outbox patternem a message brokerem jako základem asynchronní komunikace.
  - Architektura současně podporuje multi-tenantní izolaci dat, auditovatelnost, integrační připravenost a on-premise provoz.

  #v(0.22cm)
  #block(fill:  cmyk(0%, 60%, 100%, 0%), radius: 4pt, inset: (x: 12pt, y: 8pt), width: 100%)[
    #text(size: 11.2pt, weight: "bold", fill: white, [Výsledek: Hybridní DDD modulární monolit s hexagonální architekturou])
  ]
]

== Návrh softwarové architektury - Diagram

#place(
  top + center,
  dx: 0pt,
  dy: 50pt,
)[
  #image("architecture-design-16x9.svg", width: 85%)
]


== Zjednodušený pohled na datovou vrstvu

#place(
  top + center,
  dx: 0pt,
  dy: 70pt,
)[
  #image("conceptual-data-model.svg", width: 105%,)
]

== Implementace - Diagram


#place(
  top + center,
  dx: 0pt,
  dy: 50pt,
)[
  #image("architecture-implementation-16x9.svg", width: 100%)
]

= Ukázka výsledků implementace

#figure(
  image(
    "/assets/ai_analysis.png",
    width: 100%,
  ),
  caption: [Detail uchazeče v záložce AI analýza]
) <obr:process-p02>
#figure(
  image(
    "/assets/ai_generate.png",
    width: 100%,
  ),
  caption: [Generování nabídky v administračním rozhraní]
) <obr:process-p02>
#figure(
  image(
    "/assets/job_postings_public.png",
    width: 100%,
  ),
  caption: [Seznam nabídek s možností filtrace]
) <obr:process-p02>
#figure(
  image(
    "/assets/job_posting.png",
    width: 100%,
  ),
  caption: [Detail nabídky]
) <obr:process-p02>
#figure(
  image(
    "/assets/outbox_onboarding.png",
    width: 100%,
  ),
  caption: [Oddělení aplikační podpory vidí i servisní události]
) <obr:process-p02>

#figure(
  image(
    "/assets/workflow_builder.png",
    width: 100%,
  ),
  caption: [Uživatelsky definovatelné procesy a kroky v procesu (pre)(on)boardingu]
) <obr:process-p02>


== Nasazení do testovacího/produkčního prostředí
#pad(x: 0.7cm, top: 0.15cm)[
  #set text(size: 15.4pt, fill: rgb("#1F2937"))
  - Image-based deployment model, mění se až runtime konfigurace prostředí.
  - Testovací a produkční prostředí. 
  - Aplikační host nese `hr-backend`, `migration`, interní adaptéry. Další host nese `PostgreSQL`, `RabbitMQ` a oddělený host je i pro `SeaweedFS` a `Umami`.
  - Vrstva inteligentního zpracování běží taky odděleně na samostatném hostu. (4 kontejnery).
  - Rozdíl mezi prostředími konfigurace, integrační endpointy, dimenzování a tajné údaje.
  - Dohledová vrstvá je též na separátním hostu.
  - Riziko nefunkčního nasazení snižují `healthcheck` popřípadě centralizované logy a metriky.
]

== Obecný proces nasazení služby
1. Publikuji release tag `vX.Y.Z` do Gitea.
2. `Gitea Actions` provede validaci tagu, testy a build image.
3. Hotový image je publikován do interní registry `docker.kzcr.eu`.
4. Workflow vytvoří minimální deploy bundle (`compose.yaml`, `.env`, skripty) a přenese jej přes `SSH`.
5. Na cílovém hostu proběhne `docker login` a `docker compose pull`.
6. U backendu se před startem API spouští `migration` jako quality gate pro databázové schéma.
7. Nasazení se dokončí přes `docker compose up -d --remove-orphans`.


== Uživatelské testování a zpětná vazba 
- Metodika: moderované uživatelské testování s respondenty (minimálně jeden za každou roli a závod)
- Metriky: počet dokončení, doba dokončení, chybovost, SUS skóre, komentáře uživatelů.
- Testovací scénáře
  - S1 Publikace pracovní pozice
  - S2 Zpracování přihlášky
  - S3 Plánování pohovoru
  - S4 Konverze uchazeče → zaměstnanec
  - S5 Onboarding kroky
  - S6 Náborový report
  - S7 Notifikace

== Výstup uživatelského testování

- TBA (komunikace napříč několikero nemocnicemi bolí :) a nemám posbíráno ode všech)


== Závěr
- *Procesní analýza* a optimalizace (BPMN), identifikace a eliminace míst, co nejvíce zdržují proces.

- Návrh softwarové architektury a použitých technologií. 

- Implementace karierního portálu, ATS (správa uchazečů), (pre)a(on)boardingového portálu a modulu vzdělání (národní registry NRZP, ČLK, komunikace s ÚZIS).

- Důraz na izolovanost dat, auditní stopu a granulární řízení přístupu k datům. 

- Integrace *lokálního generativního systému* do tohoto projektu (AI pre-screening, tvorba nabídky práce, dotazovaní přirozeným jazykem pro manažery). 

- Uživatelské testování.

- Nasazení do testovacího/produkčního prostředí.
