#import "../template/abbreviations.typ": abbr

Architektura navrženého řešení musela odpovědět na praktickou otázku, jak digitalizovat nábor a adaptaci v prostředí, které je současně organizačně členité, regulatorně citlivé a provozně omezené infrastrukturou provozovanou v prostorách organizace (on-premise). Nešlo tedy o návrh obecně elegantního systému, ale o takovou architekturu, která bude obhajitelná vůči požadavkům Krajské zdravotní, a.s. a zároveň zůstane dlouhodobě udržitelná.

== Východiska návrhu a volba architektury
Architektonická rozhodnutí jsem odvozoval přímo z provozního kontextu #abbr("KZ", none). Organizace není nově vznikající podnik budovaný od nuly s jedním produktem a jedním týmem. Jde o holding se sedmi odštěpnými závody, regulovanými daty, různorodými uživatelskými rolemi a omezenými provozními kapacitami. Z toho plyne, že architektura musí být nejen technicky správná, ale i srozumitelná pro další rozvoj a bezpečně provozovatelná.

Nejsilnějším strukturálním požadavkem je víceorganizační izolace dat (R1). Každý závod musí pracovat se svými daty, ale centrální vedení potřebuje průřezový pohled. Tento požadavek proto nelze řešit jen na úrovni oprávnění v uživatelském rozhraní. Musí být propsán do datového modelu, aplikačních služeb i do způsobu, jakým se vyhodnocují přístupová pravidla. Vedle toho musí systém pokrýt celý tok od zveřejnění pozice přes nábor a vstupní agendu až po adaptaci zaměstnance (R2–R4), být připraven na napojení externích služeb (R5) a poskytovat data pro řízení procesu (R6).

Z kvalitativních atributů @bass2003software jsem kladl největší důraz na bezpečnost, auditovatelnost a provozní udržitelnost. V prostředí zdravotnictví není auditní stopa doplňkem, ale základní podmínkou důvěryhodnosti systému. Stejně tak lokální provoz znamená, že nemohu spoléhat na komfort spravovaných cloudových služeb. Architektura proto musí minimalizovat zbytečnou distribuovanou složitost a současně připustit řízený růst tam, kde je skutečně potřebný.

Pro volbu cílové architektury bylo nejprve nutné oddělit dvě úrovně rozhodování, které se v praxi často směšují. První se týká vnitřního uspořádání jedné aplikace. Zde je relevantní vrstvené oddělení odpovědností @bass2003software, modulární členění podle doménových celků @vernonImplementingDomainDrivenDesign2013 a hexagonální vymezení hranice mezi jádrem a okolím prostřednictvím portů a adaptérů @cockburnHexagonalArchitecture2005.

Druhá úroveň se týká celkové kompozice řešení, tedy otázky, zda budou jeho části provozovány jako jeden celek, nebo jako více samostatných běhových komponent se všemi důsledky distribuované architektury @newmanBuildingMicroservices2019. Tyto dvě úrovně si nekonkurují. První určuje, jak chránit doménu před infrastrukturou, druhá rozhoduje, kolik distribuované složitosti je účelné přijmout.

Tabulka @tab:arch-variants proto neporovnává vrstvenou, modulární a hexagonální architekturu mezi sebou. Porovnává pouze varianty celkové kompozice řešení. Klasický monolit, modulární monolit, plně mikroslužbový přístup a hybridní model. Smyslem tohoto srovnání je určit, jaký celek je pro podmínky #abbr("KZ", none) přiměřený z hlediska provozu, integrací a dalšího rozvoje.

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

Klasický monolit by sice zjednodušil první implementační kroky, ale rychle by rozostřil hranice mezi náborovou logikou, integracemi, auditem a analytickými funkcemi. Plně mikroslužbový přístup by naopak od začátku vnesl síťovou komunikaci, distribuované selhávání a vyšší provozní režii do projektu, který je vyvíjen iterativně a s omezenými kapacitami @newmanBuildingMicroservices2019. Samotný modulární monolit proto vycházel jako nejvhodnější základ pro transakční část řešení, protože udržuje jeden autoritativní stav pro identitu, oprávnění, audit i workflow. Méně vhodný by však byl tam, kde se mění běhový profil, výkonové nároky nebo knihovní závislosti, zejména u inteligentního zpracování životopisů a pracovních pozic.

