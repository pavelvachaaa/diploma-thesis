#import "../template/abbreviations.typ": abbr

Architektura navrženého řešení musela odpovědět na praktickou otázku, jak digitalizovat nábor a adaptaci v prostředí, které je současně organizačně členité, regulatorně citlivé a provozně omezené on-premise infrastrukturou. Nešlo tedy o návrh obecně elegantního systému, ale o takovou architekturu, která bude obhajitelná vůči požadavkům Krajské zdravotní, a.s. a zároveň zůstane dlouhodobě udržitelná.

== Architektonické východisko a volba cílového stylu
Architektonická rozhodnutí jsem odvozoval přímo z provozního kontextu #abbr("KZ", none). Organizace není startup na zelené louce s jedním produktem a jedním týmem. Jde o holding se sedmi odštěpnými závody, regulovanými daty, heterogenními uživatelskými rolemi a omezenými provozními kapacitami. Z toho plyne, že architektura musí být nejen technicky správná, ale i srozumitelná pro další rozvoj a bezpečně provozovatelná.

Nejsilnějším strukturálním požadavkem je multi-tenantní izolace dat (R1). Každý závod musí pracovat se svými daty, ale centrální vedení potřebuje průřezový pohled. Tento požadavek proto nelze řešit jen na úrovni oprávnění v uživatelském rozhraní. Musí být propsán do datového modelu, aplikačních služeb i do způsobu, jakým se vyhodnocují přístupová pravidla. Vedle toho musí systém pokrýt celý tok od zveřejnění pozice přes nábor a vstupní agendu až po adaptaci zaměstnance (R2-R4), být připraven na napojení externích služeb (R5) a poskytovat data pro řízení procesu (R6).

Z kvalitativních atributů @bass2003software jsem kladl největší důraz na bezpečnost, auditovatelnost a provozní udržitelnost. V prostředí zdravotnictví není auditní stopa doplňkem, ale základní podmínkou důvěryhodnosti systému. Stejně tak on-premise provoz znamená, že nemohu spoléhat na komfort cloudových managed služeb. Architektura proto musí minimalizovat zbytečnou distribuovanou složitost a současně připustit řízený růst tam, kde je skutečně potřebný.

Při volbě architektonického stylu jsem porovnával čtyři varianty: klasický monolit, modulární monolit, přístup microservices-first a hybridní model. Rozhodnutí jsem nevázal na technologickou módnost, ale na to, jak dobře daný přístup unese požadavky na modularitu, integrace, provozní jednoduchost a budoucí rozšiřitelnost.

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
[Modulární monolit], [Nízká integrační režie, konzistentní doménový model, rychlejší implementace], [Riziko růstu vnitřní vazby při nekázni modulárních hranic],
[Microservices-first], [Vysoká autonomnost částí, nezávislé škálování], [Vysoká distribuovaná komplexita a provozní režie pro aktuální fázi projektu],
[Hybrid], [DDD modulární jádro + separované procesory vrstvy inteligentního zpracování dat], [Nutnost řídit integrační kontrakty mezi jádrem a procesory],
)
],
caption: [Porovnání architektonických variant]
) <tab:arch-variants>

Klasický monolit by sice zjednodušil první implementační kroky, ale rychle by rozostřil hranice mezi náborovou logikou, integracemi a analytickými funkcemi. Přístup microservices-first by naopak od začátku vnesl síťovou komunikaci, distribuované selhávání a vyšší provozní režii do projektu, který je vyvíjen iterativně a s omezenými kapacitami @newmanBuildingMicroservices2019. Samotný modulární monolit proto vycházel jako nejpraktičtější základ, ale neřešil dobře oddělení výpočetně náročných částí spojených s inteligentním zpracováním dat.

Jako cílový styl jsem proto zvolil hybridní architekturu. Transakční jádro systému jsem navrhl jako modulární monolit s využitím principů Domain-Driven Design a Ports and Adapters, zatímco vrstvu inteligentního zpracování dat jsem oddělil do specializovaných komponent `cv_processor` a `job_processor`. Výsledkem je kompromis, který zachovává jednoduchost hlavního jádra, ale nepřenáší výpočetní zátěž a integrační rizika do kritické transakční cesty.

