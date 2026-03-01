#import "../template/abbreviations.typ": abbr

== Východiska a cíl dalšího rozvoje
Návrh dalšího směřování vývoje navazuje na výsledky analýzy, architektonického návrhu, implementace, nasazení a uživatelského ověření systému. Cílem této kapitoly je definovat realistickou rozvojovou trajektorii, která zachová procesní přínos řešení pro #abbr("KZ", none), sníží provozní rizika a současně vytvoří předpoklady pro dlouhodobou škálovatelnost.

Navrhovaný rozvoj respektuje tři klíčové principy. Prvním je kontinuita business hodnoty, tedy preference kroků s přímým dopadem na náborovou a adaptační efektivitu. Druhým je architektonická konzistence, tj. rozvoj bez narušení návrhových kontraktů definovaných v kapitole 4. Třetím je provozní bezpečnost, která vyžaduje, aby nové funkcionality byly zaváděny inkrementálně a s průběžným měřením dopadů.

== Prioritizační rámec rozvoje
Pro potřeby plánování byl další vývoj rozdělen do tří horizontů: krátkodobého (stabilizace a konsolidace), střednědobého (funkční rozšíření a vyšší automatizace) a dlouhodobého (strategická evoluce platformy). Toto členění umožňuje oddělit okamžitě realizovatelné kroky od změn, které vyžadují širší organizační nebo integrační připravenost.

Prioritizace rozvojových témat vychází z vazby na požadavky R1-R6 a NF01-NF12. Nejvyšší prioritu mají oblasti, které současně posilují provozní stabilitu (NF04, NF05), bezpečnost a auditovatelnost (NF01, NF11) a datově podložené řízení procesů (R6). Do stejné priority spadá i stabilizace distribuované AI vrstvy, protože její dostupnost přímo ovlivňuje část klíčových funkcí systému.

== Krátkodobý horizont (0-6 měsíců)
Krátkodobá etapa by měla být zaměřena primárně na stabilizaci produkčního provozu a odstranění nejednoznačností mezi návrhem a provozní realitou. První prioritou je sjednocení observability kontraktu napříč aplikační a AI vrstvou, zejména rozšíření metrického pokrytí backendu, `cv-processor` a `job-processor` tak, aby byly všechny kritické toky měřitelné jednotným způsobem. Tím vznikne předpoklad pro přesnější řízení dostupnosti a výkonu na základě trendových dat místo ad hoc diagnostiky.

Druhou prioritou je formalizace provozního modelu distribuované AI infrastruktury s GPU akcelerací (NVIDIA A10, 24 GB VRAM). V této etapě je vhodné standardizovat pravidla restartu služeb, timeout/retry politiku integračních volání, kapacitní limity front a explicitní fallback scénáře pro stav, kdy AI uzel není dostupný. Cílem není maximalizace funkční šíře, ale predikovatelné chování systému při běžných i degradačních stavech.

Třetí oblastí krátkodobého rozvoje je bezpečnostní a provozní hygiena prostředí. Zahrnuje zejména zpřísnění správy tajných údajů, pravidelnou rotaci přístupových klíčů, omezení přístupu ke konfiguračním artefaktům a systematické ověřování obnovitelnosti záloh. Tyto kroky mají vysoký přínos vzhledem k nízké implementační náročnosti a přímo podporují požadavky NF01, NF07 a NF11.

== Střednědobý horizont (6-18 měsíců)
Ve střednědobé etapě je vhodné akcentovat funkční rozšíření systému v oblastech s nejvyšším dopadem na procesní efektivitu. První linií je rozvoj pokročilé analytiky a reportingu, tj. rozšíření dashboardů o prediktivní a srovnávací metriky na úrovni závodů, oddělení a typů pozic. Tím se posílí schopnost managementu vyhodnocovat průchodnost náborového funnelu a kvalitu adaptačních programů v čase.

Druhou linií je dokončení integračního potenciálu systému, zejména ve vazbě na externí registry a navazující interní agendy. Zde je klíčové zachovat anti-corruption princip a preferovat kontraktově řízené integrace, aby rozvoj nevedl k přílišné vazbě doménového modelu na konkrétní externí API. Tento přístup udrží nízkou integrační křehkost i při změnách třetích stran.

