#import "../template/abbreviations.typ": abbr
Architektura navrženého řešení musela odpovědět na praktickou otázku, jak digitalizovat nábor a adaptaci v prostředí, které je současně organizačně členité, regulatorně citlivé a infrastrukturně omezené provozem na vlastní infrastruktuře. Nešlo tedy o návrh obecně elegantního systému, ale o takovou architekturu, která bude obhajitelná vzhledem k požadavkům KZ a zároveň dlouhodobě udržitelná.

== Východiska návrhu a volba architektury
Architektonická rozhodnutí jsem odvozoval přímo z provozního kontextu #abbr("KZ", none). Organizace není nově vznikající podnik budovaný od nuly s jedním produktem a jedním týmem. Jde o organizaci se sedmi odštěpnými závody, regulovanými daty, různorodými uživatelskými rolemi a omezenými provozními kapacitami. Z toho plyne, že architektura musí být nejen technicky správná, ale i bezpečně provozovatelná a srozumitelná pro další rozvoj.

Klíčovým architektonickým požadavkem je víceorganizační izolace dat (R1). Každý závod musí pracovat se svými daty, ale centrální vedení potřebuje průřezový pohled. Tento požadavek proto nelze řešit jen na úrovni oprávnění v uživatelském rozhraní. Musí být propsán do datového modelu, aplikačních služeb i do způsobu, jakým se vyhodnocují přístupová pravidla. Vedle toho musí systém pokrýt celý tok od zveřejnění pozice přes nábor a vstupní agendu až po adaptaci zaměstnance (R2–R4). Současně musí být připraven na napojení externích služeb (R5) a poskytovat data pro řízení procesu (R6).

Z kvalitativních atributů popsaných v literatuře @bass2003software jsem kladl největší důraz na bezpečnost, auditovatelnost a provozní udržitelnost. V prostředí zdravotnictví není auditní stopa doplňkem, ale základní podmínkou důvěryhodnosti systému. Stejně tak lokální provoz znamená, že nemohu spoléhat na komfort spravovaných cloudových služeb. Architektura proto musí minimalizovat zbytečnou distribuovanou složitost a současně připustit řízený růst tam, kde je skutečně potřebný.

Pro volbu cílové architektury bylo nejprve nutné oddělit dvě úrovně rozhodování, které se v praxi často směšují. První se týká vnitřního uspořádání jedné aplikace. V této úrovni je relevantní zejména vrstvené oddělení odpovědností, modulární členění podle doménových celků a obecně snaha o oddělení doménové logiky od infrastruktury a technologických detailů. Tyto principy jsou podrobně popsány v literatuře zaměřené na softwarovou architekturu a návrh systémů @bass2003software @vernonImplementingDomainDrivenDesign2013 @cockburnHexagonalArchitecture2005.


Druhá úroveň se týká celkové kompozice řešení, tedy otázky, zda budou jeho části provozovány jako jeden celek, nebo jako více samostatných běhových komponent se všemi důsledky distribuované architektury, které jsou podrobně diskutovány v odborné literatuře @newmanBuildingMicroservices2019. Tyto dvě úrovně si nekonkurují. První určuje, jak chránit doménu před infrastrukturou, druhá rozhoduje, kolik distribuované složitosti je účelné přijmout. Toto rozlišení odráží běžné rozdělení architektonických rozhodnutí na návrh vnitřní struktury aplikace a návrh jejího celkového uspořádání.

@tab:arch-variants proto neporovnává vrstvenou, modulární a hexagonální architekturu mezi sebou. Porovnává pouze varianty celkové kompozice řešení. Klasický monolit, modulární monolit, plně mikroslužbový přístup a hybridní model. Smyslem tohoto srovnání je určit, jaký celek je pro podmínky #abbr("KZ", none) přiměřený z hlediska provozu, integrací a dalšího rozvoje.

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
[Klasický monolit], [Jednoduchý vývoj, nasazení a provoz v počáteční fázi.], [Růst vnitřních vazeb a horší dlouhodobá udržitelnost.],
[Modulární monolit], [Provozní jednoduchost při zachování jasnějších doménových hranic.], [Nutnost důsledně hlídat hranice modulů a závislosti.],
[Přístup s mikroslužbami], [Nezávislý vývoj, nasazení a škálování jednotlivých částí.], [Vysoká distribuovaná složitost a provozní režie.],
[Hybridní model], [Stabilní transakční jádro lze doplnit o samostatné části s odlišnými nároky.], [Nutnost řídit integrační kontrakty a provozní hranice mezi komponentami.],
)
],
caption: [Porovnání variant celkové kompozice řešení]
) <tab:arch-variants>

