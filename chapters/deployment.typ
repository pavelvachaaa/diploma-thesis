#import "../template/abbreviations.typ": abbr

Navržený systém má skutečnou hodnotu pouze tehdy, pokud je dlouhodobě provozně udržitelný v reálném prostředí, ve kterém bude nasazen. Klíčovou roli přitom hraje schopnost systém nejen jednorázově nasadit, ale opakovaně a spolehlivě reprodukovat jeho nasazení v různých prostředích. Stejně důležité je zavedení řízení změn, které umožňuje bezpečně provádět úpravy bez narušení stability provozu.

Neméně podstatná je schopnost systému včas signalizovat provozní odchylky, tedy situace, kdy se jeho chování odchyluje od očekávaného stavu. V praxi se může jednat například o prodlouženou dobu odezvy, zvýšenou chybovost, nedostupnost služby, neobvyklé zatížení infrastruktury nebo narušení komunikace mezi jednotlivými komponentami. Včasná identifikace těchto stavů je předpokladem pro jejich rychlou diagnostiku a minimalizaci dopadů na uživatele i navazující procesy.

Tato kapitola navazuje přímo na nefunkcionální požadavky formulované v analytické části. Dostupnost podle NF04, výkon podle NF05 a nasaditelnost na vlastní infrastruktuře podle NF07 nelze doložit pouze návrhem tříd nebo funkčními testy. Musí být podpořeny provozním modelem, který umožňuje systém opakovaně nasadit, bezpečně měnit a současně měřit, zda se běžící instance chová v mezích očekávaných hodnot.

Z provozního hlediska proto stojí návrh před volbou, jak orchestrovat více kontejnerizovaných částí systému v on-premise prostředí. Řešení musí oddělit veřejné portály, transakční backend, integrační adaptéry, asynchronní zpracování, stavové služby a dohled, ale současně nesmí zavést takovou provozní složitost, která by byla pro počáteční pilotní rozsah nepřiměřená. Cílem této kapitoly proto není vypsat všechny použité služby, ale vyhodnotit, proč je zvolený provozní model přiměřený, jaké má limity a podle jakých signálů by měl být nahrazen robustnější orchestrací.

== Provozní model nasazení
Provozní model nejprve definuje vzájemné závislosti služeb (tedy které části musí pro svou funkci spolupracovat). Dále určuje, které z nich vyžadují trvalé úložiště a které mají být dostupné z veřejné nebo pouze interní sítě. @tab:deployment-services proto shrnuje logické rozdělení systému do provozních vrstev.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.7fr, 2.3fr, 1.25fr, 1.35fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Vrstva], [Komponenty], [Stav], [Expozice],

      [Veřejné portály], [`kariera.kzcr.eu`, `onboarding.kzcr.eu`], [Bezstavová], [Veřejná],
      [Transakční API], [`hr-backend`, databázové migrace], [Převážně bezstavová], [Interní],
      [Integrační adaptéry], [`qualification-adapter`, `user-search-adapter`], [Bezstavová], [Interní],
      [Asynchronní zpracování], [outbox worker, auditní a analytické procesory], [Bezstavová], [Interní],
      [Stavové služby], [`PostgreSQL`, `SeaweedFS`, `RabbitMQ`, `Umami`], [Stavová], [Interní],
      [Dohled], [`Alloy`, `Loki`, `Prometheus`, `Tempo`, `Grafana`], [Stavová i bezstavová], [Interní / lokální],
    )
  ],
  caption: [Agregované provozní vrstvy cílového nasazení],
) <tab:deployment-services>

Na základě tohoto členění byly zvažovány dvě realistické varianty orchestrace. Jednodušší provoz pomocí `Docker Compose` a robustnější clusterový model pomocí `Kubernetes`. 

Rozhodnutí pro `Docker Compose` vychází z aktuálního rozsahu nasazení. Dva fyzické servery, necelé dvě desítky kontejnerů a počáteční pilotní provoz, u něhož je podstatnější rychlá předatelnost a srozumitelná správa než maximální automatizace clusteru. Transakční část systému a stavové služby jsou odděleny od výpočetně náročnější vrstvy inteligentního zpracování, kde `cv_processor`, `job_processor` a `Apache Tika` běží na druhém serveru vybaveném grafickou kartou `NVIDIA A10` s 22 GB paměti.

