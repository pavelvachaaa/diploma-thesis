#import "../template/abbreviations.typ": abbr

V této kapitole navrhuji cílovou softwarovou architekturu systému pro digitalizaci náboru a adaptace v #abbr("KZ", none). Kapitolu stavím jako čistě návrhovou, tedy zaměřenou na architektonická rozhodnutí, jejich zdůvodnění a vazbu na požadavky definované v analytické části této práce.

== Architektonické cíle a návrhové faktory
Návrh architektury odvozuji přímo od požadavků digitalizace v @tab:pozadavky-digitalizace a od nefunkcionálních požadavků v @tab:nfp. Za hlavní faktory ovlivňující architekturu považuji multi-tenantní izolaci dat mezi odštěpnými závody (R1), podporu celého náborového a adaptačního cyklu (R2-R4), integrační připravenost pro externí zdroje (R5) a datově podložené řízení (R6).

Z pohledu kvalitativních atributů návrh tvořím s důrazem na bezpečnost, auditovatelnost, dostupnost a provozní udržitelnost (NF01, NF04, NF08, NF11). Architekturu proto neřídím pouze podle funkční úplnosti, ale také podle toho, zda je systém dlouhodobě provozovatelný v on-premise režimu (NF07), jestli lze změny zavádět inkrementálně a zda je možné průběžně měřit provozní kvalitu.

== Architektura systému
Na úrovni celkové struktury jsem zvažoval čtyři varianty pro backendovou část projektu. Klasický monolit, modulární monolit, microservices-first a hybridní model. 

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.3fr, 2fr, 1.4fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Varianta], [Silné stránky], [Rizika],
      [Klasický monolit], [Nejnižší počáteční složitost a rychlé zavedení v malé fázi], [Slabé architektonické hranice, horší dlouhodobá udržitelnost a omezená evoluce integračních scénářů],
      [Modulární monolit], [Nízká integrační režie, konzistentní doménový model, rychlejší implementace], [Riziko růstu vnitřní vazby při nekázně modulárních hranic],
      [Microservices-first], [Vysoká autonomnost částí, nezávislé škálování], [Vysoká distribuovaná komplexita a provozní režie pro aktuální fázi projektu],
      [Hybrid], [DDD modulární jádro + separované AI procesory], [Nutnost řídit integrační kontrakty],
    )
  ],
  caption: [Porovnání architektonických variant]
) <tab:arch-variants>

Jako cílový styl volím hybridní architekturu. Doménové jádro je navrženo jako modulární monolit s `DDD + Ports and Adapters` a AI zpracování je odděleno do specializovaných procesorů. Klasický monolit by sice krátkodobě snížil návrhovou složitost, ale v kontextu požadavků R5 a R6 by zvyšoval riziko těsné vazby integračních a analytických částí na transakční jádro. Zvolená hybridní varianta tak lépe vyvažuje rychlost vývoje, provozní kontrolu a možnost postupné evoluce bez předčasného zanášení komplexity mikroslužbami.

=== Vhled do celku systému
Pro úvodní vrstevnatý přehled celého systému jsem vytvořil ArchiMate model, který zachycuje motivaci, byznys, aplikační vrstvu i technologickou infrastrukturu v jednom konzistentním artefaktu. Model slouží jako vstupní orientační mapa před detailními C4 pohledy.

TODO: ZDe obrázek
// #figure(
//   image(
//     "../procesy/deployment/deployment-flow.svg",
//     width: 100%,
//   ),
//   caption: [Sekvenční tok release procesu]
// ) <obr:deployment-flow>
// 
== Hexagonální architektura a doménové hranice (DDD + Ports and Adapters)


== Kontextová architektura (C4 L1)


== Kontejnerová architektura (C4 L2)


== Komponentová architektura backendu (C4 L3)

== Datový návrh

== Integrační a asynchronní architektura
Integrační architekturu navrhuji jako kombinaci synchronních a asynchronních toků. Synchronní komunikaci používám tam, kde je nutná okamžitá odezva uživateli, asynchronní komunikaci volím pro vedlejší efekty a výpočetně náročné operace.

Pro komunikaci směrem k AI prvkům (`job_processor`, `cv_processor`) sjednocuji integrační model na event-driven rozhraní přes `RabbitMQ`. Tím odděluji transakční požadavek uživatele od AI zpracování a zajišťuji, že AI vrstva je provozně škálovatelná a časově decoupled vůči aplikačnímu jádru.

#figure(
  image(
    "../procesy/architecture/seq-ai-async.svg",
    width: 100%,
  ),
  caption: [Sekvenční diagram asynchronního AI toku]
) <obr:seq-ai>

Asynchronní AI tok na @obr:seq-ai stojí na kombinaci `Outbox service` a messaging vrstvy `RabbitMQ`, což zvyšuje odolnost vůči dočasné nedostupnosti externích služeb. Outbox v návrhu chápu jako spolehlivostní hranici mezi doménovou transakcí a vedlejšími efekty, zatímco RabbitMQ tvoří integrační páteř mezi backendem a AI procesory. Důsledkem je vyšší provozní robustnost při zachování přijatelné odezvy uživatelských scénářů.

== Bezpečnostní architektura
Bezpečnostní model navrhuji ve třech vrstvách. Autentizace, autorizace a organizační přístup. Pro autentizaci vycházím z OIDC/SSO integrace, autorizaci řeším rolemi a oprávněními, datovou izolaci pak organizačním kontextem požadavku. Tím naplňuji NF01, NF02 a NF03.

Součástí návrhu je také princip nejnižších oprávnění pro přístup k analytickým výstupům a architektonická podpora auditovatelnosti operací nad klíčovými entitami systému (NF11). Architektura systému proto počítá s mechanismem auditního logování, který umožňuje zpětně dohledat operace provedené nad citlivými daty a zajistit jejich transparentnost a kontrolovatelnost.

== Monitorování systému


== Rizika a mitigace
Architektonický návrh reflektuje i rizika, která mohou ovlivnit dlouhodobou stabilitu řešení. Primárně se jedná o integrační a provozní rizika, nikoliv o rizika implementačního detailu.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.4fr, 1.4fr, 2.2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Riziko], [Dopad], [Návrhová mitigace],
      [Nedostupnost AI serveru], [Degradace AI funkcí], [Oddělený fallback režim, asynchronní zpracování, oddělení od transakčního jádra],
      [Nárůst integrační komplexity], [Vyšší chybovost vazeb], [Jasně vymezené integrační kontrakty a centralizovaná evidence integračních toků],
      [Nedostatečné monitorování], [Pomalá diagnostika incidentů], [Samostatná observability vrstva a definice minimálního monitorovacího pokrytí],
      [Nekázeň modulárních hranic], [Technický dluh v jádru systému], [Jednoznačné odpovědnosti komponent a řízená architektonická pravidla],
      [Rozvolnění tenant scoping pravidel], [Riziko úniku dat], [Povinný organizační kontext v přístupu ke klíčovým entitám a audit přístupových operací],
    )
  ],
  caption: [Hlavní architektonická rizika a mitigace]
) <tab:arch-risks>