Jako nejlepší řešení se proto ukázal hybridní model. Na úrovni celku tvoří základ modulární transakční jádro provozované jako jeden hlavní backend. Uvnitř tohoto jádra se současně uplatňuje hexagonální uspořádání a principy doménově řízeného návrhu (Domain-Driven Design, dále jen DDD), protože pomáhají oddělit stabilnější doménu od databáze, vrstvy předávání zpráv a externích služeb. Mimo jádro jsou vyčleněny pouze ty části, které mají odlišný běhový profil nebo jiné integrační nároky, konkrétně komponenty `cv_processor` a `job_processor`.

Pro víceorganizační, auditovatelný a lokálně provozovaný systém je tento model vhodný právě proto, že odlišuje různé zdroje složitosti. Hlavní proces náboru a adaptace potřebuje jedno autoritativní jádro, v němž se konzistentně vyhodnocují organizační hranice, identita, oprávnění i auditní stopa. Naopak procesory pro inteligentní zpracování dat a některé integrační okraje mohou být odděleny bez toho, aby se rozpadla transakční konzistence domény. Lokální provoz současně zvýhodňuje omezený počet kritických běhových komponent, protože každý další distribuovaný prvek zvyšuje nároky na dohled, zálohování a řešení incidentů.

Cenou za tento přístup je vyšší návrhová i provozní náročnost než u čistého monolitu. Systém obsahuje více integračních kontraktů, více nasazovacích hranic a vyšší nároky na monitorování. Přínosem je naopak výrazně lepší oddělení domény, integrací a infrastruktury, a tedy i vyšší udržovatelnost a schopnost dlouhodobého rozvoje řešení v prostředí, kde nelze předpokládat stabilní soubor požadavků ani jednoduchý provoz.

== Celkový obraz řešení
Prvním krokem je zachytit systém v kontextu rolí a vnějších služeb. Tím se vyjasní, proč řešení nevzniklo jako jedna univerzální interní aplikace, ale jako soustava více vstupních bodů nad společným transakčním a integračním jádrem.

Z @obr:arch-context je patrné, že systém obsluhuje několik odlišných skupin uživatelů s různými cíli a různou mírou oprávnění. Uchazeči vstupují přes veřejný kariérní portál, interní náborová agenda je soustředěna do administračního portálu a nástup se sledováním adaptace do portálu pro řízení nástupu nad stejným doménovým jádrem. Na straně vnějších vazeb jsou rozhodující jednotné přihlašování #abbr("SSO", none) prostřednictvím protokolu `OIDC`, #abbr("NRZP", "Národní registr zdravotnických pracovníků") a e-mailová infrastruktura. Právě tyto závislosti potvrzují, že řešení musí být navrženo jako integrační uzel, nikoli jen jako izolovaná evidence.
#figure(
  image(
    "../procesy/architecture/system-context-overview.svg",
    width: 100%,
  ),
  caption: [Systém v kontextu rolí a externích služeb]
) <obr:arch-context>



Na kontextový pohled navazuje logická kompozice řešení. Jejím smyslem není popsat konkrétní nasazovací topologii ani technologickou skladbu, ale ukázat, z jakých stavebních bloků se systém skládá a proč jsou hranice mezi nimi vedeny právě tímto způsobem.

#figure(
  image(
    "../procesy/architecture/solution-composition.svg",
    width: 100%,
  ),
  caption: [Logická kompozice řešení]
) <obr:arch-composition>

Systém musí současně zvládat transakční agendu náboru a adaptace, komunikaci s okolními službami, výpočetně náročné zpracování i průběžné vyhodnocování procesu. Pokud by se tyto odpovědnosti soustředily do jedné vrstvy, docházelo by ke směšování stabilní domény s proměnlivými integračními a analytickými požadavky, což by vedlo ke ztrátě přehlednosti i rozšiřitelnosti.