Hodnoticí rámec v @tab:compose-kubernetes proto neporovnává technologie abstraktně, ale vzhledem k požadavkům této práce a k omezením cílového prostředí.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.45fr, 2.2fr, 2.2fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Kritérium], [`Docker Compose`], [`Kubernetes`],

      [Rozsah provozu],
      [Vhodný pro jeden až několik pevně určených hostů a desítky kontejnerů, pokud není nutné automatické rozkládání zátěže mezi uzly.],
      [Vhodný pro více hostů, více prostředí a služby, které vyžadují řízené škálování nebo přesun mezi uzly.],

      [Administrativní režie],
      [Řádově hodiny měsíčně při stabilním hostu, jednoduchém registru obrazů a disciplinované správě konfigurace.],
      [Řádově jednotky dnů pro zavedení a vyšší průběžná režie kvůli clusteru, síťovým politikám, ingressu, storage a aktualizacím.],

      [Dostupnost],
      [Při požadavku NF04 postačuje, pokud je host spolehlivý a údržba je plánovaná mimo měřené okno. Výpadek hostu však znamená výpadek celého nasazení.],
      [Umožňuje HA bezstavových částí napříč uzly, ale sám o sobě nezaručí dostupnost databáze, storage ani provozních závislostí.],

      [Nasazování změn],
      [Reprodukovatelné vydání přes verzované obrazy a migrace před startem backendu. Krátká odstávka je přijatelná v pilotním režimu.],
      [Rolling nebo blue-green deployment je přirozenější, ale vyžaduje připravenost aplikací, migrací i reverzní proxy na paralelní běh verzí.],

      [Bezpečnostní řízení],
      [Oddělení pomocí Docker sítí a hostitelských pravidel, ale bez plnohodnotných policy objektů a centralizované správy tajných hodnot.],
      [Silnější základ pro NetworkPolicy, Secrets, admission pravidla a standardizaci prostředí, za cenu vyšší provozní složitosti.],
    )
  ],
  caption: [Hodnocení volby `Docker Compose` vůči `Kubernetes` pro pilotní on-premise provoz],
) <tab:compose-kubernetes>

Požadavek NF04 stanovuje dostupnost alespoň 99,5 % v pracovních dnech v čase 6:00–22:00. Při orientačním výpočtu 260 pracovních dnů ročně a 16 hodin denně vzniká měřené okno přibližně 4160 hodin ročně. Nedostupnost 0,5 % tedy odpovídá zhruba 20,8 hodinám ročně v tomto okně. To je důležitý rozdíl oproti nepřetržitému režimu 24/7. V této fázi lze část plánované údržby přesunout mimo měřené okno a není nutné zavádět cluster jen kvůli formálnímu splnění NF04. Současně je však nutné otevřeně pojmenovat, že `Docker Compose` neposkytuje ochranu proti výpadku celého hostu. Výpadek serveru s transakční částí znamená nedostupnost hlavního náborového toku, zatímco výpadek serveru s `cv_processor` a `job_processor` vede především k degradaci podpůrných analytických funkcí a k nárůstu fronty zpracování. Pokud by organizace požadovala vyšší dostupnost, menší toleranci k odstávkám nebo automatické zotavení mezi fyzickými uzly, stala by se tato architektonická mez zásadní.

`Docker Compose` by přestal být přiměřenou volbou zejména při splnění některé z těchto podmínek. Požadavek na automaticky řízený běh přes více hostů, potřeba rolling nebo blue-green nasazení bez aplikační odstávky, zpřísnění dostupnosti nad rámec NF04 nebo rozšíření měřeného okna na 24/7, potřeba horizontálně škálovat veřejná API a workery podle zátěže, požadavek na centralizovanou správu tajných hodnot a síťových politik nebo rozšíření provozu na více týmů a prostředí se stejným standardem. V takovém okamžiku by migrace na `Kubernetes` nebyla technologickou preferencí, ale reakcí na změnu provozních požadavků. 