Klasický monolit by sice zjednodušil první implementační kroky, ale postupně by narušil jasné vymezení hranic mezi náborovou logikou, integracemi, auditem a analytickými funkcemi. Plně mikroslužbový přístup by naopak od začátku vnesl síťovou komunikaci, distribuované selhávání a vyšší provozní režii do projektu, který je vyvíjen iterativně a s omezenými kapacitami (pouze autor práce) @newmanBuildingMicroservices2019. 

Modulární monolit proto představuje nejvhodnější základ pro _transakční část_ řešení, tedy část systému zodpovědnou za správu hlavních doménových dat, řízení náborového procesu a zajištění jejich konzistence. Umožňuje explicitní vymezení hranic mezi jednotlivými doménovými moduly. Tím omezuje vznik přímých závislostí mezi částmi systému a snižuje riziko postupného prorůstání náborové logiky, auditu, integrací a adaptačních procesů. Méně vhodný je však v částech, kde se výrazně liší běhový profil, výkonové nároky nebo knihovní závislosti, zejména u inteligentního zpracování životopisů a pracovních pozic.

Jako nejlepší řešení se proto ukázal hybridní model. Na úrovni celku tvoří základ modulární transakční jádro provozované jako jeden hlavní backend. Uvnitř tohoto jádra se současně uplatňuje hexagonální uspořádání a principy doménově řízeného návrhu (Domain-Driven Design, dále jen DDD), které umožňují oddělit doménovou logiku od databáze, komunikační vrstvy a externích služeb. Mimo jádro jsou vyčleněny pouze ty části, které mají odlišný běhový profil nebo jiné integrační nároky.

Tento přístup vede k rozdělení systému na několik samostatně nasaditelných komponent s odlišnými odpovědnostmi. Hlavní proces náboru a adaptace zůstává v jednom transakčním jádře, které zajišťuje konzistentní práci s identitou, oprávněními, organizačními hranicemi a stavem procesu.

Naopak komponenty pro inteligentní zpracování dat a některé integrační služby (např. ověření kvalifikace nebo interní vyhledávání uživatelů) jsou vyčleněny mimo toto jádro, protože nejsou součástí kritické transakční logiky. Jejich oddělení umožňuje nezávislé nasazování a úpravy bez zásahu do hlavní aplikační logiky, aniž by byla ohrožena konzistence hlavních dat nebo průběh klíčových procesů.

Cenou za tento přístup je vyšší návrhová i provozní náročnost než u čistého monolitu. Systém obsahuje více integračních kontraktů, více samostatně nasazovaných komponent a vyšší nároky na monitorování. Přínosem je naopak výrazně lepší oddělení domény, integrací a infrastruktury, a tedy i vyšší udržitelnost a schopnost dlouhodobého rozvoje řešení v prostředí, kde nelze předpokládat stabilní soubor požadavků ani jednoduchý provoz.

== Celkový obraz řešení
Prvním krokem je zachytit systém v kontextu rolí a vnějších služeb. Tím se vyjasní, proč řešení nevzniklo jako jedna univerzální interní aplikace, ale jako soustava více vstupních bodů nad společným transakčním a integračním jádrem.