Na tuto situaci odpovídá @obr:arch-composition. V centru návrhu stojí transakční jádro náboru a adaptace, které nese doménová pravidla a hlavní procesní tok. K němu se připojuje prezentační vrstva obsluhující veřejný kariérní portál i interní rozhraní, datová vrstva uchovávající stav procesu, samostatná vrstva předávání zpráv (messaging) pro asynchronní přeposílání úloh a událostí, integrační vrstva zajišťující řízený kontakt s okolím, auditní stopa pro dohledatelnost změn a oddělená vrstva s inteligentím zpracováním dat. Diagram záměrně abstrahuje od konkrétních technologií, protože jejich realizační rozpad patří až do implementační kapitoly. Na architektonické úrovni je důležité obhájit logiku hranic, nikoli vyjmenovat každou nasazenou službu.

Návrh vychází přímo z požadavků R1–R6. Požadavky R2–R4 definují tři navazující situace (veřejný vstup, interní řízení, adaptace), což vede k oddělení prezentační vrstvy od jednotného transakčního jádra. Požadavek R1 pak promítá holdingovou strukturu KZ do datové vrstvy, která tak nese nejen stav systému, ale i organizační kontext.

Oddělení řídicí a analytické vrstvy je klíčové. Systém nemá pouze evidovat průběh náboru a adaptace, ale také poskytovat podklady pro jeho řízení a průběžné zlepšování. Proto do této vrstvy patří nejen vyhodnocování průchodnosti náboru a adaptace, ale i analytika kariérního portálu. Ta umožňuje sledovat, jak se potenciální uchazeči na portálu chovají, kde ztrácejí pozornost, ve kterých krocích proces opouštějí a které části nabídky nebo formulářů snižují míru dokončení přihlášky. Právě proto je tato vrstva oddělena od technického provozního dohledu. Provozní dohled odpovídá na otázku, zda systém běží zdravě, zatímco řídicí a analytická vrstva vysvětluje, co se v náborovém procesu skutečně děje.

Samostatné zachycení auditní stopy je přímou odpovědí na problém P4, tedy absenci auditní stopy v původním procesu, i na nefunkcionální požadavek NF11. V logické kompozici ji proto nevedu jako další podnikovou oblast, ale jako podpůrnou architektonickou schopnost systému. Auditní událost vzniká v jádře, je předána přes vrstvu předávání zpráv a následně trvale uložena do datové vrstvy. Tím zůstává audit mimo hlavní cestu požadavků a současně je zachována dohledatelnost změn nad klíčovými entitami.

Stejně podstatná je integrační vrstva. Její role nespočívá jen v napojení na #abbr("NRZP", none), které přímo vychází z požadavku R5. Stejně důležitá je schopnost bezpečně připojovat i další okolní systémy a služby, které se promítají do každodenního provozu náboru a adaptace, například identitní služby, `VEMA`, národní registry nebo komunikační infrastrukturu. Nejde tedy o jednu konkrétní integraci, ale o řízenou hranici mezi transakčním jádrem a cizími systémy. Transakční jádro zde pouze vyjadřuje, jakou schopnost od okolí potřebuje, například vyhledat kvalifikaci, interního uživatele nebo ověřit identitu, zatímco integrační vrstva přebírá odpovědnost za cizí protokol, datový model i chybové stavy vnější služby. Smyslem této vrstvy je převzít integrační složitost na sebe, aby se nepropisovala přímo do transakční logiky.

Vedle ní stojí vrstva předávání zpráv, která neřeší, na jaký vnější systém se systém napojuje, ale jak jsou úlohy a události předávány mimo hlavní transakční tok.

== Struktura backendu
V předchozí části byl systém popsán na úrovni logické kompozice, tedy jako soubor hlavních částí řešení a jejich odpovědností. Tento pohled ukazuje, jak do sebe zapadají veřejné portály, transakční jádro, integrační vrstva, vrstva předávání zpráv, analytická část, auditní stopa a provozní dohled.

