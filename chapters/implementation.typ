#import "../template/abbreviations.typ": abbr

Architektonický návrh má smysl jen tehdy, pokud se podaří převést jeho principy do konkrétní implementace, aniž by se po cestě rozpadly pod tlakem technologických kompromisů @mauro2024digital. V této kapitole proto neuvádím úplný výpis všech tříd, tabulek a endpointů, ale ta rozhodnutí, na nichž se láme rozdíl mezi formálně správným návrhem a skutečně provozně použitelným systémem.

Pozornost soustředím především na modulární backend, hexagonální rozdělení odpovědností, spolehlivou asynchronní komunikaci, datovou vrstvu, bezpečnostní model a oddělenou vrstvu inteligentního zpracování dat. Právě v těchto částech se ukazuje, zda navržená architektura dokáže unést reálné procesní a provozní požadavky #abbr("KZ", none).

== Struktura řešení
Celé řešení je implementováno jako sada spolupracujících aplikací a služeb s oddělenými odpovědnostmi. Backend je realizován v prostředí Node.js/Express, webové portály jsou postaveny na Next.js a podpůrné zpracovatelské či integrační služby běží převážně v jazyce Go. 

Pro backend jsem zvolil `Node.js/Express`, protože řešené jádro je především API s velkým podílem HTTP komunikace, middleware logiky a integračních vazeb. `Express` v kombinaci s DI kontejnerem `Awilix` současně ponechává přímou kontrolu nad skladbou aplikace, což bylo důležité pro promítnutí hexagonálního uspořádání do kódu. Dal jsem tak přednost této explicitní skladbě před uceleným frameworkem typu `NestJS` právě proto, abych udržel co nejvyšší nezávislost doménové vrstvy bez nutnosti používat framework-specific dekorátory, jako je `@Injectable()`, přímo v business logice. Alternativou byl jiný backendový stack, například `Spring Boot` či `ASP.NET Core`, ty by však v daném rozsahu přinesly více konvencí a vyšší implementační režii bez zřetelného přínosu.

Webové portály jsem postavil na `Next.js`. Vedle technických vlastností zde hrála důležitou roli i vyzrálost ekosystému. Široká komunita, dobře dostupná dokumentace a průběžný vývoj frameworku snižují riziko, že se řešení dostane do méně podporovaného technologického směru s horší udržovatelností. Současně jde o přirozené rozšíření `React` prostředí, takže bylo možné využít známý vývojový model i rozsáhlé sdílené know-how. Alternativou byla čistě klientská aplikace v `React` bez serverového vykreslení nebo řešení v jiném ekosystému, například `Nuxt`. Zvolený přístup však lépe podporoval dlouhodobou udržitelnost i sjednocení obou portálů v jednom technologickém základu.

Volba jazyka Go u procesorů přitom nebyla motivována tím, že by právě tento jazyk nabízel zásadně lepší knihovny pro práci s modely. Samotná inference je totiž delegována do `Ollama` a extrakce textu do `Apache Tika`, tedy do oddělených služeb dostupných přes HTTP. Z čistě funkčního hlediska by proto bylo možné procesory implementovat i v `Node.js`, což by sjednotilo technologický stack. Rozhodující byly spíše jejich provozní vlastnosti. `cv_processor` běží jako dlouhožijící worker s více souběžnými konzumenty fronty a `job_processor` jako samostatná `HTTP/SSE` služba. Go v tomto kontextu přináší jednoduchý model souběžnosti, malé samostatně nasaditelné binární soubory a předvídatelné chování u specializovaných služeb, které neřeší rozsáhlou doménovou logiku ani práci s uživatelským rozhraním.

Vedle hlavního backendu řešení zahrnuje i samostatné služby pro auditní zápis, integrační adaptéry a inteligentní zpracování dokumentů či textů pracovních pozic. Tyto komponenty spolu komunikují přes HTTP nebo přes `RabbitMQ`. `RabbitMQ` jsem zvolil proto, že umožňuje spolehlivě oddělit transakční cestu od vedlejších efektů, aniž by bylo nutné zavádět robustnější streamovací platformu. Alternativou bylo čistě synchronní volání mezi službami nebo platforma typu `Kafka`. První varianta by zhoršovala odezvu a odolnost systému, druhá by v tomto měřítku přinesla spíše vyšší provozní režii.

Zvolený technologický mix tedy nesměřuje k pestrosti pro ni samu, ale k přiřazení vhodného nástroje konkrétnímu typu problému. Přínosem je lepší přizpůsobení jednotlivých částí jejich provoznímu profilu, omezením naopak vyšší nárok na koordinaci buildů, nasazení a dohledu.

Obrázek @obr:impl-solution-overview ukazuje nasazované komponenty řešení a jejich hlavní komunikační vazby. Je na něm vidět trojice klientských aplikací nad společným backendem, návaznost backendu na integrační a auditní služby, propojení s databází, objektovým úložištěm a vrstvou předávání zpráv i oddělení inteligentní vrstvy od hlavní aplikační cesty.

#figure(
  image(
    "../procesy/architecture-implementation-16x9.svg",
    width: 100%,
  ),
  caption: [Nasazované komponenty řešení a jejich hlavní komunikační vazby],
) <obr:impl-solution-overview>

== Implementace backendu
Backend byl implementován jako modulární aplikace s hexagonálním architektonickým uspořádáním. Každý doménový modul (např. `applicants`, `interviews`) důsledně odděluje aplikační případy užití (use-cases), doménové entity a technologické adaptéry.

Komunikační tok začíná v routovací vrstvě, kde middleware pipeline zajišťuje autentizaci a vytvoření kontextu požadavku. Vstupní adaptéry následně převádějí HTTP vstup na aplikační modely a volají případy užití (use-cases). Tyto porty delegují doménová pravidla na jádro a pro komunikaci s okolím (perzistence, audit, messaging) využívají výstupní porty, jejichž konkrétní implementaci poskytují infrastrukturní adaptéry.

Skládání těchto částí řídí dependency injection (DI) kontejner Awilix. Volba tohoto nástroje byla podřízena snaze o co nejvyšší nezávislost doménové vrstvy. Na rozdíl od alternativ, jako je například InversifyJS, nevyžaduje Awilix použití dekorátorů přímo v doménovém kódu. Tím je dosaženo stavu, kdy doménová logika zůstává technologicky agnostická a neobsahuje žádné závislosti na použitém DI frameworku, což odpovídá principům hexagonální architektury. Awilix byl dále zvolen pro svou podporu tzv. request scopingu, který umožňuje v rámci jednoho požadavku sdílet kontext (např. identitu uživatele či databázovou transakci) napříč vrstvami bez nutnosti jejich explicitního předávání.

