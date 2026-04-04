#import "../template/abbreviations.typ": abbr

Architektura navrženého řešení musela odpovědět na otázku, jak digitalizovat nábor a adaptaci v prostředí, které je zároveň organizačně členité, regulatorně citlivé a provozně omezené on-premise infrastrukturou. Nešlo mi tedy o návrh obecně elegantního systému, ale o takovou architekturu, která bude obhajitelná vůči požadavkům Krajské zdravotní, a.s. a současně zůstane dlouhodobě udržitelná.

== Architektonické cíle a návrhové faktory
Architektonická rozhodnutí jsem odvozoval přímo z provozního kontextu #abbr("KZ", none). Organizace není startup na zelené louce s jedním produktem a jedním týmem. Jde o holding se sedmi odštěpnými závody, regulovanými daty, heterogenními uživatelskými rolemi a omezenými provozními kapacitami. Z toho plyne, že architektura musí být nejen technicky správná, ale i srozumitelná pro další rozvoj a bezpečně provozovatelná.

Nejsilnějším strukturálním požadavkem je multi-tenantní izolace dat (R1). Každý závod musí pracovat se svými daty, ale centrální vedení potřebuje průřezový pohled. Tento požadavek proto nelze řešit jen na úrovni oprávnění v uživatelském rozhraní. Musí být propsán do datového modelu, aplikačních služeb i do způsobu, jakým se vyhodnocují přístupová pravidla. Vedle toho musí systém pokrýt celý tok od zveřejnění pozice přes nábor a vstupní agendu až po adaptaci zaměstnance (R2-R4), být připraven na napojení externích služeb (R5) a poskytovat data pro řízení procesu (R6).

Z kvalitativních atributů @bass2003software jsem kladl největší důraz na bezpečnost, auditovatelnost a provozní udržitelnost. V prostředí zdravotnictví není auditní stopa doplňkem, ale základní podmínkou důvěryhodnosti systému. Stejně tak on-premise provoz znamená, že nemohu spoléhat na komfort cloudových managed služeb. Architektura proto musí minimalizovat zbytečnou distribuovanou složitost a současně připustit řízený růst tam, kde je skutečně potřebný.

== Architektura systému
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

=== Vhled do celku systému
Než přejdu k jednotlivým technickým pohledům, považuji za důležité zachytit systém jako jeden souvislý celek. Pro interní orientaci a validaci vazeb mezi byznysovou a technickou vrstvou jsem proto pracoval i s ArchiMate modelem @openGroupArchiMate2019 @langlois2013enterprise. Jeho smyslem nebylo nahradit detailní diagramy, ale ukázat, jak na sebe navazují aktéři, procesy, aplikační služby a infrastruktura.

//TODO: Export SVG z Archi a doplnit cestu
// #figure(
//   image("../procesy/architecture/archimate/kz_onboarding_suite.svg", width: 100%),
//   caption: [ArchiMate model systému — od byznysových aktérů po technologickou vrstvu]
// ) <obr:archimate>

Na úrovni aktérů rozlišuji čtyři hlavní skupiny uživatelů: uchazeče o zaměstnání, nastupující zaměstnance, HR pracovníky a vedoucí zaměstnance. Každá z těchto skupin vstupuje do systému v jiném okamžiku a sleduje jiný cíl. To je důvod, proč architekturu nestavím kolem jedné univerzální aplikace, ale kolem více rozhraní nad společným doménovým jádrem.

Byznysová vrstva zahrnuje správu pracovních pozic, uchazečů, pohovorů, zaměstnanců, dokumentů a adaptace. Na ni navazuje aplikační vrstva realizovaná backendem, veřejným kariérním portálem, onboardingovým portálem a specializovanými integračními či zpracovatelskými službami. Technologická vrstva pak zajišťuje perzistenci, messaging, práci s dokumenty, observabilitu a inteligentní zpracování dat. Tento pohled je důležitý hlavně proto, že připomíná, že technická architektura nevzniká sama pro sebe, ale jako přímá odpověď na procesní požadavky předchozích kapitol.

== Hexagonální architektura a doménové hranice
Jádro backendu stavím na hexagonální architektuře, kterou Cockburn popsal jako vzor Ports and Adapters @cockburnHexagonalArchitecture2005. V praktickém smyslu to znamená, že doménová logika nesmí být závislá na konkrétní databázi, messaging knihovně ani HTTP frameworku. Doména pouze vyjadřuje, jaké schopnosti od okolí potřebuje, a konkrétní technologie tyto potřeby naplňují v adaptační vrstvě.