Z @obr:arch-context je patrné, že systém obsluhuje několik odlišných skupin uživatelů s různými cíli a různou mírou oprávnění. Uchazeči vstupují přes veřejný kariérní portál, interní náborová agenda je soustředěna do administračního portálu a nástup se sledováním adaptace do portálu pro řízení nástupu nad stejným doménovým jádrem. Na straně vnějších vazeb jsou rozhodující jednotné přihlašování prostřednictvím protokolu `OIDC`, #abbr("NRZP", "Národní registr zdravotnických pracovníků") a e-mailová infrastruktura. Právě tyto závislosti potvrzují, že řešení musí být navrženo jako integrační uzel, nikoli jen jako izolovaná evidence.
#figure(
  image(
    "../procesy/architecture/system-context-overview.svg",
    width: 100%,
  ),
  caption: [Systém v kontextu rolí a externích služeb]
) <obr:arch-context>



Na kontextový pohled navazuje logická kompozice řešení. Jejím smyslem není popsat konkrétní nasazovací topologii ani technologickou skladbu, ale ukázat, z jakých stavebních bloků se systém skládá a proč jsou hranice mezi nimi vedeny právě tímto způsobem.

Systém musí současně zvládat transakční agendu náboru a adaptace, komunikaci s okolními službami, výpočetně náročné zpracování i průběžné vyhodnocování procesu. Pokud by se tyto odpovědnosti soustředily do jedné vrstvy, docházelo by ke prolínání stabilní domény s proměnlivými integračními a analytickými požadavky, což by vedlo ke ztrátě přehlednosti i rozšiřitelnosti.

#figure(
  image(
    "../procesy/architecture/solution-composition.svg",
    width: 100%,
  ),
  caption: [Logická kompozice řešení]
) <obr:arch-composition>



Na tuto situaci odpovídá řešení zobrazené na @obr:arch-composition. V centru návrhu stojí transakční jádro náboru a adaptace, které nese doménová pravidla a hlavní procesní tok. K němu se připojuje prezentační vrstva obsluhující veřejný kariérní portál i interní rozhraní, datová vrstva uchovávající stav procesu, samostatná vrstva předávání zpráv pro asynchronní přeposílání úloh a událostí, integrační vrstva zajišťující řízený kontakt s okolím, auditní stopa pro dohledatelnost změn a oddělená vrstva s inteligentním zpracováním dat. Diagram záměrně abstrahuje od konkrétních technologií, protože jejich realizační rozpad patří až do implementační kapitoly.

Návrh vychází přímo z požadavků R1–R6. Požadavky R2–R4 definují tři navazující situace (veřejný vstup, interní řízení, adaptace), což vede k oddělení prezentační vrstvy od jednotného transakčního jádra. Požadavek R1 pak promítá strukturu KZ do datové vrstvy, která tak nese nejen stav systému, ale i organizační kontext.

Oddělení řídicí a analytické vrstvy je klíčové. Systém nemá pouze evidovat průběh náboru a adaptace, ale také poskytovat podklady pro jeho řízení a průběžné zlepšování. Proto do této vrstvy patří nejen vyhodnocování průchodnosti náboru a adaptace, ale i analytika kariérního portálu. Ta umožňuje sledovat, jak se potenciální uchazeči na portálu chovají, kde ztrácejí pozornost, ve kterých krocích proces opouštějí a které části nabídky nebo formulářů snižují míru dokončení přihlášky. Právě proto je tato vrstva oddělena od technického provozního dohledu. Provozní dohled odpovídá na otázku, zda systém běží zdravě, zatímco řídicí a analytická vrstva vysvětluje, co se v náborovém procesu skutečně děje.

Samostatné zachycení auditní stopy je přímou odpovědí na problém P4, tedy absenci auditní stopy v původním procesu, i na nefunkční požadavek NF11. V logické kompozici ji proto nevedu jako další podnikovou oblast, ale jako podpůrnou architektonickou schopnost systému. Auditní událost vzniká v jádře, je předána přes vrstvu předávání zpráv a následně trvale uložena do datové vrstvy. Tím zůstává audit mimo hlavní cestu požadavků a současně je zachována dohledatelnost změn nad klíčovými entitami.

