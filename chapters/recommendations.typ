#import "../template/abbreviations.typ": abbr

 TODO: ZMIGROVAL JSEM NA HYBRIDA TROCHU DŘÍVE NEŽ ZA 18 MESÍCU URPAVIT KAPITOLU A PŘIDAT ČÁST ZALOŽENOU NA FEEDBACKU

Tato kapitola navazuje na výsledky analýzy, architektonického návrhu, implementace, nasazení a uživatelského ověření systému a zabývá se návrhem jeho dalšího směřování. Cílem je definovat realistickou rozvojovou trajektorii, která zachová procesní přínos řešení pro #abbr("KZ", none), sníží provozní rizika a současně vytvoří předpoklady pro dlouhodobou škálovatelnost.


Navrhovaný rozvoj vychází ze tří klíčových principů. Prvním je preference kroků s přímým dopadem na náborovou a adaptační efektivitu. Druhým je zachování architektonické konzistence. Třetím je provozní bezpečnost, která předpokládá inkrementální zavádění nových funkcionalit a jejich průběžné vyhodnocování na základě měřitelných dopadů.

== Prioritizační rámec rozvoje
Pro potřeby plánování jsem další vývoj rozdělil do tří fází. Do krátkodobé (stabilizace a konsolidace), střednědobé (funkční rozšíření a vyšší automatizace) a dlouhodobé (strategická evoluce platformy). Toto členění umožňuje oddělit okamžitě realizovatelné kroky od změn, které vyžadují širší organizační nebo integrační připravenost.

Prioritizace rozvojových témat vychází z vazby na požadavky R1-R6 a NF01-NF12. Nejvyšší prioritu mají oblasti, které současně posilují provozní stabilitu (NF04, NF05), bezpečnost a auditovatelnost (NF01, NF11) a datově podložené řízení procesů (R6). Do této úrovně spadá rovněž stabilizace AI vrstvy, jelikož její dostupnost přímo ovlivňuje klíčové funkce systému.

== Krátkodobá fáze (0 - 6 měsíců)
Tato fáze by měla být zaměřena primárně na stabilizaci produkčního provozu a odstranění nejednoznačností mezi návrhem a provozní realitou. První prioritou je sjednocení monitorování a vyhodnocování provozu napříč aplikační a AI vrstvou, zejména rozšíření sledování výkonových a provozních ukazatelů služeb, `cv-processor` a `job-processor`, tak aby všechny kritické procesní toky byly měřitelné jednotným způsobem. Tím vznikne předpoklad pro řízení dostupnosti a výkonu na základě dlouhodobě sbíraných dat namísto nahodilé diagnostiky.

Druhou prioritou je formalizace provozního modelu AI uzlu. V této fázi je vhodné standardizovat pravidla restartu služeb, nastavit jasná pravidla opakování neúspěšných požadavků, definovat kapacitní limity zpracovatelských front a stanovit scénáře chování systému při nedostupnosti AI uzlu. Cílem není rozšiřování funkcionality, ale dosažení předvídatelného chování systému v běžných i zhoršených provozních podmínkách.

Třetí oblastí krátkodobého rozvoje je bezpečnostní a provozní hygiena prostředí. Zahrnuje zejména zpřísnění správy tajných údajů, pravidelnou rotaci přístupových klíčů, omezení přístupu ke konfiguračním artefaktům a systematické ověřování obnovitelnosti záloh. Tyto kroky mají vysoký přínos vzhledem k nízké implementační náročnosti a přímo podporují požadavky NF01, NF07 a NF11.

== Střednědobá fáze (6 - 18 měsíců)

V této fázi je vhodné zaměřit se na funkční rozšíření systému v oblastech s nejvyšším dopadem na procesní efektivitu.

První oblastí je rozvoj pokročilé analytiky a reportingu, tedy rozšíření přehledových nástrojů o prediktivní a srovnávací ukazatele na úrovni závodů, oddělení a typů pozic. Tím se posílí schopnost vedení systematicky vyhodnocovat průchodnost náborového procesu a kvalitu adaptačních programů v čase.