Další výklad proto neorganizuji podle jedné univerzální diagramové taxonomie, ale podle otázek, na které musí výsledná architektura odpovědět. Nejprve ukazuji celkový obraz řešení, poté vnitřní strukturu backendu, následně datové a integrační vazby a nakonec bezpečnostní a provozní důsledky zvoleného návrhu. Takový postup lépe odpovídá tomu, co je v této práci skutečně potřeba obhájit.

== Celkový obraz řešení
Prvním krokem je zachytit systém v kontextu rolí a externích služeb. Tím se vyjasní, proč řešení nevzniklo jako jedna univerzální interní aplikace, ale jako soustava více vstupních bodů nad společným transakčním a integračním jádrem.

#figure(
  image(
    "../procesy/architecture/system-context-overview.svg",
    width: 100%,
  ),
  caption: [Systém v kontextu rolí a externích služeb]
) <obr:arch-context>

Z @obr:arch-context je patrné, že systém obsluhuje několik odlišných skupin uživatelů s různými cíli a různou mírou oprávnění. Uchazeči vstupují přes veřejný kariérní portál, interní náborová agenda je soustředěna do administračního portálu a nástup se sledováním adaptace do onboardingového portálu nad stejným doménovým jádrem. Na straně externích vazeb jsou rozhodující `SSO/OIDC`, `NRZP` a e-mailová infrastruktura. Právě tyto závislosti potvrzují, že řešení musí být navrženo jako integrační uzel, nikoli jen jako izolovaná evidence.

Na kontextový pohled navazuje logická kompozice řešení. Jejím smyslem není popsat konkrétní nasazovací topologii ani technologickou skladbu, ale ukázat, z jakých stavebních bloků se systém skládá a proč jsou hranice mezi nimi vedeny právě tímto způsobem.

#figure(
  image(
    "../procesy/architecture/solution-composition.svg",
    width: 84%,
  ),
  caption: [Logická kompozice řešení]
) <obr:arch-composition>

Systém musí současně zvládat transakční agendu náboru a adaptace, komunikaci s okolními službami, výpočetně náročné zpracování i průběžné vyhodnocování procesu. Pokud by se tyto odpovědnosti soustředily do jedné vrstvy, docházelo by ke míchání stabilní domény s proměnlivými integračními a analytickými požadavky, což by vedlo ke ztrátě přehlednosti i rozšiřitelnosti.

Na tuto situaci odpovídá @obr:arch-composition. V centru návrhu stojí transakční jádro náboru a adaptace, které nese business pravidla a hlavní procesní tok. K němu se připojuje prezentační vrstva obsluhující veřejný kariérní portál i interní rozhraní, datová vrstva uchovávající stav procesu, samostatná messaging vrstva pro asynchronní předávání úloh a událostí, integrační vrstva zajišťující řízený kontakt s okolím, auditní stopa pro dohledatelnost změn a oddělená AI vrstva pro výpočetně náročné zpracování. Diagram záměrně abstrahuje od konkrétních technologií, protože jejich realizační rozpad patří až do implementační kapitoly. Na architektonické úrovni je důležité obhájit logiku hranic, ne vyjmenovat každou nasazenou službu.

Návrh vychází přímo z požadavků R1–R6. Požadavky R2–R4 definují tři navazující situace (veřejný vstup, interní řízení, adaptace), což vede k oddělení prezentační vrstvy od jednotného transakčního jádra. Požadavek R1 pak promítá holdingovou strukturu KZ do datové vrstvy, která tak nese nejen stav systému, ale i organizační kontext.

