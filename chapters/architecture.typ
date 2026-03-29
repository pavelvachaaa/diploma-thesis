#import "../template/abbreviations.typ": abbr

V této kapitole navrhuji cílovou softwarovou architekturu systému pro digitalizaci náboru a adaptace v #abbr("KZ", none). Kapitolu stavím jako čistě návrhovou, tedy zaměřenou na architektonická rozhodnutí, jejich zdůvodnění a vazbu na požadavky definované v analytické části této práce.

== Architektonické cíle a návrhové faktory

Architektonická rozhodnutí nevznikala ve vzduchoprázdnu. Odvíjela se od konkrétního provozního kontextu #abbr("KZ", none) a od požadavků, které analytická část této práce identifikovala jako klíčové. Tento kontext je pro návrh zásadní: nejde o greenfield startup, ale o organizaci se sedmi odštěpnými závody, regulovanými daty, on-premise infrastrukturou a HR týmem, který bude systém spravovat vlastními kapacitami.

Tím nejvýraznějším strukturálním požadavkem je multi-tenantní izolace dat (R1). Každý odštěpný závod musí vidět pouze svá data, přičemž centrální vedení potřebuje průřezový pohled. Tento požadavek se promítá napříč celým zásobníkem, od databázových dotazů až po HTTP vrstvu, a každé architektonické rozhodnutí muselo s touto realitou počítat. Vedle toho musí systém pokrýt celý náborový a adaptační cyklus v jednom konzistentním řešení (R2–R4), být připraven na napojení externích rejstříků a personálních systémů (R5) a poskytovat datové výstupy pro řízení (R6).

Z pohledu kvalitativních atributů @bass2003software jsem kladl důraz zejména na bezpečnost, auditovatelnost a provozní udržitelnost. Auditovatelnost není v prostředí zdravotnictví volitelná. Systém musí být schopen doložit, kdo, kdy a s jakými daty pracoval. Provozní udržitelnost zase odráží fakt, že systém poběží v on-premise prostředí (NF07) bez možnosti spoléhat se na cloudové provozní zázemí a bez dedikovaného provozního zázemí musí být změny zaváděny bezpečně a inkrementálně (NF08). Tato omezení architekturu spoluurčují stejně silně jako funkční požadavky.

== Architektura systému

Při návrhu architekturního stylu systému je nutné vyvážit dva protichůdné faktory. Na jedné straně stojí požadavek na doménovou čistotu, rozšiřitelnost a připravenost na integrační scénáře, na straně druhé pak reálná kapacitní a provozní omezení vyplývající z individuálního vývoje a iterativního charakteru projektu. Tento konflikt vedl k porovnání několika architektonických přístupů, konkrétně klasického monolitu, modulárního monolitu, přístupu microservices-first a hybridního modelu.

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

Porovnání jednotlivých variant je uvedeno v tabulce @tab:arch-variants. Na jejím základě je jako cílový architektonický styl zvolena hybridní architektura, která kombinuje výhody modulárního monolitu s oddělením vybraných výpočetně náročných částí systému.

Doménové jádro je v tomto přístupu navrženo jako modulární monolit využívající principy Domain-Driven Design (DDD) a architektonický vzor Ports and Adapters. Inteligentní zpracování dat je oproti tomu odděleno do specializovaných komponent (`cv_processor`, `job_processor`), které jsou integrovány prostřednictvím asynchronní komunikace.

Klasický monolit by sice vedl k nižší počáteční složitosti, avšak v kontextu požadavků R5 a R6 by zvyšoval riziko těsné vazby integračních a analytických částí na transakční jádro. Naopak přístup microservices-first by přinesl vysokou distribuovanou komplexitu, která není v aktuální fázi projektu opodstatněná, zejména s ohledem na nutnost řešit síťovou komunikaci, distribuované transakce a zvýšenou provozní režii již v rané fázi vývoje @newmanBuildingMicroservices2019.

Zvolená hybridní architektura tak představuje kompromis mezi rychlostí vývoje, provozní kontrolou a možností postupné evoluce systému, aniž by docházelo k předčasnému zavedení komplexity spojené s mikroslužbovou architekturou.

=== Vhled do celku systému

Než přejdu k detailním technickým pohledům, zachycuji systém v jeho plné šíři — od byznysových aktérů přes aplikační služby až po technologickou infrastrukturu. K tomuto účelu používám model ArchiMate @openGroupArchiMate2019, který umožňuje vrstveně popsat motivaci, byznys, aplikaci i technologii v jednom konzistentním artefaktu @langlois2013enterprise. Model slouží jako orientační mapa, která propojuje požadavky z analytické části s konkrétními technickými rozhodnutími popsanými v dalších sekcích.