Takto navržený backend plní roli autoritativní transakční hranice systému. Právě zde se rozhoduje o tom, zda je konkrétní změna v souladu s doménovými pravidly, s rozsahem oprávnění uživatele i s požadavky na auditní dohledatelnost. Z formálního hlediska jde o koncentraci invariantů, tedy pravidel, která musí v systému vždy platit, do doménové a aplikační vrstvy, což minimalizuje riziko jejich nekonzistentní implementace napříč frontendem, integračními službami a databázovými skripty.

Pro lepší přehlednost o rozdělení odpovědností v rámci systému je níže uvedena tabulka @tab:impl-backend-layers, která mapuje teoretické prvky hexagonální architektury na jejich konkrétní realizaci v rámci této implementace.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.45fr, 2.55fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Prvek hexagonu], [Implementační realizace],
      [Vstupní adaptéry], [Routovací vrstva, middleware a řadiče (controllers) převádějící HTTP požadavky na případy užití],
      [Aplikační vrstva / vstupní porty], [Případy užití, které definují operace poskytované aplikací a orchestrují jejich průběh],
      [Doménové moduly], [Entity, value objekty, doménové služby a doménové události ohraničených kontextů (bounded contexts)],
      [Výstupní porty], [Explicitní rozhraní (kontrakty), kterými aplikační nebo doménová vrstva vyjadřuje požadavky na okolní systémy],
      [Výstupní adaptéry], [Konkrétní implementace perzistence, auditu, asynchronního předávání zpráv, úložiště a externích či interních integrací],
      [Vazba port-adaptér], [Kompoziční kořen (composition root) a DI kontejner `Awilix`, které propojují porty s jejich konkrétními adaptéry],
    )
  ],
  caption: [Mapování prvků hexagonální architektury na implementační vrstvy backendu],
) <tab:impl-backend-layers>
=== Použité vzory a techniky v backendu
Tato sekce shrnuje klíčová architektonická rozhodnutí v backendu. Každý zvolený vzor reaguje na konkrétní výzvu personálního systému a je zdůvodněn vztahem k požadavkům #abbr("KZ", none).

Prvním problémem je postupné prolínání business logiky s technologickými detaily (HTTP, databáze), což by v systému s dlouhou životností vedlo k vysokým nákladům na údržbu. Alternativou byla klasická vrstvená architektura, ta však často vede k nepřímé závislosti domény na databázi. Rozhodl jsem se proto pro *hexagonální uspořádání* (Ports and Adapters). V kontextu #abbr("KZ", none) tento přístup zajišťuje, že rozhodování o náboru nebo vstupní agendě zůstává technologicky agnostické, což podporuje předatelnost verzovaného a dokumentovaného zdrojového kódu požadovanou v NF08. Správnost rozdělení ověřuji architektonickými testy hlídajícími čistotu importů. Cenou za toto oddělení je vyšší počet explicitních kontraktů a nutnost mapování dat mezi vrstvami.

Druhým problémem je závislost aplikačních služeb na fyzickém schématu databáze. Přímé používání SQL v případech užití by ztížilo refaktorování i testování. Alternativou by bylo použití `Active Record` vzoru, který je sice rychlejší na implementaci, ale pevně váže logiku na tabulky. Zvolil jsem vzor `Repository`. Ten v personální doméně umožňuje pracovat s uchazeči a pozicemi jako s ucelenými objekty bez ohledu na to, zda jsou uloženi v relační tabulce nebo (v budoucnu) v jiném typu úložiště. Ověření probíhá skrze integrační testy repozitářů nad reálnou databází. Kompromisem je další úroveň abstrakce, kterou je třeba udržovat.

Dalším, v pořadí třetím, problémem je skládání závislostí v modulární aplikaci. Ruční propojování služeb a adaptérů by vedlo k nepřehlednému kódu a obtížnému testování. Alternativou bylo ruční vytváření instancí v továrnách, což je však při desítkách služeb neudržitelné. Použil jsem *Dependency Injection* s kontejnerem `Awilix`. Tento nástroj v personálním systému umožňuje dynamicky skládat moduly a díky podpoře request-scopingu přenášet identitu uživatele (R1) napříč vrstvami bez jejího explicitního předávání v každé metodě. Funkčnost DI ověřuji testy startu aplikace (smoke tests). Omezením je, že část chyb v konfiguraci vazeb se projeví až za běhu systému.

Čtvrtým problémem je zajištění atomicity mezi uložením dat a odesláním vedlejšího efektu (notifikace, analýza životopisu). Pokud by se po uložení uchazeče nepodařilo odeslat zprávu do fronty, systém by zůstal v nekonzistentním stavu. Alternativou by byly distribuované transakce (2PC), které jsou však v on-premise prostředí příliš komplexní. Zvolil jsem vzor `Transactional Outbox`. Doménová změna i požadavek na pozdější provedení vedlejšího efektu se ukládají atomicky v jedné transakci @richardson2018microservices. Správnost toku ověřuji integračními testy, které simulují úspěšné doručení, dočasné selhání konzumenta, opakované doručení a přesun neobnovitelných chyb do chybového stavu. Trade-offem je mírné zpoždění doručení (eventual consistency) a nutnost provozovat outbox worker.

Pátým problémem je riziko duplicitního provedení stejné operace při opakovaném doručení zprávy nebo nechtěném kliknutí uživatele. Alternativou by bylo spoléhat pouze na unikátní klíče v databázi, což však nepokrývá složitější integrační scénáře. Implementoval jsem proto vrstvu `Idempotency`. Ta v kritických bodech (např. odeslání přihlášky) kontroluje unikátní ID požadavku a zabraňuje opakovanému zpracování stejné akce @hohpe2003enterprise. Ověření provádím testy opakovaného odeslání stejného payloadu. Omezením je nutnost vést pomocnou tabulku zpracovaných požadavků s definovanou dobou expirace.

Posledním problémem je integrace s vnějšími systémy (registry, AI služby), které mají cizí datové modely a nespolehlivá rozhraní. Alternativou by bylo přímé volání těchto služeb z domény, což by ji však "znečistilo" cizími detaily. Použil jsem `Anti-Corruption Layer` (ACL). V implementaci napojení na registr kvalifikací NRZP tak doména pracuje se svými typy, zatímco adaptér řeší specifika SOAP rozhraní. Tento přístup chrání stabilitu jádra systému. Správnost ověřuji mockovanými integračními testy. Kompromisem je dodatečná práce s překladem datových struktur.

Backend tak nestojí na jednom izolovaném vzoru, ale na jejich součinnosti. Hexagonální uspořádání chrání doménu, `Repository` izoluje databázi, `Dependency Injection` řídí skládání, `Transactional Outbox` s `Idempotency` stabilizují zápisy a `ACL` odděluje cizí systémy. Teprve v této kombinaci naplňuje implementace nároky na moderní personální platformu v prostředí #abbr("KZ", none).