Oddělení řídicí a analytické vrstvy je klíčové. Systém nemá pouze evidovat průběh náboru a adaptace, ale také poskytovat podklady pro jeho řízení a průběžné zlepšování. Proto do této vrstvy patří nejen vyhodnocování průchodnosti náboru a adaptace, ale i analytika kariérního portálu. Ta umožňuje sledovat, jak se potenciální uchazeči na portálu chovají, kde ztrácejí pozornost, ve kterých krocích proces opouštějí a které části nabídky nebo formulářů snižují konverzi. Právě proto je tato vrstva oddělena od technického provozního dohledu. `Provozní dohled` odpovídá na otázku, zda systém běží zdravě, zatímco řídicí a analytická vrstva vysvětluje, co se v náborovém procesu skutečně děje.

Samostatné zachycení auditní stopy je přímou odpovědí na problém `P4`, tedy absenci auditní stopy v původním procesu, i na nefunkcionální požadavek `NF11`. V logické kompozici ji proto nevedu jako další byznysovou oblast, ale jako podpůrnou architektonickou schopnost systému. Auditní událost vzniká v jádře, je předána přes messaging a následně perzistována do datové vrstvy. Tím zůstává audit mimo hlavní cestu požadavků a současně je zachována dohledatelnost změn nad klíčovými entitami.

Stejně podstatná je integrační vrstva. Její role nespočívá jen v napojení na `NRZP`, které přímo vychází z požadavku R5. Stejně důležitá je schopnost bezpečně připojovat i další okolní systémy a služby, které se promítají do každodenního provozu náboru a adaptace, například identitní služby, `VEMA`, národní registry nebo komunikační infrastrukturu. Nejde tedy o jednu konkrétní integraci, ale o řízenou hranici mezi transakčním jádrem a cizími systémy. Transakční jádro zde pouze vyjadřuje, jakou schopnost od okolí potřebuje, například vyhledat kvalifikaci, interního uživatele nebo ověřit identitu, zatímco integrační vrstva přebírá odpovědnost za cizí protokol, datový model i chybové stavy externí služby. Smyslem této vrstvy je převzít integrační složitost na sebe, aby se nepropisovala přímo do transakční logiky.

Vedle ní stojí messaging vrstva, která neřeší, na jaký externí systém se systém napojuje, ale jak jsou úlohy a události předávány mimo hlavní transakční tok. 

== Vrstvy řešení a struktura backendu
Nejcitlivější částí celého řešení je backend, protože právě v něm se setkávají business pravidla, datové hranice, bezpečnost i integrace. Jádro backendu proto stavím na hexagonální architektuře, kterou Cockburn popsal jako vzor Ports and Adapters @cockburnHexagonalArchitecture2005, a současně ji opírám o principy doménově orientovaného návrhu @evansDomaindrivenDesignTackling2003. V praktickém smyslu to znamená, že doménová logika nesmí být závislá na konkrétní databázi, messaging knihovně ani HTTP frameworku a že klíčové procesní pojmy mají vlastní ohraničené kontexty se samostatnou odpovědností.

Tento přístup je důležitý ze tří důvodů. Zaprvé udržuje multi-tenantní a organizační kontext pod kontrolou od vstupu do systému až po datovou vrstvu. Zadruhé chrání doménu před přímou závislostí na integračních detailech, které se mohou v čase měnit. Zatřetí vytváří čitelnou strukturu, kterou lze dlouhodobě rozvíjet i bez velkého specializovaného architektonického týmu.

V návrhu proto rozlišuji vstupní a výstupní hranice. Vstupní adaptéry převádějí vnější požadavky na use-cases domény. V praxi jde o HTTP routy, middleware a konzumenty integračních událostí. Výstupní adaptéry naopak převádějí doménové požadavky do konkrétní infrastruktury, například do práce s `PostgreSQL`, `RabbitMQ`, objektovým úložištěm, `OIDC`, registrem `NRZP` nebo interním vyhledáváním uživatelů. Port zde neoznačuje síťový port, ale pojmenovaný kontrakt mezi jádrem a jeho okolím.

Současně je důležité odlišit architektonickou hranici od hranice nasazovací. Hexagonální architektura sama o sobě neznamená, že každý adaptér musí být samostatná služba. Naopak většina adaptérů běží uvnitř jednoho backendového procesu a samostatně odděluji jen ty části, jejichž runtime, provozní profil nebo integrační režim se od jádra skutečně liší.