TODO: Export SVG z Archi a doplnit cestu
// #figure(
//   image("../procesy/architecture/archimate/kz_onboarding_suite.svg", width: 100%),
//   caption: [ArchiMate model systému — od byznysových aktérů po technologickou vrstvu]
// ) <obr:archimate>

Model je strukturován do šesti vrstev, které zachycují systém od uživatelského pohledu až po technologickou infrastrukturu.

Na úrovni aktérů systému jsou identifikovány čtyři skupiny uživatelů: uchazeč o zaměstnání, nastupující zaměstnanec, HR pracovník nebo náborář a vedoucí zaměstnanec. Každá z těchto skupin vystupuje v odlišném přístupovém kontextu a sleduje odlišné cíle, což se promítá do návrhu oddělených uživatelských rozhraní a rolí v systému.

Vrstva byznysových služeb zahrnuje správu pracovních pozic, zpracování žádostí o zaměstnání, řízení výběrového řízení, správu pohovorů, onboarding zaměstnanců, správu zaměstnanců a správu dokumentů. Tyto služby přímo odpovídají funkčním požadavkům F01–F18 definovaným v analytické části práce a představují hlavní funkční schopnosti systému.

Na ně navazuje vrstva byznysových procesů, která popisuje hlavní tok náboru a nástupu zaměstnance. Tento tok zahrnuje publikaci pracovní pozice, podání žádosti o zaměstnání, správu uchazečů, plánování pohovorů, vytvoření zaměstnance a realizaci onboardingového procesu. Součástí této vrstvy jsou i podpůrné procesy, jako je asistence při tvorbě pracovních inzerátů a analýza životopisů, které vstupují do hlavního toku v relevantních fázích.

Aplikační vrstva realizuje tyto procesy prostřednictvím konkrétních aplikačních služeb, mezi které patří správa uchazečů, správa zaměstnanců, plánování pohovorů, správa dokumentů, notifikační služba, analýza životopisů, asistence pro tvorbu pracovních pozic a integrační služby pro napojení na externí systémy.

Tyto služby jsou realizovány pomocí aplikačních komponent, mezi které patří webové portály pro jednotlivé skupiny uživatelů, aplikační backend a specializované zpracovatelské služby. Vedle interních komponent systém spolupracuje také se službami třetích stran, například externími registry nebo inzerčními portály.

Nejnižší vrstvu tvoří technologická infrastruktura, která zajišťuje běh aplikačních komponent, ukládání dat, práci s dokumenty a asynchronní komunikaci mezi částmi systému. Pro tyto účely jsou v návrhu uvažovány technologie jako relační databáze s podporou vektorového vyhledávání, objektové úložiště dokumentů, nástroje pro extrakci textu, message broker pro asynchronní komunikaci a jazykový model pro podporu inteligentního zpracování dat. Tyto technologie představují konkrétní realizaci architektonických rozhodnutí a podporují požadované vlastnosti systému, zejména škálovatelnost, rozšiřitelnost a odolnost vůči chybám.

== Hexagonální architektura a doménové hranice 

Hexagonální architekturu, původně popsanou Cockburnem @cockburnHexagonalArchitecture2005 pod názvem vzor "Ports and Adapters", stavím jako základ doménového jádra systému. Myšlenkou vzoru je striktní oddělení aplikační domény od veškeré technologické infrastruktury. Doména definuje porty, rozhraní, vyjadřující, co systém od okolního světa vyžaduje a technologické adaptéry tyto porty naplňují. Výsledkem je izolovaná doménová logika, která není závislá na konkrétní databázi, messaging vrstvě ani HTTP frameworku @hombergsGetYourHandsDirty2019.

Spojení hexagonální architektury s principy doménově orientovaného návrhu @evansDomaindrivenDesignTackling2003 považuji za klíčové pro dlouhodobou udržitelnost projektu v #abbr("KZ", none). Hombergs @hombergsGetYourHandsDirty2019 uvádí, že hexagonální architektura přirozeně umožňuje DDD tím, že vytváří fyzické hranice odpovídající doménovým kontextům a vynucuje explicitní pojmenování závislostí domény na infrastruktuře. Doménový model tak může plně reflektovat jazyk, kterým odborníci v dané oblasti přirozeně komunikují @evansDomaindrivenDesignTackling2003 — v kontextu tohoto projektu se jedná o termíny jako uchazeč, pozice, pohovor nebo adaptace.