=== Implementace doménové vrstvy
Smyslem doménové vrstvy není vytvořit další technickou mezivrstvu mezi controllerem a databází, ale soustředit pravidla personálního procesu do místa, které není závislé na HTTP rozhraní, konkrétním databázovém schématu ani integračních službách. V řešeném systému se tato pravidla týkají zejména životního cyklu pracovní pozice, uchazeče, pohovoru, nástupu zaměstnance, organizační příslušnosti a oprávnění k jednotlivým zdrojům.

Alternativou by bylo pojmout backend jako převážně CRUD aplikaci, kde by controllery přijímaly požadavky, repozitáře ukládaly data a většina pravidel by vznikala až jako podmínky v jednotlivých handler funkcích. Tento přístup je rychlý v počáteční fázi vývoje, ale v systému propojujícím nábor, vstupní agendu, autorizaci, audit a integrace by postupně vedl k roztříštění rozhodování. Stejné pravidlo by se snadno objevilo na více místech a bylo by obtížné doložit, která část systému je za něj skutečně odpovědná.

Doménové jádro proto člením do modulů odpovídajících hlavním kontextům systému, tedy zejména náboru, pracovním pozicím, pohovorům, zaměstnancům, organizacím, číselníkům a interním identitám. Každý modul má vlastní případy užití, repozitáře, doménové služby a události. Případ užití zde funguje jako aplikační scénář, který kontroluje vstupní podmínky, načte potřebné doménové objekty, provede změnu a případně vytvoří požadavek na vedlejší efekt. Doménové objekty a služby nesou pravidla, která mají platit bez ohledu na to, zda operace přišla z administračního portálu, integrační služby nebo budoucího jiného klienta.

Typickým příkladem je oddělení definice adaptačního postupu od jeho konkrétní instance nad zaměstnancem. Šablona popisuje, jak má proces vypadat, zatímco instance zachycuje skutečný stav plnění kroků, dokumentů a odpovědností. Podobně v náborové části doména rozlišuje pracovní pozici, uchazeče, pohovor a navazující stavové změny, místo aby šlo pouze o volně provázané záznamy v databázi. Tím se do kódu promítá stejná logika, která byla popsána v konceptuálním a fyzickém datovém modelu.

Přínosem pro #abbr("KZ", none) je srozumitelnější a udržitelnější implementace procesů, které se budou pravděpodobně dál vyvíjet podle interních předpisů, organizačních změn a požadavků jednotlivých závodů. Změna pravidla v oblasti náboru nebo vstupní agendy tak nemusí znamenat zásah do prezentační vrstvy, integračních adaptérů ani auditního mechanismu. Trade-offem je vyšší počáteční pracnost: vývojář musí udržovat hranice modulů, převádět data mezi vrstvami a odolávat pokušení obcházet doménu přímým zápisem do databáze.

=== Vynucení architektonických pravidel
Architektonická pravidla nestačí pouze deklarovat. Proto jsem je v implementaci částečně vynutil testy architektury. Ty ověřují, že doménové moduly neimportují repozitáře jiných modulů napřímo, že služby nepoužívají infrastrukturu mimo definované porty a že business vedlejší efekty nejsou volány mimo outbox handlery.

Tento mechanismus je důležitý hlavně proto, že architektonická kázeň má tendenci upadat právě v okamžiku, kdy projekt roste a přibývá tlak na rychlé úpravy. Testy zde fungují jako technická pojistka proti tomu, aby se výjimka z pravidla stala novým standardem.

=== Testování backendu
Backend pracuje s unit a integračními testy. Cílem nebylo dosáhnout formálně stoprocentního pokrytí kódu, ale pokrýt kritické části systému, u nichž by chyba mohla vést k nekonzistentnímu stavu procesu, porušení autorizace nebo ztrátě důležité vedlejší události. Unit testy proto nahrazují produkční závislosti kontrolovanými implementacemi portů, například repozitářů, auditního zápisu, e-mailové služby nebo vrstvy předávání zpráv. Díky tomu lze ověřit vlastní rozhodování služby bez nutnosti spouštět databázi, `RabbitMQ` nebo externí integrační systémy. Tento přístup přímo navazuje na hexagonální architekturu. Jelikož doména komunikuje s okolím přes porty, lze v testu nahradit vnější svět a soustředit se na pravidlo, nikoli na infrastrukturu.

Integrační testy doplňují tuto rychlou vrstvu tam, kde je potřeba ověřit skutečnou spolupráci s perzistencí nebo sestavenou aplikací. Typicky jde o repozitáře, transakční chování, kontrakty služeb a průchod aplikační logiky přes reálnější infrastrukturu. Tím se snižuje riziko, že jednotkově správná služba selže až při napojení na databázové schéma, transakční hranici nebo registrační konfiguraci DI kontejneru.

Typickými ověřovanými oblastmi jsou validace a normalizace vstupů, idempotence zápisových operací, odložené odeslání vedlejších efektů, auditní události, mapování chyb v controllerech a datový přístup v repozitářích. Testovací vrstva tak nechrání konkrétní interní detaily implementace, ale stabilní pravidla a integrační hranice, které mají zůstat zachovány i při pozdější změně databázového schématu, adaptéru nebo uživatelského rozhraní. Jejím doplněním jsou E2E scénáře veřejného portálu popsané níže, které ověřují celý uživatelský průchod aplikací.

=== Implementace spolehlivé asynchronní komunikace
Pro realizaci využívám tabulku `side_effect_outbox` a samostatný procesní worker. Doménová služba v rámci jedné transakce zapíše business změnu i požadavek na pozdější provedení vedlejšího efektu do outboxu. Worker následně v krátkých intervalech položky uzamyká a provádí jejich publikaci do `RabbitMQ`. Tímto způsobem systém odděluje hlavní cestu požadavku od vedlejších efektů, aniž by ztratil vazbu mezi doménovou změnou a požadavkem na její následné zpracování.

Stav asynchronní vrstvy provozně sleduji prostřednictvím metrik `outbox_lag` a `retry_count`, které jsou vizualizovány v dohledovém dashboardu. Správnost toku ověřuji integračními testy, které simulují úspěšné doručení, dočasné selhání konzumenta, opakované doručení a přesun neobnovitelných chyb do chybového stavu. `RabbitMQ` zde slouží jako architektonický oddělovač mezi producentem a konzumentem události. Umožňuje časově oddělit transakční cestu od zpracování vedlejších efektů a izolovat lokální selhání konzumentů. Výměnou za to systém přijímá sémantiku opakovaného doručení, což vyžaduje, aby konzumenti byli navrženi idempotentně.