#figure(
  image(
    "../procesy/architecture/backend-structure.svg",
    width: 100%,
  ),
  caption: [Struktura backendu a jeho hranice]
) <obr:arch-backend>

Backend je na @obr:arch-backend členěn do čtyř vrstev odpovídajících hexagonálnímu uspořádání. Vstupní adaptéry přijímají požadavky, připravují kontext a předávají řízení do doménových modulů. Doménová vrstva soustřeďuje ohraničené kontexty, jako jsou uchazeči, pracovní pozice, pohovory, zaměstnanci, onboarding nebo notifikace. Port kontrakty určují, jaké schopnosti může doména požadovat od okolí, a platformní adaptéry zajišťují konkrétní napojení na databázi, messaging, audit, autorizaci nebo externí registry. Tím se omezuje šíření skrytých vazeb a současně vzniká jasná hranice mezi stabilnější business logikou a proměnlivější integrační infrastrukturou.

== Datový model a integrační toky
Architektonická rozhodnutí by zůstala neúplná, pokud by se nepropsala i do datového modelu. Ten tvoří přibližně šedesát tabulek organizovaných do sedmi doménových skupin. Cílem této části proto není vypsat celé schéma, ale vysvětlit, jaké logické celky model obsahuje a proč je navržen právě tímto způsobem. Technické detaily migrací a fyzické perzistence rozvádím v následující implementační kapitole.

Základ datového modelu tvoří organizace a návazné členství interních uživatelů. Právě tato skupina entit nese organizační kontext, bez něhož by nebylo možné bezpečně oddělit data jednotlivých závodů a současně zachovat centrální reporting. Další oblast tvoří model pracovních pozic, který propojuje klasifikaci rolí, typy úvazků, vazbu na inzerát i návaznost na onboardingové workflow. Pozice zde není pouze text inzerátu, ale procesní uzel, kolem něhož se soustřeďují kandidáti, pohovory, dokumenty a odpovědnosti.

Náborová oblast pokrývá uchazeče, jejich přihlášky, přiložené dokumenty a výstupy kvalifikačních nebo analytických kroků. Na ni navazuje pohovorová agenda, která propojuje kandidáta, interní účastníky a organizační kontext. Onboardingová oblast pak modeluje workflow nástupu, jednotlivé kroky, dokumenty a jejich stav plnění. Samostatnou skupinu tvoří zájemci o práci bez vazby na konkrétní pozici a poslední vrstvu představují průřezové záznamy podporující auditovatelnost a provozní spolehlivost, zejména evidence změn, idempotence a asynchronních vedlejších efektů.

#figure(
  image(
    "../procesy/architecture/conceptual-data-model.svg",
    width: 100%,
  ),
  caption: [Konceptuální ER diagram hlavních entit a jejich vztahů]
) <obr:er-diagram>

@obr:er-diagram zachycuje hlavní entity sedmi doménových skupin a jejich vzájemné vazby. Z důvodu rozsahu (přibližně 60 tabulek) nejsou zobrazeny všechny referenční číselníky, pomocné indexační tabulky ani historické záznamy stavů. Diagram slouží především k tomu, aby bylo vidět, že nábor, vstupní agenda a adaptace nejsou v návrhu oddělené ostrovy, ale propojené části jednoho datového modelu.

Prvním důležitým rozhodnutím je použití flexibilní JSON struktury pro onboardingové formuláře a odpovědi zaměstnanců. Zvolil jsem ji proto, že tato část procesu se může průběžně měnit podle role, pracoviště i interních pravidel. Pevně relační model by zde vedl k častým schématickým změnám i kvůli drobným úpravám obsahu formulářů.

Druhým rozhodnutím je využití `pgvector` přímo v databázi `PostgreSQL`. Embeddingy životopisů a pracovních pozic tak lze ukládat vedle transakčních dat a vyhledávání zůstává součástí jednoho technologického celku. Nevolím tedy samostatné vektorové úložiště, protože by v této fázi projektu přineslo více integrační složitosti než praktického přínosu.