Třetí linií je zvýšení míry automatizace vstupní agendy a adaptace. Prakticky jde o posílení pravidlových notifikací, automatickou eskalaci při prodlení a standardizaci průběžného vyhodnocení adaptačních milníků. Přínosem je zkrácení administrativních prodlev a vyšší transparentnost odpovědnosti jednotlivých rolí v procesu.

== Dlouhodobý horizont (18+ měsíců)
Dlouhodobý rozvoj by měl být veden jako řízená evoluce architektury podle reálných provozních dat. Pokud bude dlouhodobě potvrzena nerovnoměrná zátěž nebo odlišný release rytmus některých domén, lze zvážit postupnou extrakci vybraných částí modulárního monolitu do hybridního modelu. Tento krok však dává smysl pouze při splnění podmínky, že přínos vyšší autonomnosti převáží nárůst integrační a provozní složitosti.

Současně je vhodné připravit vícevrstvý model provozní odolnosti AI části, tj. scénáře pro škálování inference kapacity, případnou redundanci AI uzlu a oddělení latenčně citlivých interaktivních úloh od dávkových výpočtů. V dlouhodobém výhledu může tato oblast výrazně ovlivnit kvalitu uživatelské zkušenosti i celkové provozní náklady.

Strategickým směrem je také rozvoj datového governance rámce. Se zvyšujícím se objemem historických dat roste význam standardizace datových definic, kvality metadat a pravidel přístupu k analytickým datům. Bez těchto pravidel by postupně klesala konzistence manažerských výstupů a snižovala se důvěryhodnost rozhodování založeného na datech.

== Návrh etapizace a milníků
Pro zvýšení realizovatelnosti je účelné převést uvedené směry do etapizovaných milníků s jasnou odpovědností a vyhodnocením dopadu.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.1fr, 1.8fr, 1.7fr, 1.7fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Horizont], [Milník], [Primární přínos], [Vazba na požadavky],
      [0-6 měsíců], [Sjednocená observability a stabilizace AI provozu], [Vyšší provozní predikovatelnost], [R6, NF04, NF05, NF08],
      [0-6 měsíců], [Bezpečnostní hardening konfigurace a záloh], [Snížení provozního a bezpečnostního rizika], [NF01, NF07, NF11],
      [6-18 měsíců], [Rozšířené reporty a procesní analytika], [Datově podložené řízení], [R6, NF12],
      [6-18 měsíců], [Prohloubení integračních vazeb], [Vyšší míra automatizace], [R5, NF12],
      [18+ měsíců], [Evoluce k hybridní architektuře dle provozních dat], [Lepší škálovatelnost kritických domén], [R3, R4, NF05, NF08],
      [18+ měsíců], [Odolnost a kapacitní škálování AI vrstvy], [Stabilní výkon AI funkcí], [R5, R6, NF04, NF05],
    )
  ],
  caption: [Doporučená etapizace dalšího směřování vývoje]
) <tab:roadmap-dalsi-rozvoj>

== Řízení změny a organizační předpoklady
Úspěch dalšího rozvoje nebude záviset pouze na technických rozhodnutích, ale i na organizační schopnosti změnu stabilně řídit. Klíčové je zavést pravidelný cyklus vyhodnocení roadmapy, ve kterém budou společně zastoupeny role vývoje, provozu a business vlastníků procesů. Bez tohoto mechanismu hrozí, že priorita technických aktivit se odchýlí od reálných potřeb personálního provozu.

Dalším předpokladem je průběžná práce s uživatelskou zpětnou vazbou v režimu řízené iterace. Prakticky to znamená, že návrhy změn budou validovány na reprezentativních uživatelských scénářích ještě před plošným nasazením. Tento postup snižuje riziko regresí použitelnosti a podporuje vyšší adopci systému napříč odštěpnými závody.

== Závěrečné doporučení kapitoly
Z pohledu dalšího směřování vývoje je vhodné postupovat evolučně, nikoli revolučně. Prioritou má být stabilizace a měřitelnost provozu, následně cílené funkční rozšiřování a teprve poté strukturální architektonické změny. Takto zvolený postup maximalizuje pravděpodobnost, že systém bude dlouhodobě plnit cíle digitalizace náboru a adaptace bez nadměrného provozního rizika.

Navržená roadmapa zároveň zachovává strategickou flexibilitu: umožňuje reagovat na budoucí změny organizačních potřeb #abbr("KZ", none), aniž by docházelo k narušení základních architektonických principů stanovených v této práci.