#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.9fr, 2.4fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [`event_type` v outboxu], [Implementační efekt],
      [`email.welcome.v1`], [Odeslání uvítacího e-mailu novému zaměstnanci],
      [`email.raw.v1`], [Odeslání generického e-mailu podle doménové události],
      [`notification.role.v1`], [Role-based fan-out notifikace v rámci organizace],
      [`notification.user.v1`], [Cílená notifikace konkrétnímu uživateli],
      [`cv.publish.applicant.v1`], [Publikace události pro AI analýzu CV uchazeče do RabbitMQ],
      [`cv.publish.job_seeker.v1`], [Publikace události pro AI analýzu CV zájemce],
      [`job.embedding.requested.v1`], [Publikace požadavku na AI zpracování job embeddingu],
    )
  ],
  caption: [Typy outbox událostí implementovaných v backendu],
) <tab:impl-outbox-events>

Worker používá dávkové zpracování, zamykání položek, řízené opakování a mrtvý stav pro neobnovitelné chyby. Přímé volání business vedlejších efektů je omezeno na outbox handlery. Doménové služby pouze zapisují požadavek do outboxu. Tím se snižuje riziko nekonzistence mezi databází a integrační vrstvou.

Verzování událostí pomocí suffixu `v1`, případně dalších verzí, slouží k bezpečné evoluci integračního rozhraní. Pokud se změní struktura zprávy nebo její sémantika, lze zavést novou verzi bez nutnosti rozbít stávající konzumenty v jednom kroku.

Cena za tuto robustnost spočívá ve vyšší implementační i provozní komplexitě. Systém musí evidovat stav zpráv, řešit opakované zpracování, sledovat stáří front a rozlišovat dočasnou chybu od neobnovitelného selhání. Přínosem je však výrazně vyšší konzistence dat a nižší riziko tichého výpadku vedlejších efektů, což je v auditovatelném informačním systému důležitější než minimální počet infrastrukturních komponent.

=== Implementace auditní vrstvy
Auditní vrstva řeší problém, jak u citlivých operací nad pozicemi, kandidáty a adaptací uchovat průkaznou stopu vyžadovanou v NF11, tedy auditní záznamy o změnách klíčových entit po dobu nejméně 5 let, aniž by každý zápis neúměrně prodlužoval odezvu běžných operací, pro kterou NF05 stanovuje limit 2 sekund v 95. percentilu. V prostředí #abbr("KZ", none) nejde jen o technický log, ale o možnost zpětně vysvětlit, kdo provedl konkrétní změnu, kdy k ní došlo a jaký měla vztah k průběhu náboru nebo adaptace.

Jednodušší alternativou by bylo zapisovat audit synchronně přímo v hlavní request cestě, ideálně ve stejné transakci jako doménovou změnu. Tento přístup je na první pohled přehledný, protože výsledek operace a auditní záznam vznikají současně. Jeho nevýhodou je však těsné svázání uživatelské operace s auditním úložištěm. Každý pomalejší zápis do auditní tabulky by zvyšoval latenci API a dočasná chyba auditní infrastruktury by mohla zablokovat i běžnou práci HR uživatele.

Zvolené řešení proto auditní stopu nezapisuje synchronně v hlavní cestě požadavku, ale přes samostatný worker `audit_writer_processor`. Backend po provedení doménové operace publikuje auditní událost do `RabbitMQ`. Worker ji následně konzumuje, validuje předaná data a ukládá výsledek do tabulky `audit_events` v `PostgreSQL`. Tím je audit oddělený od kritické části požadavku, ale stále zůstává navázaný na transakční dění systému prostřednictvím jednoznačného typu události, identifikátoru entity, času, aktéra a kontextu operace.

Z implementačního hlediska je důležité odlišovat vykonávací komponentu od datové struktury. `audit_writer_processor` představuje samostatnou zpracovatelskou službu navázanou na vrstvu předávání zpráv, zatímco `audit_events` je perzistentní tabulka, do níž se auditní stopa ukládá. Tato dvojice společně zajišťuje, že audit zůstává mimo kritickou request cestu, ale neztrácí vazbu na transakční dění systému.

Přínosem pro #abbr("KZ", none) je, že systém naplňuje požadavek na dlouhodobou dohledatelnost změn klíčových entit, ale současně nezhoršuje odezvu každé zapisovací operace. Audit lze navíc provozně sledovat jako samostatný datový tok a v případě potřeby jej dále využít pro interní kontrolu, bezpečnostní přezkum nebo dokazování průběhu personálního procesu.

Trade-offem tohoto rozhodnutí je krátké časové okno mezi vznikem události a jejím perzistentním zápisem. Auditní vrstva proto vyžaduje dohled nad stavem fronty, stářím nejstarší nezpracované zprávy, počtem opakovaných pokusů a případnými zprávami v chybovém stavu. Jinými slovy, řešení přesouvá část složitosti z uživatelské cesty požadavku do provozního sledování systému. Tento kompromis je však v daném kontextu vhodný, protože chrání uživatelskou odezvu a zároveň zachovává požadovanou auditovatelnost procesu.

== Implementace vrstvy inteligentního zpracování dat
Vrstva inteligentního zpracování dat vznikla jako řešení na provozní tlak popsaný v analytické části práce. V prostředí #abbr("KZ", none) probíhá nábor kontinuálně, takže systém souběžně pracuje s větším množstvím životopisů i průběžně upravovaných pracovních nabídek. Manuální screening životopisů je přitom časově náročný a snadno vede k přehlédnutí důležitých údajů. Transakční jádro proto nemá nést dokumentové a AI úlohy přímo.

Na tuto situaci odpovídám oddělenou vrstvou implementovanou jako samostatné služby v jazyce Go. Komunikace probíhá asynchronně přes `RabbitMQ` a inference zajišťuje `Ollama` s konfigurovatelným generativním modelem podle konkrétní služby a nasazení. Smyslem této vrstvy není řídit samotný náborový proces, ale doplnit jej o podpůrné schopnosti tam, kde by přímé zpracování dokumentů a textů zbytečně zatěžovalo backend.

Služba `cv_processor` zpracovává příchozí životopisy a je navázána na asynchronní tok přes `RabbitMQ`. Po přijetí události stáhne dokument z objektového úložiště, extrahuje text přes `Apache Tika`, pomocí `Ollama` provede strukturované vytěžení a shrnutí a nad připraveným textem vytvoří embedding pomocí modelu `nomic-embed-text`. Výsledek pak vrací zpět do backendu přes `RabbitMQ`. Embeddingy zde neslouží jen jako doplňkové metadata, ale jako podklad pro sémantické porovnávání uchazečů a pozic. Backend je ukládá do `pgvector` jako `vector(768)`.