Nejcitlivější částí celého řešení je backend, protože právě v něm se setkávají doménová pravidla, datové hranice, bezpečnost i integrace. Jádro backendu proto stavím na hexagonální architektuře, kterou Cockburn popsal jako vzor portů a adaptérů (Ports and Adapters) @cockburnHexagonalArchitecture2005. Motivací tohoto vzoru je oddělit aplikační logiku od uživatelského rozhraní, databáze a dalších zařízení tak, aby systém bylo možné testovat, provozovat i rozvíjet bez přímé závislosti na konkrétní technologii. V praktickém smyslu to znamená, že doménová pravidla nesmějí být uzamčena v řadiči požadavků (controller), v rámci pro zpracování HTTP požadavků ani v databázovém ovladači.

Klíčová asymetrie této architektury neleží mezi „horní" prezentační a „spodní" datovou vrstvou, ale mezi vnitřkem a vnějškem aplikace @cockburnHexagonalArchitecture2005. Port v tomto pojetí nepředstavuje síťový port, nýbrž účelově definovaný kontrakt komunikace mezi jádrem a jeho okolím. K jednomu portu přitom může existovat více adaptérů, například produkční HTTP vstup, konzolový přístup nebo náhradní implementace trvalého uložení dat pro integrační testy @cockburnHexagonalArchitecture2005. Tento přístup je důležitý ze tří důvodů. Zaprvé udržuje víceorganizační kontext pod kontrolou od vstupu do systému až po datovou vrstvu. Zadruhé chrání doménu před přímou závislostí na integračních detailech, které se mohou v čase měnit. Zatřetí vytváří čitelnou strukturu, kterou lze dlouhodobě rozvíjet i bez velkého specializovaného architektonického týmu.

V terminologii této práce proto označuji adaptéry, které aplikaci řídí zvenku dovnitř, jako primární adaptéry, zatímco adaptéry vykonávající požadavky jádra směrem do infrastruktury označuji jako sekundární adaptéry. Primární adaptér převádí vnější signál na volání případu užití (use case), kdežto sekundární adaptér implementuje port definovaný jádrem a překládá jeho požadavek do konkrétního protokolu, rozhraní nebo technologie trvalého uložení. Současně je důležité odlišit architektonickou hranici od hranice nasazovací. Hexagonální architektura sama o sobě neznamená, že každý adaptér musí být samostatná služba. Naopak většina adaptérů běží uvnitř jednoho backendového procesu a samostatně odděluji jen ty části, jejichž běhový profil, provozní charakteristiky nebo integrační režim se od jádra skutečně liší.

Hexagonální uspořádání v mém návrhu současně doplňují principy doménově řízeného návrhu (DDD). Doménové moduly jsou vedeny jako ohraničené kontexty s vlastním modelem a slovníkem, protože význam pojmů je v doménovém návrhu vždy platný jen uvnitř explicitně vymezené hranice @evansDomaindrivenDesignTackling2003 @evansDDDReference2015. Na styku s vnějšími službami proto integrační vrstva plní roli překladové mezivrstvy. Doména pracuje se svým modelem, zatímco adaptér přebírá odpovědnost za převod z cizího rozhraní a zpět @evansDDDReference2015.

#figure(
  image(
    "../procesy/architecture/hexagonal-principle.svg",
    width: 100%,
  ),
  caption: [Obecný princip hexagonální architektury]
) <obr:arch-hexagon-principle>

Obecný princip zachycený na @obr:arch-hexagon-principle se v backendu promítá do konkrétní struktury. Primární adaptéry na vstupu aplikace převádějí HTTP požadavky a integrační události na případy užití domény. Uvnitř aplikace zůstává doménová vrstva členěná do ohraničených kontextů a komunikuje s okolím pouze prostřednictvím explicitních kontraktů portů. Sekundární adaptéry pak zajišťují napojení na databázi, vrstvu předávání zpráv, audit, autorizaci a vnější registry.