Tento přístup kombinuji s principy doménově orientovaného návrhu @evansDomaindrivenDesignTackling2003. Důvod je jednoduchý. V systému se pracuje s pojmy, které mají v prostředí #abbr("KZ", none) přesný význam. Uchazeč, pozice, pohovor, vstupní agenda nebo adaptace nejsou jen názvy entit v databázi, ale samostatné procesní celky se svými pravidly a odpovědnostmi. Oddělení těchto kontextů snižuje riziko, že se celý systém postupně změní v jednu neurčitou vrstvu služeb bez jasných hranic.

V návrhu rozlišuji vstupní a výstupní adaptéry. Vstupní adaptéry převádějí vnější požadavek na use-case domény. V praxi jde o HTTP routy, middleware nebo konzumenty integračních událostí. Výstupní adaptéry naopak převádějí požadavky domény do konkrétní infrastruktury, například do SQL dotazu, práce s `RabbitMQ`, objektového úložiště, auditu, `OIDC`, registru `NRZP` nebo interního vyhledávání uživatelů. Port zde neznamená síťový port, ale pojmenovaný kontrakt mezi jádrem a okolím jako je například „ověř kvalifikaci pracovníka“, „vyhledej interního uživatele“  nebo „zapiš auditní událost“.

Je důležité odlišit architektonickou hranici od hranice nasazovací. Hexagonální architektura sama o sobě neznamená, že každý adaptér musí být samostatná služba. Naopak většina adaptérů běží uvnitř jednoho backendového procesu. Samostatně odděluji jen ty části, jejichž runtime, provozní profil nebo integrační režim se od jádra skutečně liší.

=== Důvody volby tohoto přístupu
Prvním důvodem pro volbu hexagonální architektury je multi-tenantní charakter systému. Organizační kontext musí být nesen od vstupu do aplikace až po datovou vrstvu a nesmí se ztratit při přechodu mezi moduly. Explicitní porty a doménové hranice snižují riziko, že některá část implementace začne s daty pracovat mimo tento rámec.

Druhým důvodem je integrační připravenost. Systém musí komunikovat s externími registry, interními službami i asynchronní vrstvou inteligentního zpracování dat. Pokud by byla tato logika promíchaná přímo v doméně, každá změna integračního detailu by zvyšovala riziko regrese v business logice. Adaptérový vzor umožňuje tyto vazby vyvíjet a testovat odděleně.

Třetím důvodem je provozní a týmová udržitelnost. Projekt je vyvíjen bez velkého specializovaného architektonického týmu (projekt vyvíjí pouze autor práce), takže kód musí zůstat čitelný i pro budoucí předání. Modularita a oddělení odpovědností zde nejsou akademickým cílem, ale praktickou obranou proti tomu, aby se systém stal obtížně rozšiřitelným už po několika iteracích.

== Kontextová architektura (C4 L1)
Pro zachycení architektury na různých úrovních abstrakce používám model C4 @brownC4ModelSoftware2018. Kontextový pohled (L1) slouží jako orientační mapa. Neřeší vnitřní strukturu systému, ale ukazuje, kdo se systémem pracuje a jaké externí služby jsou pro jeho chod důležité.
TODO: předělat asi do UML, ten c1 diagram vypadá fakt otřesně why the hell people use this shit
#figure(
  image(
    "../procesy/architecture/c4-l1-context.svg",
    width: 100%,
  ),
  caption: [C4 L1 — Kontextový pohled na systém a jeho aktéry]
) <obr:c4-l1>

Z @obr:c4-l1 jsou patrné tři hlavní skupiny uživatelů. Personalisté a HR manažeři pracují s administračním rozhraním, uchazeči vstupují do systému přes kariérní portál a noví zaměstnanci používají onboardingové rozhraní. Na straně externích služeb jsou zásadní `SSO/OIDC` pro autentizaci interních uživatelů, `NRZP` pro ověření odborné způsobilosti a e-mailová infrastruktura pro transakční komunikaci. Kontextový diagram tak potvrzuje, že systém není izolovaná interní aplikace, ale integrační uzel propojující více rolí a více zdrojů pravdy.

== Kontejnerová architektura (C4 L2)
Kontejnerový pohled (L2) rozkládá řešení na nasaditelné stavební bloky. V terminologii C4 nejde nutně o Docker kontejnery, ale o samostatně nasaditelné části s jasnou odpovědností @brownC4ModelSoftware2018. Právě na této úrovni je dobře vidět, kde jsem ponechal jednoduchost modulárního jádra a kde jsem naopak zvolil oddělení služeb.

#figure(
  image(
    "../procesy/architecture/c4-l2-containers.svg",
    width: 100%,
  ),
  caption: [C4 L2 — Kontejnerový pohled na technické stavební bloky systému]
) <obr:c4-l2>

@obr:c4-l2 zachycuje šest hlavních funkčních celků. `hiring_backend` tvoří transakční jádro systému. Nad ním stojí administrační frontend `onboarding.kzcr.eu` a veřejný kariérní portál. Perzistenci zajišťuje `PostgreSQL` s rozšířením `pgvector`, dokumenty ukládá `SeaweedFS` a asynchronní komunikaci nese `RabbitMQ`.