TODO: GRAF -  Asi rozšřítit ty domény, upravit popisek 
//Na @obr:hexagonal-backend 
Na [doplnim] je znázorněna výsledná struktura backendu v hexagonálním vzoru. Doménové jádro je zcela izolováno od infrastruktury a veškerá komunikace s okolím probíhá přes explicitně definované porty.

V návrhu rozlišuji dvě základní skupiny adaptérů. *Vstupní adaptéry* převádějí vnější požadavek na doménový use-case; v tomto systému jde především o HTTP routy, kontrolery, middleware a konzumenty integračních událostí. *Výstupní adaptéry* naopak převádějí požadavky domény do konkrétní infrastruktury, například do SQL dotazů, objektového úložiště, `RabbitMQ`, e-mailu, auditu, `OIDC`, registru `NRZP` nebo interního vyhledávání uživatelů. Doména tedy nezná konkrétní knihovnu ani endpoint, ale pouze významovou schopnost, kterou od okolí očekává.

Port v tomto pojetí nepředstavuje síťový port, ale pojmenovaný kontrakt mezi jádrem a okolím. Pro doménu je důležité, že existují kontrakty typu „publikuj požadavek na AI analýzu CV“, „ověř kvalifikaci pracovníka“, „vyhledej interního uživatele“, „zapiš auditní událost“ nebo „vyhodnoť přístupová pravidla ReBAC“. Teprve konkrétní adaptér rozhoduje, zda se tato schopnost realizuje přes interní HTTP volání, databázovou vrstvu nebo messaging.

Současně je důležité odlišit *architektonickou hranici* od *nasazovací hranice*. Hexagonální architektura sama o sobě neznamená, že každý adaptér musí být samostatná mikroslužba; většina z nich může běžet uvnitř jednoho backendového procesu.

=== Důvody volby tohoto přístupu

Rozhodnutí pro využití hexagonální architektury v kombinaci s principy Domain-Driven Design (DDD) nevychází pouze z teoretických doporučení, ale přímo reflektuje konkrétní požadavky projektu. Jednotlivé architektonické principy jsem zvolil tak, aby adresovaly klíčové funkční i nefunkční požadavky systému.

Požadavek na multi-tenantní izolaci dat (R1) klade důraz na důsledné šíření organizačního kontextu napříč celým systémem, od vstupního HTTP požadavku až po databázovou vrstvu. Využití explicitních hranic mezi moduly a definovaných portů minimalizuje riziko, že bude tento kontext opomenut nebo obcházen. Případné porušení architektonických pravidel je tak zachytitelné již na úrovni návrhu, nikoli až při testování nebo v produkčním provozu.

Integrační připravenost systému (R5) se přirozeně promítá do využití adaptérového vzoru. Napojení na externí registry a interní podnikové služby je řešeno prostřednictvím samostatných adaptérů s jasně definovanými porty. Tento přístup zajišťuje, že integrační logika nezasahuje do doménové vrstvy a jednotlivé integrace lze vyvíjet, testovat a případně nahrazovat nezávisle na zbytku systému.

Požadavek na provozní udržitelnost v on-premise prostředí (NF07, NF08) je reflektován důrazem na modularitu a jasné oddělení odpovědností. Vzhledem k tomu, že systém je vyvíjen a provozován omezeným počtem osob, je zásadní minimalizovat kognitivní náročnost práce s kódem. Oddělení domén umožňuje pracovat s konkrétní částí systému bez nutnosti detailní znalosti ostatních oblastí.

Auditovatelnost operací (NF11) je řešena prostřednictvím oddělení auditní logiky od doménové vrstvy. Doménové operace generují auditní události prostřednictvím definovaného rozhraní, zatímco jejich konkrétní uložení je delegováno na samostatnou komponentu. Tento přístup zajišťuje, že auditní mechanismus nelze obejít přímým voláním a současně není nutné, aby doménová logika znala detaily jeho implementace.

== Kontextová architektura (C4 L1)

Pro strukturované zachycení architektury na různých úrovních abstrakce využívám model C4 @brownC4ModelSoftware2018. Tento model rozděluje popis architektury do čtyř pohledů — kontext, kontejnery, komponenty a kód — přičemž každý pohled je určen pro jiné publikum a odpovídá na jiné otázky.