#figure(
  image(
    "../procesy/architecture/backend-structure.svg",
    width: 100%,
  ),
  caption: [Návrh hranic backendu v hexagonálním uspořádání]
) <obr:arch-backend>

@obr:arch-backend neslouží jako inventář implementačních složek, ale jako návrh hlavních hranic backendu. Ukazuje, že vstupní adaptéry řídí vstup do systému, doménové jádro nese případy užití a ohraničené kontexty, porty vymezují povolené závislosti a sekundární adaptéry připojují databázi, vrstvu předávání zpráv, audit, bezpečnost a okolní služby. Smyslem tohoto rozdělení je udržet stabilnější doménovou logiku uvnitř a proměnlivější integrační infrastrukturu na hraně systému.

== Datový model a integrační toky
Architektonická rozhodnutí by zůstala neúplná, pokud by se nepropsala i do datového modelu. Reálné schéma obsahuje přibližně šedesát tabulek a řadu vazeb, pro hlavní výklad je však důležitější jeho konceptuální kostra než úplný inventář všech struktur. V této části proto nepopisuji všechny tabulky, ale vysvětluji, jakými objekty systém zachycuje organizační rámec, nábor, přijetí a adaptaci pracovníka.

Nejvyšším rámcem modelu je organizace. Každý klíčový záznam je k některé organizaci vztažen přímo nebo nepřímo, takže víceorganizační členění není jen pravidlo v aplikaci, ale vlastnost samotných dat. Vedle organizace stojí interní uživatel jako nositel identity. Jeho globální role říká, jaký typ uživatele v systému vystupuje, ale sama o sobě neurčuje, ke kterým datům smí přistoupit. To zajišťuje až členství v organizaci, které vyjadřuje vztah ke konkrétnímu závodu, a evidence oprávnění ke zdrojům, která jemněji vymezuje přístup k pracovním pozicím a k navázaným záznamům. Právě tato kombinace identity, členství a oprávnění umožňuje oddělit data jednotlivých závodů a současně zachovat centrální dohled.

V náborové oblasti je nutné odlišit pracovní roli a pracovní pozici. Pracovní role představuje obecný typ místa, například druh profese nebo zařazení. Pracovní pozice naproti tomu představuje konkrétní otevřené místo vypsané jednou organizací v určitém čase. Právě pracovní pozice je hlavním procesním objektem náboru. Nese vazbu na organizaci, odkazuje na pracovní roli, může využívat předem definovaný adaptační postup a stává se bodem, k němuž se vztahují další data. Na pracovní pozici se vážou uchazeči a k jednotlivým uchazečům se dále vážou pohovory, změny stavů a další rozhodnutí v průběhu výběrového řízení. Jinými slovy: organizace vypisuje pracovní pozici, pracovní role ji typizuje, na pozici reaguje uchazeč a nad uchazečem se evidují pohovory a další náborové kroky.

Zlom mezi náborem a následnou adaptací nenastává vznikem zcela nové evidence, ale přechodem v rámci téhož životního cyklu. Pokud je uchazeč přijat, systém jej nepovažuje za izolovaný historický záznam, ale převádí jej do evidence interního uživatele, respektive zaměstnance. Tím vzniká výslovná vazba mezi přihláškou, výběrovým řízením a následným nástupem do zaměstnání. Pro data je to důležité ze dvou důvodů. Jednak lze zpětně dohledat celý průběh od první reakce na inzerát až po adaptaci, jednak se při přechodu nepřerušuje organizační kontext ani návaznost oprávnění.

Samostatný doménový blok tvoří adaptace. Zde je nutné odlišit definici adaptačního postupu od jeho konkrétního průběhu. První rovina popisuje šablonu. Jaké kroky má nový pracovník splnit, v jakém pořadí, za jakých podmínek a jaké dokumenty mohou být požadovány. Druhá rovina zachycuje skutečný průběh adaptace konkrétního zaměstnance, tedy co už bylo splněno, co čeká na doplnění a kdo za daný krok odpovídá. Adaptační proces má tedy podobu obecného postupu na jedné straně a jeho konkrétní instance na straně druhé. Dokumenty zaměstnance jsou v této oblasti vedeny jako samostatná, ale úzce navázaná skupina dat. Nejsou to jen přílohy, ale důkazy splnění konkrétních povinností v průběhu nástupu.