Vrstva inteligentního zpracování dat je oddělena od transakčního jádra a provozována na samostatném výpočetním hostu. `cv_processor` zajišťuje extrakci a analýzu životopisů, zatímco `job_processor` podporuje tvorbu a úpravy textů pracovních inzerátů. Oddělení těchto služeb není motivováno snahou o „mikroslužby za každou cenu“, ale snahou ochránit dostupnost hlavního systému před výpočetně náročnými nebo dočasně nestabilními operacemi.

== Komponentová architektura backendu (C4 L3)
Komponentový pohled (L3) detailně zachycuje vnitřní strukturu backendu jako nejdůležitějšího kontejneru celého systému. Tato úroveň je důležitá proto, že ukazuje, jak se architektonické principy z předchozích sekcí skutečně promítají do rozdělení odpovědností uvnitř jediné aplikace.

#figure(
  image(
    "../procesy/architecture/c4-l3-components.svg",
    width: 100%,
  ),
  caption: [C4 L3 — Komponentová architektura backendu]
) <obr:c4-l3>

Backend je na @obr:c4-l3 členěn do čtyř vrstev odpovídajících hexagonálnímu uspořádání. HTTP a middleware vrstva představuje vstupní adaptéry, které přijímají požadavky, ověřují identitu, připravují request kontext a předávají řízení do use-case vrstvy. Tato část nesmí obsahovat business logiku. Její úlohou je překlad mezi webovým rozhraním a doménou.

Doménová vrstva je tvořena ohraničenými kontexty, jako jsou uchazeči, pracovní pozice, pohovory, zaměstnanci, onboarding nebo notifikace. Každý modul zapouzdřuje vlastní pravidla, aplikační služby, repozitáře a události. Komunikace mezi moduly je vedena přes explicitní rozhraní, nikoli přes přímé závislosti na cizích implementacích. Tím se omezuje šíření skrytých vazeb.

Platformní vrstva poskytuje doméně přístup k infrastrukturním službám a to zejména k databázi, objektovému úložišti, messagingu, e-mailu, auditu, autentizaci, autorizaci i externím registrům. Doménové moduly tyto technologie přímo neznají. Získávají pouze schopnost, kterou potřebují, a konkrétní technické řešení zůstává uzavřeno v adaptéru.

== Datový návrh
Datový model systému tvoří přibližně šedesát tabulek organizovaných do sedmi doménových skupin. Cílem této části není vypsat celé schéma, ale vysvětlit, jaké logické celky model obsahuje a proč je model navržen právě tímto způsobem. Technické detaily migrací a fyzické perzistence rozvádím v následující implementační kapitole.

=== Doménové skupiny datového modelu
Základ datového modelu tvoří organizace a návazné členství interních uživatelů. Právě tato skupina entit nese organizační kontext, bez něhož by nebylo možné bezpečně oddělit data jednotlivých závodů a současně zachovat centrální reporting.

Další oblast tvoří model pracovních pozic. Ten zachycuje klasifikaci rolí, typy úvazků, vazbu na inzerát i návaznost na onboardingové workflow. Pozice zde není pouze text inzerátu, ale procesní uzel, kolem něhož se soustřeďují kandidáti, pohovory, dokumenty a odpovědnosti.

Náborová oblast pokrývá uchazeče, jejich přihlášky, přiložené dokumenty a výstupy kvalifikačních nebo analytických kroků. Na ni navazuje pohovorová agenda, která propojuje kandidáta, interní účastníky a organizační kontext. Onboardingová oblast pak modeluje workflow nástupu, jednotlivé kroky, dokumenty a jejich stav plnění.

Samostatnou skupinu tvoří zájemci o práci bez vazby na konkrétní pozici. Tento model je důležitý, protože umožňuje budovat databázi kontaktů využitelnou i pro další náborové vlny. Poslední skupinu představují průřezové záznamy podporující auditovatelnost a provozní spolehlivost, zejména evidence změn, idempotence a asynchronních vedlejších efektů.

=== ER diagram — přehled hlavních entit
#figure(
  image(
    "../procesy/architecture/conceptual-data-model.svg",
    width: 100%,
  ),
  caption: [Konceptuální ER diagram — hlavní entity a jejich vztahy]
) <obr:er-diagram>

@obr:er-diagram zachycuje hlavní entity sedmi doménových skupin a jejich vzájemné vazby. Z důvodu rozsahu (přibližně 60 tabulek) nejsou zobrazeny všechny referenční číselníky, pomocné indexační tabulky ani historické záznamy stavů. Diagram slouží především k tomu, aby bylo vidět, že nábor, vstupní agenda a adaptace nejsou v návrhu oddělené ostrovy, ale propojené části jednoho datového modelu.