== Vydání, konfigurace a změnové řízení
Nasazení vychází z jednotného toku vydání založeného na verzovaných obrazech. Nová verze je sestavena mimo cílový host, ověřena, uložena do interního registru a do cílového prostředí se přenáší pouze obraz a minimální nasazovací balíček. Tím se omezuje rozdíl mezi prostředím sestavení a prostředím provozu a současně vzniká dohledatelná vazba mezi verzí zdrojového kódu, obrazem a nasazenou instancí.

Vydaná verze označí stav zdrojového kódu a konfiguračních šablon, nad tímto stavem vzniknou obrazy jednotlivých služeb a po základním ověření jsou publikovány do interního obrazového registru. Cílový server pak nestaví aplikaci z repozitáře, ale spouští konkrétní verzi již připraveného obrazu.

Nasazovací balíček obsahuje pouze provozní popis verze a konfigurace, nikoli zdrojový kód. U backendu je klíčové pořadí nasazení. Nejprve se ověří dostupnost stavových služeb, potom proběhne migrace schématu a až po jejím úspěchu se spouští nová verze `hr-backend`. Tím se snižuje riziko běhu aplikace nad nekompatibilní databází.

Konfigurace je oddělena od obrazu aplikace. Netajné hodnoty potřebné už při sestavení klientských aplikací mohou být předány v build fázi, zatímco provozní a citlivé údaje, například přístupové údaje k databázi, integrační klíče nebo certifikáty, se připojují až v cílovém prostředí. Po spuštění nové verze je nutné sledovat readiness endpointy, chybovost, latenci a stav asynchronního zpracování. Návrat ke staršímu obrazu je možný, u změn databázového schématu však vyžaduje také kontrolu kompatibility dat. Podrobné schéma toku vydání je kvůli čitelnosti hlavního textu přesunuto do přílohy @obr:deployment-flow.

== Modelování hrozeb
Součástí dobré praxe při nasazení je i posouzení toho, jaké útoky nebo provozní chyby mohou překročit hranice mezi jednotlivými částmi systému. Modelování hrozeb zde používám v duchu Shostackova pojetí jako návrhovou aktivitu zaměřenou na hledání rizik a jejich mitigací už při návrhu systému @shostackThreatModeling2014. V této kapitole jej používám zjednodušeně. Nejedná se o úplný bezpečnostní audit všech komponent, ale o praktické posouzení síťové segmentace a dopadu kompromitace jedné vrstvy na zbytek nasazení.

Praktické nasazení proto pracuje s oddělením veřejné vrstvy, aplikační sítě `app-network`, integrační sítě `adapter-internal` a dohledové sítě `monitoring_network`. U každé vrstvy v @tab:deployment-threat-model uvádím hlavní hrozbu a opatření, které omezuje pravděpodobnost nebo dopad zneužití.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.28fr, 2.05fr, 2.35fr),
      inset: 5.5pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Vrstva], [Hlavní hrozba], [Mitigace],

      [Veřejné portály],
      [Podvržené vstupy, zneužití formulářů nebo zahlcení veřejných endpointů.],
      [Reverzní proxy, validace vstupů, CORS, audit operací a rate limiting mimo aplikační kód.],

      [Backend a adaptéry],
      [Laterální pohyb po kompromitaci veřejné nebo aplikační komponenty.],
      [Oddělení přes `app-network` a `adapter-internal`, minimální rozhraní adaptérů a nepřímý přístup k integračním systémům.],

      [Stavové služby],
      [Přímý přístup k databázi, frontě nebo objektovému úložišti mimo aplikační vrstvu.],
      [Interní sítě, hostitelský firewall, neveřejná expozice portů a řízené účty pro stavové služby.],

      [Dohledová vrstva],
      [Únik citlivých údajů přes logy, metriky nebo dashboardy.],
      [Host-only binding portů dohledové vrstvy, řízení přístupu ke `Grafana` a omezení citlivých štítků.],
    )
  ],
  caption: [Zjednodušené modelování hrozeb síťové segmentace],
) <tab:deployment-threat-model>