Vedle hlavního rámce systém obsahuje i doplňkovou větev zájemců o práci bez vazby na konkrétní pracovní pozici. Tato evidence má vlastní údaje, preference a přílohy, ale z hlediska modelu představuje vedlejší vstup do náboru, nikoli jeho hlavní větev. Podobně technické evidence, jako jsou soubory, auditní záznamy, asynchronní vedlejší účinky nebo analytické výsledky nad životopisy a pozicemi, nejsou jádrem konceptuálního modelu. Jsou pro provoz systému nezbytné, ale slouží především jako podpůrná vrstva nad hlavní doménou, a proto je zjednodušený diagram záměrně neukazuje.
TODO: Tohle šoupnu spíše asi do implementace? nebo já nevím TODOTDO
Součástí datového návrhu však není jen to, co se ukládá, ale i jak dlouho má být která informace uchována. U neúspěšných uchazečů proto architektura nepočítá s neomezenou retencí osobních údajů. Po uplynutí zákonné nebo souhlasem vymezené lhůty se jejich data nestávají běžnou historickou evidencí, ale kandidátem na řízenou anonymizaci nebo výmaz. To je důležité i modelově. Identifikační a kontaktní údaje, přílohy a volné texty musí být oddělitelné od metadat o průběhu procesu tak, aby bylo možné odstranit osobní obsah a současně nezničit nutný provozní nebo statistický kontext.

Takový zásah nelze provádět ručně a izolovaně jen v jedné tabulce, protože údaje uchazeče zasahují do příloh, poznámek, auditní stopy i navazujících asynchronních úloh. Návrh proto předpokládá řízenou skartační operaci vedenou jako doménovou událost. Transakční vrstva označí záznam k anonymizaci nebo výmazu, vrstva odloženého odeslání zajistí navazující kroky nad souborovým úložištěm a dalšími službami a auditní vrstva uloží důkaz, že ke skartačnímu zásahu došlo, aniž by sama dále uchovávala původní osobní obsah. V auditní stopě tak zůstává informace o typu operace, čase a technickém identifikátoru zásahu, nikoli plná data, která měla být odstraněna.

Obrázek @obr:er-diagram schematicky shrnuje výše popsané bloky a jejich nejdůležitější vazby. Jednotlivé obdélníky proto nepředstavují vždy jedinou fyzickou tabulku, ale spíše jednu část domény nebo skupinu úzce souvisejících entit.

#figure(
  image(
    "../procesy/architecture/conceptual-data-model.svg",
    width: 100%,
  ),
  caption: [Zjednodušený diagram hlavních entit a vztahů]
) <obr:er-diagram>


Pružnou část modelu představují adaptační formuláře a odpovědi zaměstnanců, které ukládám jako `jsonb`. Důvodem je, že obsah těchto kroků se může měnit podle role, pracoviště i interních pravidel a čistě relační model by zde vedl k častým změnám schématu kvůli drobným úpravám formulářů. Výhodou je větší pružnost, omezením přesun části validačních pravidel do aplikační logiky.

Zvláštní roli mají také vektorové reprezentace životopisů a pracovních pozic, které ukládám pomocí `pgvector` přímo v `PostgreSQL`. Sémantické vyhledávání tak zůstává součástí stejného datového prostředí jako transakční agenda, což zjednodušuje správu a udržuje vazbu mezi běžnými daty a analytickými výstupy.