Služba `job_processor` řeší jiný typ úlohy. Vystupuje jako samostatná `HTTP/SSE` služba, kterou `hr-backend` volá synchronně při generování a úpravě textů pracovních nabídek. Také zde se používá `Ollama`, ale role služby je odlišná než u `cv_processor`; zatímco jedna služba zpracovává dokumenty a vrací strukturované výstupy do asynchronního toku, druhá obsluhuje interaktivnější tvorbu textu blízkou uživatelské operaci.

Vedle toho běží samostatný asynchronní tok pro embeddingy pracovních pozic. Backend publikuje požadavek `job.embedding.requested.v1`, zpracování připraví text pozice do podoby vhodné pro vektorové porovnávání a výsledný embedding se vrací do tabulky `job_embeddings`. I zde se používá `nomic-embed-text`, takže sémantické porovnávání pracuje nad stejným typem reprezentace jako u životopisů. Oba procesory tak sdílejí stejný inferenční backend, ale plní odlišné implementační role.

Z pohledu ochrany osobních údajů je důležité, že se nevyužívá externí cloudová AI služba. `Ollama` je provozována jako self-hosted inferenční vrstva v rámci on-premise infrastruktury a procesory ji volají lokálně přes interní rozhraní hostitelského serveru. Dokument životopisu, extrahovaný text i výsledné embeddingy se tak pohybují pouze mezi interním objektovým úložištěm, interní vrstvou zpráv, procesory a lokálně provozovaným modelem. Data proto neopouštějí provozní hranici organizace, což je pro prostředí #abbr("KZ", none) podstatný argument z hlediska ochrany osobních údajů a minimalizace regulatorního rizika. Zároveň je zpracování životopisů navázáno na evidenci souhlasu se zpracováním osobních údajů v náborovém toku.

Technické oddělení této vrstvy má přímý provozní důvod. Inference, práce s dokumenty a vektorové výpočty mají jiný výkonnostní a chybový profil než transakční API. Jejich dočasná nedostupnost proto nesmí zablokovat základní náborové funkce a procesy vstupní agendy. Systém tak degraduje řízeně. Uživatelé mohou přijít o část rozšířené funkcionality, nikoli o samotné transakční jádro.

Současně jde o ukázku řízené distribuce pouze tam, kde přináší prokazatelný přínos. Oddělené procesory snižují tlak na backend a umožňují volit jiný runtime i škálování, ale zároveň zvyšují integrační složitost, potřebu observability a počet míst, kde může vzniknout prodleva nebo chyba přenosu. V implementaci proto tuto vrstvu odděluji jen pro úlohy s odlišným výpočetním profilem, nikoli jako obecné pravidlo pro celý systém.

Návaznost mezi transakční operací, vrstvou odloženého odeslání a zpracovatelskými službami je založena na tom, že backend po commitu business dat uloží požadavek na vedlejší efekt do outboxu. Samostatný worker jej následně předá do `RabbitMQ`, odkud jej přebírají specializované procesory podle typu úlohy. Podrobnější realizační schéma tohoto toku je kvůli rozsahu práce uvedeno v příloze @obr:impl-outbox-ai.

== Implementace datové vrstvy a migrací
Datová vrstva řeší problém, jak v jednom systému udržet konzistentní transakční agendu náboru, vstupní agendy, auditní stopy a zároveň podpůrné výstupy inteligentního zpracování dat. Alternativou bylo rozdělit relační data, dokumentová metadata a vektorové reprezentace do více specializovaných úložišť. To by sice přineslo vyšší specializaci jednotlivých databází, ale v on-premise prostředí #abbr("KZ", none) by to současně znamenalo více provozních komponent, složitější zálohování a riziko nekonzistence mezi systémy.

Zvolil jsem proto `PostgreSQL 17` jako primární databázovou platformu a rozšíření `pgvector` pouze tam, kde je potřeba sémantické porovnávání životopisů a pracovních pozic. Přínosem je jeden autoritativní zdroj pravdy pro transakční proces, organizační filtr, auditní události i outbox. Toto rozhodnutí podporuje ochranu osobních údajů (NF01), protože citlivá data a jejich vazby zůstávají pod jednotnou správou, a současně nasaditelnost v on-premise prostředí (NF07), protože nevzniká závislost na externí vektorové službě. Kompromisem je, že specializovaná vektorová databáze by mohla být vhodnější při výrazně větším objemu podobnostního vyhledávání.

Použití `jsonb` u proměnlivých formulářových struktur a `pgvector` u embeddingů je omezeno na oblasti, kde pružnější datový typ skutečně snižuje složitost modelu. V jádru procesu zůstává relační model s referenční integritou. Přínosem pro #abbr("KZ", none) je jednodušší provozní správa a jasnější životní cyklus dat.

=== Fyzický datový model
Fyzický model odpovídá hlavním doménovým hranicím: nábor je veden kolem vazby pracovní role, pracovní pozice, uchazeče a pohovoru, zatímco vstupní agenda odděluje šablonu adaptačního postupu od její konkrétní instance nad zaměstnancem. Alternativou by byl plošší model s menším počtem tabulek a větším množstvím stavových polí. Jeho nevýhodou by byla nejasná odpovědnost záznamů a obtížnější vysvětlení, zda daný údaj popisuje pravidlo procesu, nebo jeho skutečné plnění.

Zvolené rozdělení proto zachovává doménovou sémantiku i ve fyzickém schématu. Organizační izolace je nesena přes klíčové entity a přístupový model je opřen o uživatele, role, členství v organizaci a oprávnění ke zdrojům. Přínosem je, že datová vrstva přímo podporuje multi-tenantní model #abbr("KZ", none) a omezuje riziko, že se autorizace bude řešit až dodatečně nad již načtenými daty. Kompromisem je složitější dotazování a větší nárok na konzistenci relačních vazeb.

Tento model zároveň pomáhá naplnit auditovatelnost podle NF11, protože změny klíčových entit lze vztáhnout ke konkrétnímu uchazeči, pozici, adaptaci nebo organizačnímu kontextu, nikoli pouze k anonymnímu technickému řádku.

=== Migrace schématu
Migrace řeší problém řízené evoluce databázového modelu. Alternativou by byly ruční změny schématu prováděné přímo v prostředí databáze nebo jednorázové skripty mimo životní cyklus aplikace. Takový postup je rychlý při prototypování, ale špatně se audituje, obtížně se opakuje a zvyšuje riziko, že aplikace poběží proti nekompatibilní verzi schématu.

Zvolené řešení používá verzované migrace jako kontrolovaný přechod mezi verzemi aplikace a databáze. Migrace určují, jak se datový model vyvíjí, v jakém pořadí a s jakou vazbou na nasazovanou verzi systému. Přínosem pro #abbr("KZ", none) je reprodukovatelnost, dohledatelnost a lepší předatelnost řešení, což přímo podporuje udržitelnost podle NF08. Kompromisem je nutnost navrhovat i přechodové stavy, aby nová verze aplikace, dlouho běžící workery a existující data zůstaly kompatibilní.