Stejně podstatná je integrační vrstva. Její role nespočívá jen v napojení na #abbr("NRZP", none), které přímo vychází z požadavku R5. Stejně důležitá je schopnost bezpečně připojovat i další okolní systémy a služby, které se promítají do každodenního provozu náboru a adaptace, například identitní služby, `VEMA`, národní registry nebo komunikační infrastrukturu. Nejde tedy o jednu konkrétní integraci, ale o řízenou hranici mezi transakčním jádrem a cizími systémy. Transakční jádro zde pouze vyjadřuje, jakou schopnost od okolí potřebuje, například vyhledat kvalifikaci, interního uživatele nebo ověřit identitu, zatímco integrační vrstva přebírá odpovědnost za cizí protokol, datový model i chybové stavy vnější služby. Smyslem této vrstvy je převzít integrační složitost na sebe, aby se nepropisovala přímo do transakční logiky.

Vedle ní stojí vrstva předávání zpráv, která neřeší, na jaký vnější systém se systém napojuje, ale jak jsou úlohy a události předávány mimo hlavní transakční tok.

== Struktura backendu <sec:arch-backend-structure>
V předchozí části byl systém popsán na úrovni logické kompozice, tedy jako soubor hlavních částí řešení a jejich odpovědností. Tento pohled ukazuje, jak do sebe zapadají veřejné portály, transakční jádro, integrační vrstva, vrstva předávání zpráv, analytická část, auditní stopa a provozní dohled.

Nejcitlivější částí celého řešení je ono transakční jádro, protože právě v něm se setkávají doménová pravidla, datové hranice, bezpečnost i integrace. Hlavním rizikem zde bylo postupné prolínání byznysové logiky s technologickými detaily, například s obsluhou HTTP požadavků, databázovým schématem nebo integračními klienty. Jedním z běžných přístupů je klasická vrstvená architektura, v níž se řadiče, služby a repozitáře skládají podle technických vrstev. Ta je srozumitelná a rychlá na počáteční implementaci, ale v systému s dlouhou životností často vede k nepřímé závislosti domény na databázi a k rozptýlení pravidel mezi aplikační kód, SQL dotazy a integrační obsluhu.

Jádro jsem proto navrhl na hexagonální architektuře, kterou Cockburn popsal jako vzor portů a adaptérů (Ports and Adapters) @cockburnHexagonalArchitecture2005. Motivací tohoto vzoru je oddělit aplikační logiku od uživatelského rozhraní, databáze a dalších zařízení tak, aby systém bylo možné testovat, provozovat i rozvíjet bez přímé závislosti na konkrétní technologii. V praktickém smyslu to znamená, že doménová pravidla nesmějí být uzamčena v řadiči požadavků (controller), v rámci pro zpracování HTTP požadavků ani v databázovém ovladači. Přínosem pro #abbr("KZ", none) je udržitelnější transakční jádro, které lze rozvíjet i při změnách datové vrstvy, integračních služeb nebo uživatelských portálů. Kompromisem je větší počet explicitních kontraktů a nutnost důsledně mapovat data na hranicích jádra.

Klíčová asymetrie této architektury neleží mezi „horní" prezentační a „spodní" datovou vrstvou, ale mezi vnitřkem a vnějškem aplikace @cockburnHexagonalArchitecture2005. Port v tomto pojetí nepředstavuje síťový port, nýbrž účelově definovaný kontrakt komunikace mezi jádrem a jeho okolím. K jednomu portu přitom může existovat více adaptérů, například produkční HTTP vstup, konzolový přístup nebo náhradní implementace trvalého uložení dat pro integrační testy @cockburnHexagonalArchitecture2005. Tento přístup je důležitý ze tří důvodů. Zaprvé udržuje víceorganizační kontext pod kontrolou od vstupu do systému až po datovou vrstvu. Zadruhé chrání doménu před přímou závislostí na integračních detailech, které se mohou v čase měnit. Zatřetí vytváří čitelnou strukturu, kterou lze dlouhodobě rozvíjet i bez velkého specializovaného architektonického týmu.