Kontext (L1) zachycuje systém jako celek z pohledu jeho okolí. Kdo se systémem pracuje a s jakými externími systémy komunikuje. Tento pohled abstrahuje od vnitřní struktury a slouží jako vstupní orientační mapa pro všechny zúčastněné strany včetně netechnického vedení.

TODO: předělat asi do UML, ten c1 diagram vypadá fakt otřesně why the hell people use this shit
#figure(
  image(
    "../procesy/architecture/c4-l1-context.svg",
    width: 100%,
  ),
  caption: [C4 L1 — Kontextový pohled na systém a jeho aktéry]
) <obr:c4-l1>

Z @obr:c4-l1 vyplývají tři skupiny aktérů a jejich vztah k systému. *Personalisté a HR manažeři* jsou primárními uživateli administračního rozhraní — spravují inzeráty, zpracovávají přihlášky a řídí adaptační procesy. *Uchazeči o zaměstnání* přistupují přes kariérní portál, kde podávají přihlášky a sledují jejich stav. *Noví zaměstnanci* používají zaměstnanecký portál k plnění adaptačních kroků.

Na straně externích systémů figuruje *SSO/OIDC* zajišťující autentizaci interních uživatelů prostřednictvím organizačního poskytovatele identity, *NRZP* jako národní registr zdravotnických pracovníků pro ověření odborné způsobilosti a *e-mailová infrastruktura* pro transakční notifikace uchazečům a zaměstnancům.

== Kontejnerová architektura (C4 L2)

Kontejnerový pohled (L2) rozkládá systém na jeho nasaditelné součásti — kontejnery ve smyslu C4 modelu, nikoliv nutně Docker kontejnerů @brownC4ModelSoftware2018. Každý kontejner je samostatně nasaditelná jednotka s jasně definovanou odpovědností.


TODO: Refactor pro čitelnost puml je boj
#figure(
  image(
    "../procesy/architecture/c4-l2-containers.svg",
    width: 100%,
  ),
  caption: [C4 L2 — Kontejnerový pohled na technické stavební bloky systému]
) <obr:c4-l2>

@obr:c4-l2 zachycuje rozložení systému do šesti funkčních celků. *Backend* (`hiring_backend`, Node.js/Express) tvoří transakční jádro systému — obsluhuje HTTP požadavky, vynucuje doménová pravidla, spravuje data a koordinuje asynchronní toky. *Administrační frontend* (`onboarding.kzcr.eu`, Next.js) poskytuje rozhraní pro personalisty a HR manažery. *Kariérní portál* je veřejně přístupné rozhraní pro uchazeče. *PostgreSQL* s rozšířením pgvector slouží jako primární datové úložiště pro transakční data i vektorová embeddings. *SeaweedFS* zajišťuje S3-kompatibilní objektové úložiště pro dokumenty, životopisy a přílohy. *RabbitMQ* tvoří messaging páteř pro asynchronní komunikaci mezi backendem a procesory vrstvy inteligentního zpracování dat.

Vrstva inteligentního zpracování dat je záměrně oddělena od transakčního jádra a provozována na dedikovaném výpočetním serveru s GPU akcelerací. `cv_processor` (Go) zajišťuje extrakci a analýzu životopisů prostřednictvím Apache Tika a Ollama; `job_processor` (Go) obsluhuje inteligentní chat nad pracovními pozicemi. Toto oddělení zajišťuje, že dočasná nedostupnost vrstvy inteligentního zpracování dat neohrozí dostupnost transakčních funkcí systému.

== Komponentová architektura backendu (C4 L3)

Komponentový pohled (L3) detailně zachycuje vnitřní strukturu backendu jako klíčového kontejneru systému. Ukazuje, z jakých komponent se backend skládá a jak mezi sebou komunikují.

#figure(
  image(
    "../procesy/architecture/c4-l3-components.svg",
    width: 100%,
  ),
  caption: [C4 L3 — Komponentová architektura backendu]
) <obr:c4-l3>

Backend je na @obr:c4-l3 členěn do čtyř vrstev odpovídajících hexagonálnímu vzoru popsanému v předchozí sekci.

HTTP a middleware vrstva představuje vstupní adaptéry backendu. Zajišťuje příjem příchozích požadavků, ověření identity uživatele, sestavení request kontextu a následné předání požadavku příslušnému doménovému modulu. Tato vrstva neobsahuje business logiku, jejím účelem je převod mezi webovým rozhraním a aplikačními use-cases.