=== Perzistence dokumentů a infrastrukturní tabulky
Dokumenty uchazečů a zaměstnanců představují jiný typ dat než transakční záznamy. Možností by bylo ukládat soubory přímo do relační databáze, což by zjednodušilo práci s referencemi, ale zbytečně by zatížilo transakční úložiště velkými binárními objekty a komplikovalo by práci s verzemi dokumentů.

Zvolené řešení proto ukládá v databázi metadata a vazbu na objektový klíč, zatímco fyzický obsah dokumentu je uložen v objektovém úložišti. Přínosem je oddělení jednodušší škálování úložiště dokumentů a lepší kontrola nad citlivým obsahem v on-premise prostředí. Kompromisem je nutnost hlídat konzistenci mezi databázovým záznamem a objektem v úložišti, zejména při výmazu nebo anonymizaci.

Vedle doménových tabulek proto používám i infrastrukturní struktury pro odložené vedlejší efekty, idempotenci zápisů a auditní události. Tyto tabulky nejsou samostatnou byznysovou doménou, ale chrání správnost životního cyklu dat. Outbox spouští navazující kroky po rozhodnutí transakční vrstvy, idempotence omezuje duplicitní zápisy a auditní tabulka uchovává důkaz o citlivých operacích. Tím se podporuje ochrana osobních údajů (NF01) i auditovatelnost změn klíčových entit (NF11). Trade-offem je vyšší provozní složitost, protože je nutné sledovat nejen stav doménových záznamů, ale také stav navazujících infrastrukturních procesů.

=== Implementace bezpečnosti a identity
V multi-tenantním prostředí #abbr("KZ", none) by čisté RBAC založené pouze na globální roli uživatele nestačilo. Role typu HR pracovník nebo vedoucí oddělení sice popisuje, jaký druh činnosti může uživatel vykonávat, ale sama neurčuje, pro který závod, pracovní pozici nebo skupinu uchazečů má oprávnění platit. Nestačil by ani jednodušší model kombinující globální roli a organizaci, protože některé oprávněné osoby, například vedoucí pracovníci, nemají mít přístup ke všem náborům v dané organizaci, ale jen ke konkrétním inzerátům. Takový model by vedl buď k příliš širokému zpřístupnění dat, nebo k množství lokálních výjimek rozptýlených v aplikačním kódu. Z tohoto důvodu jsem zvolil vztahově orientovaný autorizační model ReBAC, který oprávnění neváže pouze k roli, ale také ke konkrétnímu vztahu uživatele ke zdroji.

Implementace proto myslí na přihlášení přes SSO, globální roli a vazbu ke konkrétnímu zdroji. Přínosem je jemnější řízení přístupů a menší rozsah zpřístupnění osobních údajů (podle NF01). Nevýhodou tohoto řešení je složitější autorizační model.

Princip tohoto oddělení znázorňuje @obr:impl-auth-rebac-flow na příkladu vedoucího pracovníka, který si chce zobrazit životopis uchazeče. Přihlášení pouze potvrzuje jeho identitu a globální role určuje, že jde o oprávněný typ interního uživatele. Samotné zobrazení životopisu je však povoleno až tehdy, když má vedoucí vztah ke konkrétnímu inzerátu, k němuž uchazeč patří.

#figure(
  image(
    "../procesy/architecture/seq-auth-rebac-flow.svg",
    width: 100%,
  ),
  caption: [Příklad ReBAC autorizace při zobrazení životopisu uchazeče vedoucím pracovníkem]
) <obr:impl-auth-rebac-flow>

Dědění přístupu je v tomto modelu řešeno přes vztah k nadřazenému zdroji. Oprávnění se materializují zejména pro organizaci a pracovní pozici, zatímco navázaná data uchazeče, poznámky, přílohy nebo pohovory přebírají přístup přes vazbu na konkrétní inzerát. Přínosem je menší redundance a nižší riziko zastaralých ACL záznamů. Kompromisem jsou náročnější dotazy, které musí tento vztah při čtení nebo změně dat správně vyhodnotit.

== Implementace onboardingového portálu
Onboardingový portál jsem implementoval jako samostatnou aplikaci oddělenou od veřejného kariérního portálu. Toto rozdělení řeší problém, že HR pracovníci a nastupující zaměstnanci potřebují pracovat s odlišnými typy úloh i s jiným bezpečnostním režimem. Na úrovni implementace jsem proto oddělil layouty, cesty i stavovou logiku podle role uživatele.

Na implementační úrovni portál skládá pohled zaměstnance a interních pracovníků nad stejným backendem, ale s odlišnými layouty, trasami a stavovou logikou. Tím se zachovává jednotný zdroj pravdy v API a zároveň se respektuje, že HR role pracuje s přehledem procesu, zatímco nastupující zaměstnanec s konkrétní sadou kroků, termínů a dokumentů. Přínosem je vyšší srozumitelnost práce s onboardingem, omezením naopak nutnost udržovat další frontendovou aplikaci a synchronizovat její vývoj s backendem.


== Implementace kariérního portálu
Kariérní portál `kariera.kzcr.eu` jsem implementoval jako veřejný vstup do náborového procesu. Frontend je oddělen od backendu záměrně. Veřejný portál řeší prezentaci obsahu, navigaci a interakci s uchazečem, zatímco business pravidla pro práci s pozicemi, uchazeči a formulářovými daty zůstávají v jednom autoritativním API.

Domovská stránka propojuje obsahové a transakční scénáře. Uchazeč zde najde benefity, tematické kategorie pracovních rolí, mapový přehled nemocnic a vstup do katalogu volných míst. Samotný náborový tok tvoří seznam pozic, detail konkrétní nabídky a formulář reakce na vybranou pozici. Vedle toho portál obsahuje i samostatný kontakt pro zájemce bez vazby na konkrétní inzerát.

Komunikaci s backendem jsem soustředil do centralizované API vrstvy místo přímých HTTP volání z jednotlivých komponent. Tím řeším problém duplicitní síťové logiky v rozhraní a zjednodušuji změny v adresaci endpointů, timeoutu požadavků i mapování chybových stavů. Stav filtrů v katalogu pozic je navíc synchronizován s URL parametry, aby bylo možné konkrétní výběr sdílet a znovu otevřít ve stejném stavu.

Z pohledu uživatelské zkušenosti bylo důležité zachovat kontext při pohybu mezi seznamem a detailem pozice. Pro krátkodobý kontext používá portál `sessionStorage`, například pro návrat na stejné místo v seznamu, zatímco `localStorage` slouží k uchování vybraných pozic mezi jednotlivými navigacemi. Formulář reakce současně provádí klientskou validaci a používá idempotency klíč, aby se snížilo riziko duplicitních žádostí při opakovaném kliknutí nebo nestabilním spojení.