V terminologii této práce proto označuji adaptéry, které aplikaci řídí zvenku dovnitř, jako primární adaptéry, zatímco adaptéry vykonávající požadavky jádra směrem do infrastruktury označuji jako sekundární adaptéry. Primární adaptér převádí vnější signál na volání případu užití (use-case, např. _vrať seznam uchazečů_), kdežto sekundární adaptér implementuje port definovaný jádrem a překládá jeho požadavek do konkrétního protokolu, rozhraní nebo technologie trvalého uložení. Současně je důležité odlišit architektonickou hranici od hranice nasazovací. Hexagonální architektura sama o sobě neznamená, že každý adaptér musí být samostatná služba. Naopak většina adaptérů běží uvnitř jednoho backendového procesu a samostatně odděluji jen ty části, jejichž běhový profil, provozní charakteristiky nebo integrační režim se od jádra skutečně liší.

Hexagonální uspořádání v mém návrhu současně využívá vybrané principy doménově řízeného návrhu (DDD). Jde zejména o členění podle významových oblastí systému, práci s doménovými pravidly uvnitř modulů a oddělení vnitřní části backendu od infrastrukturních detailů. Na hranici s okolím proto jádro komunikuje přes porty a adaptéry. Port vyjadřuje, co jádro potřebuje, zatímco adaptér přebírá odpovědnost za převod na konkrétní rozhraní nebo technologii @evansDDDReference2015.

#figure(
  image(
    "../procesy/architecture/hexagonal-principle.svg",
    width: 100%,
  ),
  caption: [Obecný princip hexagonální architektury]
) <obr:arch-hexagon-principle>

Obecný princip zachycený na @obr:arch-hexagon-principle se v implementovaném backendu promítá do oddělení vstupních adaptérů, aplikační logiky, portů a výstupních adaptérů. Vstupní adaptéry přijímají HTTP požadavky, integrační události a další vnější signály a převádějí je na volání aplikačních služeb nebo případů užití. Porty představují kontrakty, kterými aplikační logika vyjadřuje požadavky na okolí. Výstupní adaptéry tyto porty naplňují konkrétním napojením na databázi, outbox a vrstvu zpráv, audit, autorizaci, objektové úložiště, e-mail a vnější registry. Detailnější rozpad těchto hranic je kvůli čitelnosti přesunut do přílohy @obr:arch-backend-detail.

Vnitřní část backendu je členěna podle významových oblastí personálního systému, například náboru, pracovních pozic, pohovorů, zaměstnanců, dokumentů, onboardingu, organizací, číselníků, oprávnění, kvalifikací, provozních pohledů a kontaktních dotazů. Toto členění není pouhým seskupením souborů, ale praktickým rozdělením odpovědností. Pravidla zůstávají v modulech, porty popisují potřebné okolní schopnosti a adaptéry zajišťují napojení na konkrétní technologii.

== Datový model
Datový model v návrhu nese hlavní architektonické hranice systému. Finální fyzický model databáze je výrazně podrobnější a čítá 62 tabulek, protože kromě doménových entit obsahuje také číselníky, spojovací tabulky, auditní stopu, outbox, evidenci souborů, notifikace, idempotenci a další podpůrné struktury. Převzetí úplného fyzického schématu do hlavního textu by proto zhoršilo čitelnost návrhu a zakrylo vazby, které jsou pro architekturu podstatné.

Z tohoto důvodu používám zjednodušený konceptuální model, který abstrahuje od implementačních detailů a ukazuje pouze rozhodující vazby. Organizace představuje základní jednotku pro oddělení dat mezi jednotlivými částmi systému. Systém rozlišuje interní uživatele (např. vedoucí pracovníky, náboráře a HR) a externí uživatele v podobě uchazečů, přičemž každá skupina má odlišné role a oprávnění. Pracovní inzerát pak tvoří hlavní procesní uzel náboru. Na něj se vážou uchazeči, pohovory, stavové změny (posuzováno, dokončil pohovor a další) a následně i přechod do evidence zaměstnance. Díky tomu model zachycuje celý životní cyklus od reakce na inzerát až po adaptaci, aniž by se při přijetí uchazeče ztratil organizační kontext nebo návaznost přístupových práv. Přístupová práva nejsou určena pouze rolí uživatele, ale také jeho vztahem k jednotlivým entitám (např. příslušností k organizaci nebo vazbou na konkrétní inzerát), čímž model odpovídá principům #abbr("ReBAC","relationship-based access control").