=== Klíčová návrhová rozhodnutí
Prvním důležitým rozhodnutím je použití flexibilní JSON struktury pro onboardingové formuláře a odpovědi zaměstnanců. Zvolil jsem ji proto, že tato část procesu se může průběžně měnit podle role, pracoviště i interních pravidel. Pevně relační model by zde vedl k častým schématickým změnám i kvůli drobným úpravám obsahu formulářů.

Druhým rozhodnutím je využití `pgvector` přímo v databázi `PostgreSQL`. Embeddingy životopisů a pracovních pozic tak lze ukládat vedle transakčních dat a vyhledávání zůstává součástí jednoho technologického celku. Nevolím tedy samostatné vektorové úložiště, protože by v této fázi projektu přineslo více integrační složitosti než praktického přínosu.

Třetím rozhodnutím je explicitní vazba mezi uchazečem a vzniklým zaměstnancem. Tato návaznost umožňuje dohledat celý proces od přihlášky přes nábor až po onboarding. V prostředí, kde je důležitá auditní stopa a vyhodnocování adaptačních výsledků, jde o zásadní vlastnost modelu.

Čtvrtým rozhodnutím je důsledné nesení atributu `organization_id` u klíčových entit. Multi-tenantní charakter systému nesmí být jen pravidlem v dokumentaci, ale musí být fyzicky přítomen v datech a následně respektován v aplikační logice.

== Integrační a asynchronní architektura
Integrační vrstvu navrhuji kombinací synchronní a asynchronní komunikace. Synchronní volání používám tam, kde uživatel očekává okamžitou odezvu, například při práci s administračním rozhraním nebo při generování konkrétního výstupu. Asynchronní komunikaci naopak využívám pro vedlejší efekty a časově náročnější operace, u nichž by blokování requestu zhoršovalo použitelnost systému.

Klíčovým vzorem je zde transactional outbox. Doménová operace nejprve uloží business data i odpovídající integrační událost do jedné transakce a teprve následně je událost publikována do integrační vrstvy. Tím se vyhýbám problému, kdy by změna v databázi proběhla, ale vedlejší efekt se kvůli chybě v messaging vrstvě nikdy nevykonal.

Pro průběžné informování klienta o stavu vybraných operací doplňuji architekturu o Server-Sent Events (SSE). Tento mechanismus je vhodný tam, kde potřebuji klientovi zobrazovat postup nebo změny stavu bez zbytečně komplikovaného plně duplexního kanálu.

== Bezpečnostní architektura
Bezpečnostní architekturu navrhuji ve třech vrstvách: autentizace, autorizace a datový rozsah. Autentizace je řešena prostřednictvím `OIDC/SSO`, aby interní uživatelé nemuseli spravovat oddělené identity pouze pro tento systém. Tento krok zároveň snižuje provozní režii spojenou se správou účtů.

Autorizaci nestavím jen na klasickém `RBAC`, ale na kombinaci globálních rolí a `ReBAC` (`relationship-based access control`). Vedl mě k tomu proces, kde vedoucí pracovník může potřebovat přístup jen k jedné konkrétní pozici nebo skupině kandidátů, nikoli k celému závodu. Samotná role tak popisuje typ uživatele, zatímco vztah ke zdroji rozhoduje o skutečném rozsahu dat.

Součástí bezpečnostního návrhu je i princip nejnižších oprávnění a auditovatelnost operací nad citlivými daty (NF11). Změny nad klíčovými entitami musí být zpětně dohledatelné, a to nejen kvůli bezpečnosti, ale i kvůli schopnosti vysvětlit průběh náboru nebo adaptace při interním přezkumu.

== Monitorování systému
Provozní dohled navrhuji jako samostatnou vrstvu oddělenou od business logiky systému. V on-premise prostředí nemohu spoléhat na cloudové monitorovací služby, proto stavím na kombinaci `Promtail`, `Loki`, `Prometheus` a `Grafana`. Tento stack umožňuje sběr logů, metrik i jejich společnou interpretaci z jednoho místa.

#figure(
  image(
    "../procesy/architecture/seq-observability.svg",
    width: 100%,
  ),
  caption: [Tok dat v monitorovací vrstvě — od aplikace přes sběr až po vizualizaci]
) <obr:seq-observability>

Vedle samotného sběru dat navrhuji i dva typy alertovacích mechanismů. Provozní alerty mají zachytit zhoršení dostupnosti nebo latencí klíčových endpointů. `SLO` alerty pak sledují zdraví asynchronní vrstvy, například stáří nejstarší nevyřízené zprávy nebo počet zpráv, které selhaly po maximálním počtu pokusů. Smyslem této vrstvy není produkovat více dashboardů, ale dát provozu včasný signál, že se systém začíná odchylovat od očekávaného chování.