Vzhledem k tomu, že backend vrací popis pozice ve formátu HTML, řešil jsem i bezpečné vykreslení obsahu. HTML proto před zobrazením sanitizuji, aby se do stránky nedostal neověřený nebo škodlivý obsah. Jde o zdánlivý detail, ale právě na podobných místech se láme důvěryhodnost veřejného portálu.

Na @obr:career-portal-catalog je zachycen katalog volných pozic v desktopovém zobrazení po aplikaci fulltextového dotazu a kombinace filtrů. V levé části rozhraní jsou ovládací prvky pro zpřesnění výběru, konkrétně zařazení, lokalitu, pracovní roli a typ úvazku, zatímco pravá část je vyhrazena pro vyhledávací pole, souhrn výsledku a samotný seznam nabídek. Toto rozvržení jsem zvolil proto, aby uchazeč mohl opakovaně upravovat dotaz bez ztráty kontextu a současně průběžně sledovat, jak se změna filtru promítá do výsledné množiny pozic.

#figure(
  image(
    "../procesy/implementation/career-portal-catalog.jpeg",
    width: 100%,
  ),
  caption: [Katalog volných pozic s filtračním panelem a výsledkovou kartou]
) <obr:career-portal-catalog>

Rozhraní záměrně vychází z ustálených vzorců kariérních portálů. Náhledová karta shrnuje klíčové atributy nabídky a filtrační panel zůstává při práci s katalogem stabilní, aby uchazeč mohl porovnávat více výsledků bez opakované orientace v rozhraní. Nejde tedy o grafické rozhodnutí samo o sobě, ale o snahu snížit kognitivní zátěž v situaci, kdy uživatel rychle prochází větší množství podobných nabídek a rozhoduje se, zda pokračovat do detailu a formuláře reakce.

=== E2E testování portálu
Spolehlivost veřejného portálu je podpořena automatizovaným ověřením celé veřejné náborové cesty. Vzhledem k tomu, že portál představuje vstupní bod pro uchazeče, nepovažoval jsem za dostačující ověřovat jen jednotlivé prvky uživatelského rozhraní. Klíčové bylo chránit tok od vyhledání pracovní pozice přes otevření jejího detailu až po odeslání reakce s životopisem a současně tak ověřit integrační kontrakt mezi frontendem a odděleným transakčním API. Tento krok nepředstavuje přímé měření dostupnosti ve smyslu NF04, tedy dostupnosti alespoň 99,5 % v pracovních dnech mezi 6:00 a 22:00, ale snižuje riziko regresí v kritické veřejné náborové cestě. Dostupnost jako provozní vlastnost je následně sledována až v dohledové vrstvě prostřednictvím healthchecků, metrik dostupnosti služeb a stavů integračních komponent. Jako alternativu jsem mohl zvolit pouze komponentové nebo integrační testy s mockovaným API, ty by však neodhalily poruchy vznikající až při běhu sestaveného portálu proti skutečně spuštěnému backendu. Reálnou alternativou byl i `Cypress`, avšak pro tento projekt jsem zvolil `Playwright`, protože umožňuje spouštět scénáře nad sestavenou verzí portálu v reálném prohlížeči, dobře pracuje s navigací, nahráváním příloh a více krokovým formulářovým tokem a současně se přirozeně integruje do `CI/CD` pipeline, včetně opakování selhaných běhů a záznamu trasování při chybě.

Testovací scénáře obsahují zobrazení veřejného seznamu pozic, vyloučení neveřejných nabídek, filtrování a vyhledávání nad skutečným API, přechod ze seznamu do detailu a dále na formulář reakce, odeslání přihlášky v režimu s povinným i nepovinným životopisem, klientskou validaci formulářů, samostatný kontaktní formulář i formulář pro zájemce bez vazby na konkrétní pozici. U klíčových scénářů nekončím na úrovni obrazovky, ale kontroluji i perzistenci výsledku v databázi, například vznik záznamu uchazeče, uložení přílohy nebo zápis kontaktního dotazu. Tímto postupem snižuji riziko, že po změně frontendu, API nebo validační logiky zůstane portál vizuálně dostupný, ale fakticky přestane spolehlivě přijímat použitelné reakce.

=== Integrace analytického nástroje Umami
Pro analytické účely jsem do portálu integroval nástroj `Umami`. Jeho smyslem není zasahovat do rozhodování systému, ale měřit průchod uživatelů portálem a identifikovat místa, kde uchazeči proces opouštějí. Inicializace analytiky je provedena centrálně v kořenové komponentě aplikace, aby bylo zajištěno jednotné měření napříč stránkami.

Sleduji zejména interakce s katalogem pozic, otevření detailu nabídky, zahájení reakce na pozici, práci s formulářem a výsledek jeho odeslání. Tato data slouží jako podpůrný vstup pro další iterace portálu a doplňují kvalitativní poznatky z pilotního uživatelského ověření.

`Umami` jsem zvolil především proto, že odpovídá provozní logice celého řešení. Jde o relativně lehký nástroj, který lze provozovat ve vlastním prostředí, nevyžaduje rozsáhlou marketingovou konfiguraci a dobře se hodí pro měření účelově definovaných událostí nad veřejným portálem. Tato vlastnost je důležitá i ve vztahu k nefunkcionálnímu požadavku NF07, podle něhož musí být systém nasaditelný na infrastruktuře organizace v režimu on-premise. V mém případě bylo proto podstatné i to, že analytický skript mohu do aplikace připojit centrálně a při on-premise nasazení jej zpřístupnit přes vlastní proxy cestu, takže analytická vrstva nenarušuje architektonickou kontrolu nad veřejným rozhraním. Alternativou byly robustnější platformy typu `Google Analytics 4`, které však přinášejí vyšší závislost na externí cloudové službě a širší záběr, než jaký byl pro tento portál potřebný. Druhou realistickou alternativou bylo `Matomo`, které je rovněž možné provozovat lokálně, ale pro daný rozsah by znamenalo vyšší provozní režii a složitější správu. `Umami` se proto ukázalo jako přiměřený kompromis mezi kontrolou nad daty, jednoduchostí provozu a dostatečnou analytickou vypovídací hodnotou.

Na úrovni aplikace generuji strukturované logy a publikuji metriky pro kritické toky, například autentizaci, outbox, vrstvu předávání zpráv a vrstvu inteligentního zpracování dat. Tyto výstupy následně vstupují do samostatné monitorovací vrstvy popsané v architektonické kapitole. 