Doménová vrstva je tvořena modulárními ohraničenými kontexty, jako jsou například oblasti uchazečů, pracovních pozic, pohovorů, zaměstnanců nebo notifikací. Každý modul zapouzdřuje vlastní kontrolery, aplikační služby, repozitáře a doménové události. Komunikace mezi moduly je navržena prostřednictvím explicitních rozhraní, nikoli přímým využitím implementací jiných modulů, čímž je zajištěno zachování jejich nezávislosti a omezení skrytých vazeb.

Platformní vrstva poskytuje doménovým modulům přístup k infrastrukturním službám prostřednictvím výstupních adaptérů. Zahrnuje zejména přístup k databázi, objektovému úložišti, asynchronní komunikaci, e-mailovým službám, auditnímu logování, autentizaci a autorizaci, včetně integrace s externími systémy. Doménová vrstva s těmito službami nepracuje přímo, ale využívá definovaná rozhraní a dependency injection, což umožňuje oddělení business logiky od technologických detailů.

== Datový návrh

Datový model systému tvoří přibližně šedesát tabulek organizovaných do sedmi doménových skupin. V této části popisuji především konceptuální členění modelu, význam hlavních entit a důvody klíčových návrhových voleb. Technická realizace schématu, migrací a fyzické perzistence je popsána v kapitole implementace.

=== Doménové skupiny datového modelu
  
Centrálním prvkem navrženého modelu jsou organizace, které reprezentují jednotlivé odštěpné závody KZ. Na ně jsou navázáni interní uživatelé, jejich členství a přístupová oprávnění. Tato část modelu tvoří základ jak pro multi-tenantní izolaci, tak pro řízení přístupu na základě organizační příslušnosti.

Samostatnou oblast tvoří model pracovních pozic, který zahrnuje jejich klasifikaci, typy úvazků a vazbu na onboardingové workflow. Tato část pokrývá celý životní cyklus inzerátu od jeho definice a publikace až po návazné personální procesy.

Náborová část modelu zachycuje uchazeče, jejich přihlášky, přiložené dokumenty a výstupy navázaných kvalifikačních či analytických kroků. Návrh této oblasti podporuje jak standardní zpracování přihlášek, tak jejich další využití v rámci analytických scénářů a auditního dohledu.

Pohovorová agenda propojuje uchazeče, interní účastníky a organizační kontext. Umožňuje tak plánování pohovorů, notifikaci zúčastněných osob i zpětnou dohledatelnost rozhodovacích procesů v rámci náboru.
Onboardingová část modelu pokrývá workflow nástupu, jednotlivé kroky, dokumenty a jejich stav plnění. Návrh je přizpůsoben tak, aby umožňoval variabilní průběh nástupu v závislosti na pracovní roli, organizační jednotce a typu požadovaných dokumentů.

Zvláštní skupinu tvoří zájemci o práci bez vazby na konkrétní pracovní pozici. Tento model umožňuje budovat databázi potenciálních kandidátů a pracovat s nimi obdobně jako s uchazeči v rámci standardního náborového procesu.
Součástí modelu jsou také průřezové záznamy zajišťující auditovatelnost a spolehlivost systému. Tyto záznamy podporují sledování změn, řízené opakování operací a zajištění konzistence při zpracování vedlejších efektů, což je klíčové pro provozní stabilitu systému.

=== ER diagram — přehled hlavních entit

#figure(
  image(
    "../procesy/architecture/conceptual-data-model.svg",
    width: 100%,
  ),
  caption: [Konceptuální ER diagram — hlavní entity a jejich vztahy]
) <obr:er-diagram>

@obr:er-diagram zachycuje hlavní entity sedmi doménových skupin a jejich vzájemné vazby. Z důvodu rozsahu schématu (přibližně 60 tabulek) jsou zobrazeny pouze klíčové atributy a primární relace; referenční číselníky, indexovací pomocné tabulky a historické záznamy stavů jsou vynechány.

=== Klíčová návrhová rozhodnutí

Onboardingové formuláře a odpovědi zaměstnanců jsou navrženy s využitím flexibilní JSON struktury. Tento přístup umožňuje upravovat obsah formulářů bez nutnosti změn konceptuálního datového modelu při každé dílčí úpravě, což zvyšuje flexibilitu systému při evoluci požadavků.