Druhou oblast představuje další rozvoj integračních vazeb systému, zejména ve vztahu k externím registrům a navazujícím interním agendám (Vema, Plánování služeb, atd.). Klíčové je zachovat oddělení doménového modelu od konkrétních externích rozhraní a preferovat jasně definované integrační rozhrarní. Tento přístup omezuje závislost na třetích stranách a snižuje riziko narušení systému při změnách externích služeb.

Třetí oblastí je zvýšení míry automatizace vstupní agendy a adaptační fáze. Prakticky jde o rozšíření pravidlových upozornění, automatickou eskalaci při prodlení a sjednocení způsobu vyhodnocování adaptačních milníků. Přínosem je omezení administrativních prodlev a vyšší transparentnost odpovědností jednotlivých rolí v procesu.

== Dlouhodobá fáze (18+ měsíců)
Dlouhodobý rozvoj by měl být veden jako řízená evoluce architektury podle reálných provozních dat. Pokud bude dlouhodobě potvrzena nerovnoměrná zátěž nebo odlišný  rytmus vydávání některých domén, lze zvážit postupnou extrakci vybraných částí modulárního monolitu do hybridního modelu. Tento krok však dává smysl pouze při splnění podmínky, že přínos vyšší autonomnosti převáží nárůst integrační a provozní složitosti.

Dalším směrem je také rozvoj datového governance rámce. Jak přibývá historických dat, je potřeba mít jednotné definice, kvalitní popisy dat a jasně daná pravidla, kdo k nim může přistupovat. Bez těchto pravidel by se postupně zhoršovala přehlednost a spolehlivost výstupů pro management a rozhodování by bylo méně důvěryhodné.

== Návrh fází realizace a klíčových milníků
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
      [0 - 6 měsíců], [Sjednocené monitorování a stabilizace AI uzlu], [Vyšší provozní predikovatelnost], [R6, NF04, NF05, NF08],
      [0 - 6 měsíců], [Bezpečnostní posílení konfigurace a záloh], [Snížení provozního a bezpečnostního rizika], [NF01, NF07, NF11],
      [6 - 18 měsíců], [Rozšířené reporty a procesní analytika], [Datově podložené řízení], [R6, NF12],
      [6 - 18 měsíců], [Prohloubení integračních vazeb], [Vyšší míra automatizace], [R5, NF12],
      [18+ měsíců], [Evoluce k hybridní architektuře dle provozních dat], [Lepší škálovatelnost kritických domén], [R3, R4, NF05, NF08],
      [18+ měsíců], [Odolnost a kapacitní škálování AI vrstvy], [Stabilní výkon AI funkcí], [R5, R6, NF04, NF05],
    )
  ],
  caption: [Doporučený plán směřování vývoje]
) <tab:roadmap-dalsi-rozvoj>

== Řízení změny a organizační předpoklady
Úspěch dalšího rozvoje nebude záviset pouze na technických rozhodnutích, ale i na organizační schopnosti změnu stabilně řídit. Klíčové je zavést pravidelný cyklus vyhodnocení plánu, ve kterém budou zahrnuty role vývoje, provozu a business vlastníků procesů. Bez tohoto mechanismu hrozí, že priorita technických aktivit se odchýlí od reálných potřeb personálního provozu.

Dalším předpokladem je průběžná práce s uživatelskou zpětnou vazbou v režimu řízené iterace. Prakticky to znamená, že návrhy změn budou validovány na reprezentativních uživatelských scénářích ještě před plošným nasazením. Tento postup snižuje riziko regresí použitelnosti a podporuje vyšší adopci systému napříč odštěpnými závody.

== Závěrečné doporučení kapitoly
Z pohledu dalšího směřování vývoje je vhodné postupovat evolučně, nikoli revolučně. Prioritou má být stabilizace a měřitelnost provozu, následně cílené funkční rozšiřování a teprve poté strukturální architektonické změny. Takto zvolený postup maximalizuje pravděpodobnost, že systém bude dlouhodobě plnit cíle digitalizace náboru a adaptace bez nadměrného provozního rizika.

Navržený plán umožňuje reagovat na budoucí změny organizačních potřeb #abbr("KZ", none), aniž by docházelo k narušení základních architektonických principů stanovených v této práci.