== Komunikace s národními registry
Napojení na národní registry jsem řešil primárně pro Národní registr zdravotnických pracovníků (`NRZP`) spravovaný #abbr("ÚZIS", none). Praktická zkušenost ukázala, že samotné technické rozhraní ještě neznamená funkční integraci. Vedle klientského certifikátu bylo nutné řešit i přidělení externích identifikačních údajů a odpovídajících oprávnění na straně poskytovatele služby.

Konkrétním integračním problémem bylo, že veřejně popsané `SOAP/WSDL` rozhraní neodpovídalo plně rozhraní, které bylo ve skutečnosti zpřístupněno pro provozní použití. V praxi se tak rozcházel očekávaný způsob napojení s reálně dostupnou vrstvou nad `InterSystems IRIS`, včetně konkrétních metod pro dotaz podle čísla pracovníka a rodného čísla. Součástí řešení proto bylo i doplnění potřebné `WSDL` popisné vrstvy a mapování metod na straně `IRIS`, aby bylo možné službu volat konzistentně a bez přenášení těchto odchylek do aplikační vrstvy. Nebylo proto účelné vázat backend přímo na generovaného `SOAP` klienta, protože by tím přebíral nestabilitu cizího integračního detailu do vlastní doménové logiky.

Z architektonického hlediska jsem proto integrační logiku neumístil přímo do `hiring_backend`, ale zarámoval ji jako adaptační mezivrstvu blízkou vzoru `Adapter / Anti-Corruption Layer` a oddělil ji do interní služby `qualification-adapter`. Backend vystavuje pouze administrační endpoint `POST /api/v1/admin/qualifications/lookup`, který je dostupný vybraným rolím. Doménová služba podporuje dotaz podle čísla pracovníka v `NRZP` i podle rodného čísla, vstup normalizuje a validuje a teprve potom volá platformní adaptér.

`qualification-adapter` běží pouze v interní Docker síti a funguje jako mezivrstva mezi backendem a integrační vrstvou nad `InterSystems IRIS`. Volba `IRIS` zde není náhodná. V prostředí #abbr("KZ", none) se tato platforma dlouhodobě používá jako integrační vrstva pro napojování okolních systémů, a proto bylo vhodnější navázat na existující provozní standard než zavádět pro jedinou vazbu samostatný integrační middleware. Tento mezistupeň pak řeší tři problémy najednou. Izoluje specifika skutečně dostupného integračního rozhraní mimo business logiku, sjednocuje chybové stavy do kontrolovaného HTTP kontraktu a zjednodušuje případnou výměnu integračního detailu bez zásahu do domény. 

Výstup z registru backend převádí do jednotné doménové struktury obsahující identifikaci pracovníka a seznam odborných, specializovaných a zvláštních odborných způsobilostí. Současně vytváří auditní záznam o úspěšném i neúspěšném dotazu. Z důvodu ochrany osobních údajů se v auditu neukládá plné rodné číslo ani plné identifikátory dotazu, ale pouze jejich maskovaná podoba a hash. Implementace tak spojuje automatizaci kontroly kvalifikace s provozní kontrolou nad citlivou integrační vazbou.

== Ověření architektonických cílů
Prokázání, že implementace skutečně naplňuje dříve definované cíle, je nezbytnou součástí inženýrského přístupu. Tato sekce proto mapuje nefunkcionální požadavky NF01-NF11 a také hlavní funkční požadavky F01-F25 a jejich vazbu na rámcové cíle R1-R6.

Funkční část řešení je pokryta rozdělením systému na veřejný kariérní portál, interní administrační rozhraní, portál vstupní agendy, integrační služby a datovou/reportingovou vrstvu. Kariérní portál naplňuje požadavky F01-F06 tím, že poskytuje katalog pozic, detail nabídky, online reakci uchazeče, registraci zájemce a kontaktní vstup do organizace. Interní náborová agenda pokrývá F07-F12 prostřednictvím správy pracovních pozic, evidence kandidátů, pohovorů, stavových změn, komunikačních šablon a přehledů pro vedoucí pracovníky.

Požadavky F13-F15 jsou realizovány integračním napojením na #abbr("NRZP", none) přes oddělený `qualification-adapter`, který umožňuje ověření odborné způsobilosti, sjednocuje výsledek dotazu do doménového modelu a vytváří auditovatelný záznam o provedené kontrole. Vstupní agenda a adaptace podle F16-F21 jsou pokryty samostatným portálem a doménovým modelem, který odděluje šablonu adaptačního postupu od konkrétní instance zaměstnance, eviduje plnění kroků a umožňuje sledovat stav adaptace. Požadavky F22-F25 se promítají do multi-tenantního datového modelu, organizačních filtrů, rolí centrální správy a přehledových dat nad náborem a adaptací.

Ochrana osobních údajů podle NF01 je v implementaci podpořena tím, že zpracování životopisů a AI inference probíhá v on-premise prostředí, citlivé identifikátory v auditních záznamech jsou maskovány nebo nahrazeny hashem a přístup k osobním údajům je vyhodnocován přes autorizační model. Autentizace podle NF02 je řešena napojením na SSO prostřednictvím OAuth 2.0/OIDC toku a navazujícím vytvořením aplikačního kontextu uživatele. Řízení přístupů podle NF03 je realizováno kombinací globálních rolí a vztahových oprávnění nad konkrétní organizací nebo zdrojem.

Požadavek NF04 na dostupnost alespoň 99,5 % není prokazován samotnými E2E testy, ale provozním dohledem popsaným v kapitole nasazení, kde se sledují healthcheck endpointy, metriky dostupnosti a stav integračních komponent. Výkon podle NF05 podporuje oddělení výpočetně náročné vrstvy od transakčního backendu, asynchronní zpracování vedlejších efektů a audit mimo hlavní cestu požadavku. Přístupnost podle NF06 se týká především veřejného kariérního portálu, který je navržen jako responzivní rozhraní s ohledem na zásady WCAG 2.1 na úrovni AA a je ověřován scénáři nad reálným prohlížečem.

Nasaditelnost podle NF07 je podpořena volbou technologií provozovatelných v infrastruktuře organizace prostřednictvím kontejnerizace, zejména `PostgreSQL`, `SeaweedFS`, `RabbitMQ` a `Ollama`. Udržitelnost podle NF08 podporuje modulární struktura backendu, verzované migrace, architektonické testy a dokumentované hranice mezi doménou a adaptéry. Lokalizace podle NF09 je naplněna českým uživatelským rozhraním a prací s českou diakritikou ve frontendové, API i databázové vrstvě. Kompatibilita kariérního portálu podle NF10 je podporována volbou běžného webového stacku kompatibilního s aktuálními verzemi prohlížečů Chrome, Firefox, Safari a Edge. Auditovatelnost podle NF11 je realizována auditní tabulkou a asynchronní auditní vrstvou, která uchovává záznamy o změnách klíčových entit bez zbytečného zvyšování odezvy běžných operací.