Pro podporu sémantického vyhledávání je v návrhu využito rozšíření pgvector nad databází PostgreSQL. Embeddingy životopisů a pracovních pozic jsou ukládány přímo v databázi, což umožňuje provádět sémantické porovnávání bez potřeby externího vektorového úložiště a zjednodušuje celkovou architekturu.

Datový model současně zohledňuje návaznost mezi uchazečem a vzniklým zaměstnancem. Tato vazba je realizována prostřednictvím reference (applicant_id) v entitě uživatele, což umožňuje zpětnou dohledatelnost celého procesu od podání přihlášky až po dokončení onboardingu.

Z hlediska víceuživatelského provozu je systém navržen jako multi-tenantní, přičemž všechny klíčové entity nesou atribut `organization_id`.

== Integrační a asynchronní architektura
Integrační architektura kombinuje synchronní a asynchronní komunikaci podle povahy požadavku. Synchronní volání je použito tam, kde uživatel očekává okamžitou odezvu, zatímco vedlejší efekty a neblokující operace jsou zpracovávány asynchronně přes frontu zpráv `RabbitMQ`. Spolehlivost mezi doménovou transakcí a navazujícími službami zajišťuje vzor Outbox, v němž jsou události nejprve perzistovány a teprve následně publikovány do integrační vrstvy. Pro průběžné informování klienta o změnách stavu je současně využita technologie Server-Sent Events (SSE).

== Bezpečnostní architektura
Bezpečnostní architektura systému je navržena ve třech základních vrstvách. Autentizace, autorizace a řízení přístupu na úrovni organizačního kontextu. Autentizace je řešena prostřednictvím integrace standardu OIDC/SSO, která umožňuje jednotné a bezpečné ověřování uživatelů. Autorizaci nenavrhuji čistě jako RBAC, ale jako kombinaci globálních rolí a ReBAC. ReBAC (`relationship-based access control`) zde znamená, že o přístupu nerozhoduje jen role uživatele, ale i jeho vztah ke konkrétnímu zdroji, například k organizaci nebo pracovnímu inzerátu.

Tento model volím proto, že personální procesy obsahují i jemně delegované scénáře, které samotná role neumí dobře vystihnout. Vedoucí pracovník může mít například spolupracovat pouze na jednom konkrétním inzerátu, a tím pádem potřebuje přístup jen k navázaným uchazečům, pohovorům a dokumentům tohoto inzerátu. Nebylo by správné kvůli tomu přidělit mu plošné oprávnění k celému závodu. Role proto v architektuře určují typ uživatele a vztahy ke zdrojům určují skutečný datový rozsah. Datová izolace mezi jednotlivými organizačními celky je současně zajištěna prostřednictvím organizačního kontextu požadavku a návazných pravidel nad zdroji. Tento přístup naplňuje nefunkční požadavky NF01, NF02 a NF03.

Součástí návrhu je rovněž uplatnění principu nejnižších oprávnění (least privilege), zejména ve vztahu k přístupu k analytickým výstupům. Architektura dále zahrnuje podporu auditovatelnosti operací nad klíčovými entitami systému (NF11). Za tímto účelem je navržen mechanismus auditního logování, který umožňuje zpětně dohledat operace provedené nad citlivými daty a zajistit jejich transparentnost a kontrolovatelnost.

== Monitorování systému

Provozní dohled a monitorování systému jsou v rámci architektury navrženy jako samostatná vrstva. Jejich začlenění vychází z potřeby efektivně diagnostikovat incidenty a současně měřit provozní kvalitu v on-premise prostředí bez závislosti na cloudových nástrojích (NF07, NF12).

Navržený monitorovací systém tvoří `Promtail`, `Loki`, `Prometheus` a `Grafana`, které společně zajišťují sběr logů, metrik a jejich vizualizaci v on-premise prostředí.

#figure(
  image(
    "../procesy/architecture/seq-observability.svg",
    width: 100%,
  ),
  caption: [Tok dat v monitorovací vrstvě — od aplikace přes sběr až po vizualizaci]
) <obr:seq-observability>

Součástí návrhu jsou dva typy alertovacích mechanismů. Provozní alerty jsou určeny pro detekci degradace dostupnosti systému nebo překročení latencí klíčových endpointů. SLO alerty jsou zaměřeny na sledování metrik souvisejících se spolehlivostí asynchronního zpracování. Konkrétně se jedná o stáří nejstarší nevyřízené zprávy v systému a počet zpráv, které selhaly při maximálním počtu pokusů o doručení.