Adaptace je v modelu oddělena jako vztah mezi obecnou šablonou postupu a konkrétní instancí nad zaměstnancem. Tím lze měnit pravidla adaptačního procesu bez narušení historického průběhu již zahájených nástupů. Podpůrné evidence, například soubory, auditní záznamy, outbox nebo analytické výstupy nad životopisy a pozicemi, nejsou v konceptuálním modelu hlavní doménou. Přesto jsou důležité, protože zajišťují dohledatelnost, zpracování vedlejších efektů a práci s dokumenty mimo samotné transakční jádro.

@obr:er-diagram shrnuje tyto bloky na konceptuální úrovni. Nejde o úplný ER diagram databáze, ale o záměrně redukovaný pohled na model, který ukazuje, jak na sebe navazují hlavní oblasti systému.

#figure(
  image(
    "../procesy/architecture/conceptual-data-model.svg",
    width: 100%,
  ),
  caption: [Zjednodušený konceptuální model hlavních entit a vztahů]
) <obr:er-diagram>

== Rámec bezpečnosti a spolehlivosti
Tato část neurčuje konkrétní implementaci bezpečnostních kontrol, ale vymezuje architektonický rámec, který musí implementace respektovat. Systém pracuje s citlivými personálními údaji, více organizačními jednotkami a uživateli s rozdílným rozsahem odpovědnosti. Rizikem proto není pouze neoprávněné přihlášení, ale také příliš široké zpřístupnění dat, neprokazatelnost změn a tiché selhání navazujících integračních nebo asynchronních procesů.

V praxi se často používá jednodušší přístup založený na lokálních účtech, globálních rolích a dodatečném filtrování podle organizace. Ta by však v prostředí #abbr("KZ", none) vedla k duplicitní správě identit a nedostatečně přesnému vyjádření vztahu uživatele ke konkrétnímu zdroji. Architektura proto odděluje přihlášení přes organizační #abbr("SSO", none)/`OIDC`, globální roli a vztahové řízení přístupu (#abbr("ReBAC", none)). Tím vytváří oporu pro NF01, NF02 a NF03, zatímco realizační detaily tohoto modelu jsou rozvedeny až v implementační kapitole.

Součástí rámce je také auditovatelnost operací nad citlivými daty (NF11). Audit není v tomto kontextu chápán pouze jako technický log, ale jako schopnost zpětně doložit, kdo provedl podstatnou změnu v náborovém nebo adaptačním procesu a v jakém kontextu k ní došlo

Bezpečnostní rámec doplňuje rámec provozní spolehlivosti. Dostupnost a odezva nejsou vlastnosti, které lze prokázat pouze návrhem modulů nebo testy. Vyžadují průběžné měření běžícího systému. Proto architektura počítá se samostatnou dohledovou vrstvou, která sbírá logy, metriky a stavy integračních komponent mimo doménovou logiku. Tato vrstva vytváří základ pro pozdější ověřování dostupnosti podle NF04 a výkonnostního profilu podle NF05.

#figure(
  image(
    "../procesy/architecture/seq-observability.svg",
    width: 100%,
  ),
  caption: [Tok dat v monitorovací vrstvě od aplikace po vizualizaci]
) <obr:seq-observability>

Vedle samotného sběru dat navrhuji i dvě kategorie výstražných mechanismů. Provozní výstrahy mají zachytit zhoršení dostupnosti nebo odezvy klíčových koncových bodů rozhraní. Výstrahy vázané na cílové úrovně služby (Service Level Objectives, SLO) pak sledují zdraví asynchronní vrstvy, například stáří nejstarší nevyřízené zprávy nebo počet zpráv, které selhaly po maximálním počtu pokusů. Smyslem této vrstvy není produkovat další přehledové panely, ale poskytnout včasný signál o odchylce systému od očekávaného chování.