Třetím rozhodnutím je explicitní vazba mezi uchazečem a vzniklým zaměstnancem. Tato návaznost umožňuje dohledat celý proces od přihlášky přes nábor až po onboarding. V prostředí, kde je důležitá auditní stopa a vyhodnocování adaptačních výsledků, jde o zásadní vlastnost modelu.

Čtvrtým rozhodnutím je důsledné nesení atributu `organization_id` u klíčových entit. Multi-tenantní charakter systému nesmí být jen pravidlem v dokumentaci, ale musí být fyzicky přítomen v datech a následně respektován v aplikační logice.

Na datový model přímo navazuje způsob, jakým systém komunikuje s okolními službami a jak zpracovává vedlejší efekty. Integrační vrstvu proto navrhuji kombinací synchronní a asynchronní komunikace. Synchronní volání používám tam, kde uživatel očekává okamžitou odezvu, například při práci s administračním rozhraním nebo při generování konkrétního výstupu. Asynchronní komunikaci naopak využívám pro vedlejší efekty a časově náročnější operace, u nichž by blokování requestu zhoršovalo použitelnost systému. Konkrétní realizační tok této kombinace, včetně využití vzoru transactional outbox a návaznosti na vrstvu inteligentního zpracování dat, uvádím až v implementační kapitole.

Pro komunikaci směrem ke klientovi architektura počítá s mechanismem (SSE) průběžného informování o stavu operací. Ten umožňuje zobrazovat změny nebo postup zpracování bez nutnosti opakovaného dotazování klienta a zároveň nezatěžuje systém plně obousměrnou komunikací.  

== Bezpečnost a provozní dohled
Jakmile systém propojuje více rolí, více závodů a citlivé personální údaje, stává se bezpečnostní architektura jedním z rozhodujících kritérií návrhu. Proto ji navrhuji ve třech vrstvách: autentizace, autorizace a datový rozsah. Autentizace je řešena prostřednictvím `OIDC/SSO`, aby interní uživatelé nemuseli spravovat oddělené identity pouze pro tento systém. Tento krok zároveň snižuje provozní režii spojenou se správou účtů.

Autorizaci nestavím jen na klasickém `RBAC`, ale na kombinaci globálních rolí a `ReBAC` (`relationship-based access control`). Vedl mě k tomu proces, kde vedoucí pracovník může potřebovat přístup jen k jedné konkrétní pozici nebo skupině kandidátů, nikoli k celému závodu. Samotná role tak popisuje typ uživatele, zatímco vztah ke zdroji rozhoduje o skutečném rozsahu dat.

Součástí bezpečnostního návrhu je i princip nejnižších oprávnění a auditovatelnost operací nad citlivými daty (NF11). Změny nad klíčovými entitami musí být zpětně dohledatelné, a to nejen kvůli bezpečnosti, ale i kvůli schopnosti vysvětlit průběh náboru nebo adaptace při interním přezkumu.

Bezpečnostní vrstva však sama nestačí. V on-premise prostředí je stejně důležité včas rozpoznat, že se systém začíná odchylovat od očekávaného chování. Proto architekturu uzavírá samostatná vrstva provozního dohledu. Kombinace `Promtail`, `Loki`, `Prometheus` a `Grafana` umožňuje sběr logů, metrik i jejich společnou interpretaci z jednoho místa, aniž by bylo nutné zasahovat do business logiky systému.

#figure(
  image(
    "../procesy/architecture/seq-observability.svg",
    width: 100%,
  ),
  caption: [Tok dat v monitorovací vrstvě od aplikace po vizualizaci]
) <obr:seq-observability>

Vedle samotného sběru dat navrhuji i dva typy alertovacích mechanismů. Provozní alerty mají zachytit zhoršení dostupnosti nebo latencí klíčových endpointů. `SLO` alerty pak sledují zdraví asynchronní vrstvy, například stáří nejstarší nevyřízené zprávy nebo počet zpráv, které selhaly po maximálním počtu pokusů. Smyslem této vrstvy není produkovat více dashboardů, ale dát provozu včasný signál, že se systém začíná odchylovat od očekávaného chování.