Reziduální riziko zůstává zejména na úrovni hostitele a infrastruktury. Docker bridge síť nenahrazuje plnohodnotnou mikrosegmentaci datového centra a kompromitace hostu může obejít většinu aplikačních hranic. Prosazení pravidel na úrovni firewallu, reverzní proxy, VLAN a směrování spadá do odpovědnosti infrastrukturního týmu #abbr("KZ", none), nikoli samotné aplikace. Aplikační návrh proto definuje očekávané hranice a minimalizuje potřebné komunikační vazby, zatímco jejich úplné vynucení musí být doplněno provozními pravidly infrastruktury. Stejně tak lokálně spravované konfigurační soubory a tajné hodnoty vyžadují důsledné nastavení oprávnění, rotaci a audit přístupů. Segmentace je proto jednou vrstvou obrany v hloubce, nikoli samostatnou garancí bezpečnosti.

== Dohledová vrstva a provozní měření
Dohledová vrstva je navržena tak, aby převáděla nefunkcionální požadavky do měřitelných provozních signálů. Pro NF04 sleduje dostupnost a degradaci hlavních služeb, pro NF05 odezvu rozhraní a pro NF07 stav nasazených kontejnerizovaných komponent v cílovém on-premise prostředí. Nejde tedy pouze o operátorský přehled, zda kontejnery běží, ale o mechanismus, kterým lze provozně dokládat, zda systém plní požadované kvalitativní vlastnosti.

Použité technologie jsou vidět v @tab:deployment-observability. Sběrný agent `Alloy` pro logy, metriky a trasy. Logy jsou ukládány do `Loki`, metriky do `Prometheus`, trasy do `Tempo` a jednotné rozhraní pro přehledy a alerty poskytuje `Grafana`.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.25fr, 2.25fr, 1.8fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Komponenta], [Primární funkce], [Provozní přínos],

      [`Grafana Alloy`],
      [Sběr logů z kontejnerů, scrape metrik a příjem OTLP tras],
      [Jeden agent pro propojení aplikací s dohledovou vrstvou],

      [`Loki`], [Uložení a dotazování log streamů], [Rychlá analýza incidentů podle času, služby a úrovně logu],
      [`Prometheus`],
      [Uložení metrik a vyhodnocení trendů],
      [Měření dostupnosti, odezvy, kapacity a průchodnosti procesů],

      [`Tempo`], [Uložení distribuovaných tras], [Dohledání pomalých nebo chybových požadavků napříč komponentami],
      [`Grafana`], [Dashboardy a alerting], [Jednotné operátorské rozhraní pro provozní stav systému],
    )
  ],
  caption: [Role komponent dohledové vrstvy],
) <tab:deployment-observability>

Z hlediska NF04 jsou důležité zejména signály vztahující se k dostupnosti a průchodnosti hlavních procesů. Dostupnost `/hrbackend/ready`, healthchecky integračních adaptérů, poměr HTTP odpovědí `5xx`, připravenost outbox workeru, stáří nejstarších položek v outboxu, dead-letter růst, počet konzumentů fronty a základní kapacitní ukazatele `PostgreSQL` a `SeaweedFS`. Požadavek NF05 je pokryt zejména měřením p95 odezvy HTTP rozhraní a saturace databázového poolu. První provozní měření v `Grafana` tak neslouží pouze jako technický dashboard, ale jako důkazní opora pro tvrzení, že zvolený model v aktuálním zatížení odpovídá požadavkům na dostupnost a výkon.

Tím kapitola uzavírá vazbu mezi nefunkcionálními požadavky a provozní realitou systému. Nasazovací model zajišťuje reprodukovatelné vydávání a oddělení provozních vrstev, zatímco dohledová vrstva poskytuje měřitelnou zpětnou vazbu o dostupnosti, odezvě a degradaci služeb. Díky tomu lze další rozvoj infrastruktury opírat o naměřená provozní data, nikoli pouze o předpoklady z návrhu.
//TODO: Zde buď budou pilotní naměřená data nebo screenshot z grafany.