Na takto vymezený datový model přímo navazuje způsob, jakým systém komunikuje s okolními službami a jak provádí vedlejší události. Integrační vrstvu proto navrhuji jako kombinaci synchronní a asynchronní komunikace. Synchronní volání používám tam, kde uživatel očekává okamžitou odezvu, například při práci s administračním rozhraním nebo při generování konkrétního výstupu. Asynchronní komunikaci naopak využívám pro vedlejší události a časově náročnější operace, u nichž by blokování požadavku zhoršovalo použitelnost systému. Podrobný průběh této kombinace, včetně vzoru odloženého odeslání (transactional outbox) a návaznosti na vrstvu inteligentního zpracování dat, rozvádím až v implementační kapitole. Cenou za tento model je složitější dohled nad tím, zda byly navazující události opravdu provedeny a v jakém pořadí. Právě proto je asynchronní komunikace v návrhu úzce svázána s auditní a dohledovou vrstvou.

Pro komunikaci směrem ke klientské aplikaci architektura počítá s mechanismem serverem zasílaných událostí (Server-Sent Events, `SSE`) pro průběžné informování o stavu operací. Ten umožňuje zobrazovat změny nebo postup zpracování bez nutnosti opakovaného dotazování ze strany klienta a zároveň nezatěžuje systém plně obousměrnou komunikací.

== Rámec bezpečnosti a spolehlivosti
Jakmile systém propojuje více rolí, více závodů a citlivé personální údaje, stává se bezpečnostní architektura jedním z rozhodujících kritérií návrhu. Bezpečnost se tedy řeší ve třech vrstvách a to jako ověření totožnosti (autentizace), řízení přístupu (autorizace) a datový rozsah. Ověření totožnosti je řešeno prostřednictvím protokolu OpenID Connect (`OIDC`) s napojením na jednotné přihlašování (#abbr("SSO", none)) organizace, aby interní uživatelé nemuseli spravovat oddělené identity pouze pro tento systém. Tento krok zároveň snižuje provozní režii spojenou se správou účtů.

Řízení přístupu nestavím jen na klasickém modelu rolí (RBAC, Role-Based Access Control), ale na kombinaci globálních rolí a řízení přístupu na základě vztahů (ReBAC, Relationship-Based Access Control). Vedl mě k tomu proces, kde vedoucí pracovník může potřebovat přístup jen k jedné konkrétní pozici nebo skupině kandidátů, nikoli k celému závodu. Samotná role tak popisuje typ uživatele, zatímco vztah ke zdroji rozhoduje o skutečném rozsahu dat.

Součástí bezpečnostního návrhu je i princip nejnižších oprávnění a auditovatelnost operací nad citlivými daty (NF11). Změny nad klíčovými entitami musí být zpětně dohledatelné, a to nejen kvůli bezpečnosti, ale i kvůli schopnosti vysvětlit průběh náboru nebo adaptace při interním přezkumu.

Bezpečnostní vrstva však sama nestačí. V prostředí s lokální infrastrukturou je stejně důležité včas rozpoznat, že se systém začíná odchylovat od očekávaného chování. Proto architekturu uzavírá samostatná vrstva provozního dohledu. Kombinace nástrojů `Promtail`, `Loki`, `Prometheus` a `Grafana` umožňuje sběr protokolů, metrik i jejich společnou interpretaci z jednoho místa, aniž by bylo nutné zasahovat do doménové logiky systému.

#figure(
  image(
    "../procesy/architecture/seq-observability.svg",
    width: 100%,
  ),
  caption: [Tok dat v monitorovací vrstvě od aplikace po vizualizaci]
) <obr:seq-observability>

Vedle samotného sběru dat navrhuji i dva typy výstražných mechanismů. Provozní výstrahy mají zachytit zhoršení dostupnosti nebo odezvy klíčových koncových bodů rozhraní. Výstrahy vázané na cílové úrovně služby (Service Level Objectives, SLO) pak sledují zdraví asynchronní vrstvy, například stáří nejstarší nevyřízené zprávy nebo počet zpráv, které selhaly po maximálním počtu pokusů. Smyslem této vrstvy není produkovat více přehledových panelů, ale dát provozu včasný signál, že se systém začíná odchylovat od očekávaného chování.
