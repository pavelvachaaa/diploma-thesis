#import "../template/abbreviations.typ": abbr

Architektonický návrh má smysl jen tehdy, pokud se podaří převést jeho principy do konkrétní implementace, aniž by došlo k jeho narušení vlivem technologických kompromisů @mauro2024digital. V této kapitole proto neuvádím úplný výpis všech tříd, tabulek a endpointů, ale zaměřuji se na rozhodnutí, která určují rozdíl mezi formálně správným návrhem a skutečně provozně použitelným systémem.

Kapitola se zaměřuje především na modulární backend, hexagonální uspořádání, spolehlivou asynchronní komunikaci, datovou vrstvu, bezpečnostní model a oddělenou vrstvu inteligentního zpracování dat. Právě v těchto částech se ukazuje, zda navržená architektura dokáže unést reálné procesní a provozní požadavky #abbr("KZ", none).

== Struktura řešení
Celé řešení je implementováno jako sada spolupracujících aplikací a služeb s oddělenými odpovědnostmi. Backend je realizován v prostředí `Node.js` s frameworkem `Express`, webové portály jsou postaveny na `Next.js` a podpůrné zpracovatelské či integrační služby běží převážně v jazyce Go.

Volba Node.js a Express vychází z charakteru backendu. Jádro systému je převážně I/O orientované HTTP API s častými integračními voláními a asynchronním předáváním událostí, což dobře odpovídá neblokujícímu modelu Node.js.

Express zde slouží jako minimální HTTP vrstva na zpracování požadavků. Nevnucuje vlastní doménový model, umožňuje přímo skládat cesty, middleware a adaptéry a zapadá tím do hexagonálního uspořádání. Oproti uceleným frameworkům, jako je NestJS, poskytuje větší kontrolu nad hranicí mezi frameworkem a doménovou logikou. Alternativní možnosti, například Spring Boot či ASP.NET Core, by v daném rozsahu přinesly více konvencí a vyšší implementační režii bez zřetelného přínosu.

Webové portály jsou postaveny na Next.js. Kromě technických vlastností hrála roli i vyzrálost ekosystému, aktivní komunita, kvalitní dokumentace a průběžný vývoj snižují riziko technologického úpadku a zhoršené udržovatelnosti. Framework zároveň přirozeně rozšiřuje React, což umožnilo využít známý vývojový model i existující znalosti. Oproti čistě klientské aplikaci v 
React poskytuje Next.js lepší podporu serverového vykreslení a strukturování aplikace. Alternativou byl také jiný ekosystém, například Nuxt, ten by však vedl k roztříštění technologického základu. Zvolený přístup tak podporuje dlouhodobou udržitelnost i sjednocení obou portálů.

Volba jazyka Go u procesorů nebyla motivována dostupností knihoven pro práci s modely. Samotná inference je delegována do služby Ollama a extrakce textu do Apache Tika, obě dostupné přes HTTP. Z funkčního hlediska by proto bylo možné tyto komponenty implementovat i v Node.js, což by sjednotilo technologický stack. Rozhodující byly jejich provozní vlastnosti. cv_processor běží jako dlouhožijící worker s více souběžnými konzumenty fronty a job_processor jako samostatná HTTP/SSE služba. Go v tomto kontextu nabízí jednoduchý model souběžnosti, malé samostatně nasaditelné binární soubory a předvídatelné chování u specializovaných služeb, které neřeší rozsáhlou doménovou logiku ani uživatelské rozhraní.

Vedle hlavního backendu řešení zahrnuje i samostatné služby pro auditní zápis, integrační adaptéry a inteligentní zpracování dokumentů či textů pracovních pozic. Tyto komponenty spolu komunikují přes HTTP nebo přes `RabbitMQ`. `RabbitMQ` jsem zvolil proto, že umožňuje spolehlivě oddělit transakční cestu od vedlejších efektů, aniž by bylo nutné zavádět robustnější streamovací platformu. Alternativou bylo čistě synchronní volání mezi službami nebo platforma typu `Kafka`. První varianta by zhoršovala odezvu a odolnost systému, druhá by v tomto měřítku přinesla spíše vyšší provozní režii.

Zvolený technologický mix tedy nesměřuje k pestrosti pro ni samu, ale k přiřazení vhodného nástroje konkrétnímu typu problému. Přínosem je lepší přizpůsobení jednotlivých částí jejich provoznímu profilu, omezením naopak vyšší nárok na koordinaci buildů, nasazení a dohledu.

@obr:impl-solution-overview ukazuje nasazované komponenty řešení a jejich hlavní komunikační vazby. Je na něm vidět trojice klientských aplikací nad společným backendem, návaznost backendu na integrační a auditní služby, propojení s databází, objektovým úložištěm a vrstvou předávání zpráv i oddělení inteligentní vrstvy od hlavní aplikační cesty.

#figure(
  image(
    "../procesy/architecture-implementation-16x9.svg",
    width: 100%,
  ),
  caption: [Nasazované komponenty řešení a jejich hlavní komunikační vazby],
) <obr:impl-solution-overview>

== Implementace backendu
Backend byl implementován modulárně s hexagonálním architektonickým uspořádáním. Vnitřní část backendu tvoří aplikační služby, doménová pravidla a porty, zatímco vstupní a výstupní adaptéry zůstávají na jejím okraji.

Zpracování požadavku začíná v routovací vrstvě, kde middleware zajišťuje autentizaci a vytvoření kontextu požadavku. Vstupní adaptéry následně převádějí HTTP vstup na aplikační modely a volají aplikační službu nebo případ užití (use-case). Pokud tato logika potřebuje komunikovat s okolím, například s perzistencí, auditem nebo vrstvou zpráv, vyjadřuje tuto potřebu portem. Konkrétní technologické napojení pak poskytuje výstupní adaptér.

Skládání těchto částí řídí dependency injection (DI) kontejner Awilix. V této části je důležitá zejména jeho role v kompozičním kořeni aplikace. Propojuje aplikační služby s konkrétními adaptéry a zajišťuje oddělený kontext pro každý požadavek, ve kterém lze v rámci jednoho požadavku sdílet identitu uživatele nebo databázovou transakci napříč vrstvami. Doménový kód přitom zůstává bez závislosti na DI frameworku.

Takto navržený backend tvoří hlavní transakční jádro systému. V aplikačních službách a doménové logice se vyhodnocuje, zda je konkrétní změna v souladu s doménovými pravidly, s rozsahem oprávnění uživatele i s požadavky na auditní dohledatelnost. Z formálního hlediska jde o koncentraci invariantů, tedy pravidel, která musí v systému vždy platit, do doménové a aplikační vrstvy. Tím se minimalizuje riziko jejich nekonzistentní implementace napříč frontendem, integračními službami a databázovými skripty.

Adresářová struktura backendu proto není pouze technickým rozdělením souborů, ale prostředkem, jak udržet směr závislostí pod kontrolou. Moduly v `src/core` vyjadřují aplikační scénáře a doménové typy, zatímco adaptéry na okraji systému překládají HTTP požadavky, databázové operace nebo integrační protokoly do kontraktů, kterým jádro rozumí. Díky tomu lze o změnách v náboru, kvalifikacích nebo provozním auditu uvažovat nejprve v jazyce domény a až následně v jazyce endpointů, tabulek nebo externích služeb.

@tab:impl-backend-layers plní roli orientačního průvodce, který propojuje teoretické prvky hexagonální architektury s jejich fyzickou realizací v adresářové struktuře backendu.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.45fr, 2.55fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Prvek hexagonu], [Implementační realizace v projektu],
      [Vstupní adaptéry],
      [`src/adapters/in/http/` - routy a controllery převádějící HTTP požadavky na volání aplikačních služeb.],

      [Aplikační vrstva / případy užití],
      [`src/core/*/application/` - aplikační scénáře nad doménovými typy, například kvalifikace, číselníky, organizace, audit nebo outbox.],

      [Doménové moduly],
      [`src/core/*/domain/` - doménové objekty, pravidla a validace nezávislé na HTTP, databázi a integračních službách.],

      [Výstupní porty],
      [`src/core/*/application/ports/` a `src/shared/contracts/runtime/` - kontrakty pro perzistenci, audit, outbox, integrační služby a další okolní schopnosti.],

      [Výstupní adaptéry],
      [`src/adapters/out/persistence/`, `src/adapters/out/integration/` a `src/platform/` - konkrétní napojení na PostgreSQL, audit, outbox, ReBAC, soubory, e-mail a externí služby.],

      [Vazba port-adaptér],
      [`src/container.js` a `src/container.registry.js` - kompoziční kořen, kde `Awilix` propojuje aplikační moduly, porty a adaptéry.],
    )
  ],
  caption: [Mapování prvků hexagonální architektury na implementační vrstvy backendu],
) <tab:impl-backend-layers>

=== Použité vzory a techniky v backendu
Tato sekce shrnuje klíčová architektonická rozhodnutí v backendu. Každý zvolený vzor reaguje na konkrétní výzvu personálního systému a je zdůvodněn vztahem k požadavkům #abbr("KZ", none).

Prvním rozhodnutím je promítnutí hexagonálního uspořádání, zdůvodněného v návrhu struktury backendu v @sec:arch-backend-structure, do konkrétního kódu. V kontextu #abbr("KZ", none) tento přístup zajišťuje, že rozhodování o náboru nebo vstupní agendě zůstává technologicky agnostické, což podporuje předatelnost verzovaného a dokumentovaného zdrojového kódu požadovanou v NF08. Správnost rozdělení ověřuji architektonickými testy hlídajícími čistotu importů mezi jádrem, porty a adaptéry. Cenou za toto oddělení je vyšší počet explicitních kontraktů a nutnost mapování dat mezi vrstvami.

Další rozhodnutí se týká závislosti aplikačních služeb na fyzickém schématu databáze. Přímé používání SQL v případech užití by ztížilo refaktorování i testování, protože by se doménová pravidla pevně svázala s tabulkami. Alternativou by bylo použití `Active Record` vzoru, který je sice rychlejší na implementaci, ale pevně váže logiku na databázový model. Zvolil jsem proto vzor `Repository`. Ten v doméně umožňuje pracovat s uchazeči a pozicemi jako s ucelenými objekty bez ohledu na to, zda jsou uloženi v relační tabulce nebo v budoucnu v jiném typu úložiště. Ověření probíhá skrze integrační testy repozitářů nad reálnou databází. Kompromisem je další úroveň abstrakce, kterou je třeba udržovat.


Skládání závislostí v modulární aplikaci řeším pomocí *Dependency Injection* s kontejnerem `Awilix`. Ruční propojování služeb a adaptérů by při desítkách komponent vedlo k nepřehlednému kompozičnímu kódu a obtížnému testování. Funkčnost DI ověřuji testy startu aplikace (smoke tests). Omezením je, že část chyb v konfiguraci vazeb se projeví až za běhu systému.

Samostatnou oblastí je zajištění atomicity mezi uložením dat a odesláním vedlejšího efektu, například notifikace nebo analýzy životopisu. Pokud by se po uložení uchazeče nepodařilo odeslat zprávu do fronty, systém by zůstal v nekonzistentním stavu. Alternativou by byly distribuované transakce (2PC), které jsou však v on-premise prostředí příliš komplexní @richardson2018microservices. Zvolil jsem vzor `Transactional Outbox`. Doménová změna i požadavek na pozdější provedení vedlejšího efektu se ukládají atomicky v jedné transakci. Správnost toku ověřuji integračními testy, které simulují úspěšné doručení, dočasné selhání konzumenta, opakované doručení a přesun neobnovitelných chyb do chybového stavu. Cenou za to je mírné zpoždění doručení (eventual consistency) a nutnost provozovat outbox worker.

S asynchronním zpracováním a veřejnými formuláři souvisí také riziko opakovaného provedení téže operace. V praxi může stejná zpráva dorazit z fronty vícekrát, uživatel může opakovaně kliknout na odeslání formuláře nebo může klient po výpadku spojení zopakovat požadavek, jehož první zpracování už proběhlo. Výsledkem by mohly být duplicitní přihlášky, opakované notifikace nebo vícenásobné spuštění integrační akce. Jednodušší možností by bylo spoléhat pouze na unikátní klíče v databázi, což však nepokrývá složitější integrační scénáře a neřeší opakované vedlejší efekty. Implementoval jsem mechanismus zajištění idempotence požadavků. Ta v kritických bodech, například při odeslání přihlášky, kontroluje unikátní ID požadavku a zabraňuje opakovanému zpracování stejné akce @hohpe2003enterprise. Ověření provádím testy opakovaného odeslání stejného těla požadavku. Omezením je nutnost vést pomocnou tabulku zpracovaných požadavků s definovanou dobou expirace.

Poslední oblastí je integrace s vnějšími systémy, například registry nebo službami inteligentního zpracování dat, které mají cizí datové modely a nespolehlivá rozhraní. Standardní možností by bylo přímé volání těchto služeb z domény, což by ji však "znečistilo" cizími detaily. Použil jsem vzor `Anti-Corruption Layer` (ACL). V implementaci napojení na registr kvalifikací NRZP tak doména pracuje se svými typy, zatímco adaptér řeší specifika SOAP rozhraní. Tento přístup chrání stabilitu jádra systému. Správnost ověřuji mockovanými integračními testy. Kompromisem je dodatečná práce s překladem datových struktur.

Backend tak nestojí na jednom izolovaném vzoru, ale na jejich součinnosti. Hexagonální uspořádání chrání doménu, `Repository` izoluje databázi, `Dependency Injection` řídí skládání, `Transactional Outbox` s `Idempotency` stabilizují zápisy a `ACL` odděluje cizí systémy. Teprve v této kombinaci naplňuje implementace nároky na moderní platformu v prostředí #abbr("KZ", none).


=== Implementace doménové vrstvy
Smyslem doménové vrstvy není vytvořit další technickou mezivrstvu mezi controllerem a databází, ale soustředit pravidla personálního procesu do místa, které není závislé na HTTP rozhraní, konkrétním databázovém schématu ani integračních službách. V řešeném systému se tato pravidla týkají zejména životního cyklu pracovní pozice, uchazeče, pohovoru, nástupu zaměstnance, organizační příslušnosti a oprávnění k jednotlivým zdrojům.

Alternativou by bylo pojmout backend jako převážně CRUD aplikaci, kde by controllery přijímaly požadavky, repozitáře ukládaly data a většina pravidel by vznikala až jako podmínky v jednotlivých handler funkcích. Tento přístup je rychlý v počáteční fázi vývoje, ale v systému propojujícím nábor, vstupní agendu, autorizaci, audit a integrace by postupně vedl k roztříštění rozhodování. Stejné pravidlo by se snadno objevilo na více místech a bylo by obtížné doložit, která část systému je za něj skutečně odpovědná.

Doménovou logiku proto člením do skupin podle významových oblastí systému, nikoli podle čistě technických operací. Patří sem zejména uchazeči, pracovní pozice, pohovory, zaměstnanci, dokumenty, onboarding, autentizace, notifikace, organizace, číselníky, oprávnění, kvalifikace, provozní pohledy a kontaktní dotazy. Případ užití zde funguje jako aplikační scénář, který kontroluje vstupní podmínky, načte potřebné objekty, provede změnu a případně vytvoří požadavek na vedlejší efekt.

Typickým příkladem je oddělení definice adaptačního postupu od jeho konkrétní instance nad zaměstnancem. Šablona popisuje, jak má proces vypadat, zatímco instance zachycuje skutečný stav plnění kroků, dokumentů a odpovědností. Podobně v náborové části doména rozlišuje pracovní pozici, uchazeče, pohovor a navazující stavové změny, místo aby šlo pouze o volně provázané záznamy v databázi. Tím se do kódu promítá stejná logika, která byla popsána v konceptuálním a fyzickém datovém modelu.

Přínosem pro #abbr("KZ", none) je srozumitelnější a udržitelnější implementace procesů, které se budou pravděpodobně dál vyvíjet podle interních předpisů, organizačních změn a požadavků jednotlivých závodů. Změna pravidla v oblasti náboru nebo vstupní agendy tak nemusí znamenat zásah do prezentační vrstvy, integračních adaptérů ani auditního mechanismu. Kompromisem je vyšší počáteční pracnost. Vývojář musí udržovat hranice modulů, převádět data mezi vrstvami a odolávat pokušení obcházet doménu přímým zápisem do databáze.

=== Vynucení architektonických pravidel
Architektonická pravidla nestačí pouze deklarovat. Proto jsem je v implementaci částečně vynutil testy architektury. Ty ověřují, že doménové moduly neimportují repozitáře jiných modulů napřímo, že služby nepoužívají infrastrukturu mimo definované porty a že business vedlejší efekty nejsou volány mimo outbox handlery.

Tento mechanismus je důležitý hlavně proto, že architektonická kázeň má tendenci upadat právě v okamžiku, kdy projekt roste a přibývá tlak na rychlé úpravy. Testy zde fungují jako technická pojistka proti tomu, aby se výjimka z pravidla stala novým standardem.

=== Testování backendu
Backend pracuje s unit a integračními testy. Cílem nebylo dosáhnout formálně stoprocentního pokrytí kódu, ale pokrýt kritické části systému, u nichž by chyba mohla vést k nekonzistentnímu stavu procesu, porušení autorizace nebo ztrátě důležité vedlejší události. Unit testy proto nahrazují produkční závislosti kontrolovanými implementacemi portů, například repozitářů, auditního zápisu, e-mailové služby nebo vrstvy předávání zpráv. Díky tomu lze ověřit vlastní rozhodování služby bez nutnosti spouštět databázi, `RabbitMQ` nebo externí integrační systémy. Tento přístup přímo navazuje na hexagonální architekturu. Jelikož doména komunikuje s okolím přes porty, lze v testu nahradit vnější svět a soustředit se na pravidlo, nikoli na infrastrukturu.

Integrační testy doplňují tuto rychlou vrstvu tam, kde je potřeba ověřit skutečnou spolupráci s perzistencí nebo sestavenou aplikací. Typicky jde o repozitáře, transakční chování, kontrakty služeb a průchod aplikační logiky přes reálnější infrastrukturu. Tím se snižuje riziko, že jednotkově správná služba selže až při napojení na databázové schéma, transakční hranici nebo registrační konfiguraci DI kontejneru.

Typickými ověřovanými oblastmi jsou validace a normalizace vstupů, idempotence zápisových operací, odložené odeslání vedlejších efektů, auditní události, mapování chyb v controllerech a datový přístup v repozitářích. Testovací vrstva tak nechrání konkrétní interní detaily implementace, ale stabilní pravidla a integrační hranice, které mají zůstat zachovány i při pozdější změně databázového schématu, adaptéru nebo uživatelského rozhraní. Jejím doplněním jsou E2E scénáře veřejného portálu popsané níže, které ověřují celý uživatelský průchod aplikací.

=== Implementace spolehlivé asynchronní komunikace
Tato část konkretizuje, kde se v implementaci realizuje spolehlivá komunikace mezi transakčním backendem, `RabbitMQ` a navazujícími konzumenty. Popisuje hlavně napojení vzoru `Transactional Outbox` na reálný databázový model a provozní worker.

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
      [`notification.role.v1`], [Rozeslání notifikace podle role v rámci organizace],
      [`notification.user.v1`], [Cílená notifikace konkrétnímu uživateli],
      [`cv.publish.applicant.v1`], [Publikace události pro inteligentní analýzu CV uchazeče do RabbitMQ],
      [`cv.publish.job_seeker.v1`], [Publikace události pro inteligentní analýzu CV zájemce],
      [`job.embedding.requested.v1`], [Publikace požadavku na zpracování embeddingu pracovní pozice],
    )
  ],
  caption: [Typy outbox událostí implementovaných v backendu],
) <tab:impl-outbox-events>

Worker používá dávkové zpracování, zamykání položek, řízené opakování a mrtvý stav pro neobnovitelné chyby. Přímé volání business vedlejších efektů je omezeno na outbox handlery. Doménové služby pouze zapisují požadavek do outboxu. Tím se snižuje riziko nekonzistence mezi databází a integrační vrstvou.

Verzování událostí pomocí suffixu `v1`, případně dalších verzí, slouží k bezpečné evoluci integračního rozhraní. Pokud se změní struktura zprávy nebo její sémantika, lze zavést novou verzi bez nutnosti rozbít stávající konzumenty v jednom kroku.

Cena za tuto robustnost spočívá ve vyšší implementační i provozní komplexitě. Systém musí evidovat stav zpráv, řešit opakované zpracování, sledovat stáří front a rozlišovat dočasnou chybu od neobnovitelného selhání. Přínosem je však výrazně vyšší konzistence dat a nižší riziko tichého výpadku vedlejších efektů, což je v auditovatelném informačním systému důležitější než minimální počet infrastrukturních komponent.

=== Implementace auditní vrstvy
Auditní vrstva odpovídá na otázku, jak u citlivých operací nad pozicemi, kandidáty a adaptací uchovat průkaznou stopu vyžadovanou v NF11, tedy auditní záznamy o změnách klíčových entit po dobu nejméně 5 let, aniž by každý zápis neúměrně prodlužoval odezvu běžných operací, pro kterou NF05 stanovuje limit 2 sekund v 95. percentilu. V prostředí #abbr("KZ", none) nejde jen o technický log, ale o možnost zpětně vysvětlit, kdo provedl konkrétní změnu, kdy k ní došlo a jaký měla vztah k průběhu náboru nebo adaptace.

Jednodušší alternativou by bylo zapisovat audit synchronně přímo v hlavní request cestě, ideálně ve stejné transakci jako doménovou změnu. Tento přístup je na první pohled přehledný, protože výsledek operace a auditní záznam vznikají současně. Jeho nevýhodou je však těsné svázání uživatelské operace s auditním úložištěm. Každý pomalejší zápis do auditní tabulky by zvyšoval latenci API a dočasná chyba auditní infrastruktury by mohla zablokovat i běžnou práci HR uživatele.

Zvolené řešení proto auditní stopu nezapisuje synchronně v hlavní cestě požadavku, ale přes samostatný worker `audit_writer_processor`. Backend po provedení doménové operace publikuje auditní událost do `RabbitMQ`. Worker ji následně konzumuje, validuje předaná data a ukládá výsledek do tabulky `audit_events` v `PostgreSQL`. Tím je audit oddělený od kritické části požadavku, ale stále zůstává navázaný na transakční dění systému prostřednictvím jednoznačného typu události, identifikátoru entity, času, aktéra a kontextu operace.

Z implementačního hlediska je důležité odlišovat vykonávací komponentu od datové struktury. `audit_writer_processor` představuje samostatnou zpracovatelskou službu navázanou na vrstvu předávání zpráv, zatímco `audit_events` je perzistentní tabulka, do níž se auditní stopa ukládá. Tato dvojice společně zajišťuje, že audit zůstává mimo kritickou request cestu, ale neztrácí vazbu na transakční dění systému.

Přínosem pro #abbr("KZ", none) je, že systém naplňuje požadavek na dlouhodobou dohledatelnost změn klíčových entit, ale současně nezhoršuje odezvu každé zapisovací operace. Audit lze navíc provozně sledovat jako samostatný datový tok a v případě potřeby jej dále využít pro interní kontrolu, bezpečnostní přezkum nebo dokazování průběhu personálního procesu.

Kompromisem tohoto rozhodnutí je krátké časové okno mezi vznikem události a jejím perzistentním zápisem. Auditní vrstva proto vyžaduje dohled nad stavem fronty, stářím nejstarší nezpracované zprávy, počtem opakovaných pokusů a případnými zprávami v chybovém stavu. Jinými slovy, řešení přesouvá část složitosti z uživatelské cesty požadavku do provozního sledování systému. Tento kompromis je však v daném kontextu vhodný, protože chrání uživatelskou odezvu a zároveň zachovává požadovanou auditovatelnost procesu.

== Implementace vrstvy inteligentního zpracování dat

Vrstva inteligentního zpracování dat byla navržena jako podpůrná část systému, která reaguje na provozní problém identifikovaný v analytické části práce. V prostředí #abbr("KZ", none) probíhá nábor kontinuálně a personální pracovníci musí souběžně pracovat s větším množstvím životopisů, pracovních pozic a průběžně aktualizovaných požadavků jednotlivých pracovišť. Ruční vyhodnocování životopisů je v takovém prostředí časově náročné a zároveň zvyšuje riziko, že důležité informace o vzdělání, odborné způsobilosti nebo praxi nebudou včas zachyceny.

Smyslem této vrstvy proto není automatizovat rozhodnutí o vhodnosti uchazeče, ale převést nestrukturované dokumenty a texty do podoby, se kterou může systém dále pracovat. Výstupy inteligentního zpracování slouží jako podpůrný podklad pro náboráře, nikoli jako samostatné rozhodovací kritérium. Finální posouzení uchazeče zůstává na odpovědném pracovníkovi.

Z návrhového hlediska bylo možné tuto funkcionalitu začlenit přímo do hlavního backendu. Takové řešení by však spojilo transakční jádro systému s výpočetně náročnými a hůře předvídatelnými úlohami, jako je extrakce textu z dokumentů, generativní zpracování nebo tvorba embeddingů. Druhou možností bylo využít externí cloudovou službu inteligentního zpracování dat (například OpenAI nebo Google AI Studio). Tato varianta by sice snížila provozní nároky na vlastní infrastrukturu, ale v prostředí zdravotnické organizace by zvyšovala regulatorní a bezpečnostní riziko spojené s předáváním životopisů a dalších osobních údajů mimo provozní hranici organizace.

Z těchto důvodů byla zvolena oddělená vrstva služeb provozovaná v rámci on-premise infrastruktury. Hlavní backend zůstává odpovědný za transakční pravidla, oprávnění, audit a stav procesu, zatímco tyto specializované služby zpracovávají pouze úlohy týkající se zpracování životopisů a pracovních nabídek. Komunikace mezi backendem a těmito službami je řešena převážně asynchronně přes `RabbitMQ`, aby dočasná nedostupnost zpracovatelské vrstvy neblokovala základní náborové funkce.

Oddělení této vrstvy má také provozní význam. Úlohy spojené s dokumenty a generativním zpracováním mohou mít vyšší latenci, mohou dočasně selhat nebo mohou vyžadovat opakované zpracování. Pokud je tato funkcionalita oddělena od transakčního jádra, systém může řízeně degradovat. Nedostupnost inteligentní vrstvy znamená omezení podpůrných funkcí, nikoli výpadek samotného náborového procesu.

První část této vrstvy tvoří služba pro zpracování životopisů. Po přijetí události načte dokument z úložiště, extrahuje z něj text (Apache Tika) a připraví strukturovaný výstup použitelný v náborové agendě. Součástí zpracování je také vytvoření embeddingu, který umožňuje sémantické porovnávání mezi životopisem uchazeče a textem pracovní pozice. Výsledky jsou vraceny zpět do backendu, kde jsou uloženy a dále využívány v kontextu evidence uchazeče.

Druhou část tvoří služba zaměřená na pracovní pozice. První funkcí je interaktivní asistence při tvorbě a úpravě textu nabídky. V tomto scénáři je služba volána synchronně (prostřednictvím HTTP/SSE), aby mohl uživatel v administraci okamžitě pracovat s generovaným návrhem a sledovat jeho tvorbu v reálném čase.

Druhou funkcí je pak tvorba samotných embeddingů pro sémantické vyhledávání. Ta probíhá asynchronně. V okamžiku vytvoření nebo úpravy pozice zapíše backend do outboxu požadavek a hlavní transakce se okamžitě uzavře. Služba následně na pozadí vytvoří vektorovou reprezentaci a uloží ji do databáze.

Obě služby využívají lokálně provozovanou inferenční vrstvu `Ollama` (model _gemma3:12b_). Pro tvorbu embeddingů je použit model `nomic-embed-text` a výsledné vektory jsou ukládány v databázi `PostgreSQL` pomocí rozšíření `pgvector`. To umožňuje ponechat transakční i sémantická data v jednotném prostředí, aniž by bylo nutné zavádět samostatnou vektorovou databázi. V daném rozsahu řešení představuje tento přístup přiměřený kompromis mezi funkčností, provozní jednoduchostí a požadavkem na on-premise provoz.

Z hlediska ochrany osobních údajů je důležité, že dokumenty životopisů, extrahovaný text ani odvozené embeddingy nejsou předávány externí cloudové službě. Data se pohybují pouze mezi interním objektovým úložištěm, vrstvou zpráv, zpracovatelskými službami, lokálně provozovaným modelem a databází. Tím se snižuje riziko nekontrolovaného předání osobních údajů mimo organizaci.

Návaznost mezi transakční operací, outboxem a zpracovatelskými službami je založena na tom, že backend po uložení byznysových dat uloží požadavek na vedlejší zpracování do outboxu. Samostatný worker jej následně předá do `RabbitMQ`, odkud jej podle typu úlohy přebírá odpovídající služba. Tím je zachována konzistence mezi stavem hlavního procesu a požadavkem na navazující zpracování, aniž by hlavní cesta požadavku čekala na dokončení výpočetně náročných operací. Podrobnější realizační schéma tohoto toku je uvedeno v příloze @obr:impl-outbox-ai.

== Implementace datové vrstvy
Datová vrstva musí v jednom systému udržet konzistentní transakční agendu náboru, vstupní agendy, auditní stopy a zároveň podpůrné výstupy inteligentního zpracování dat. Alternativou bylo rozdělit relační data, dokumentová metadata a vektorové reprezentace do více specializovaných úložišť. To by sice přineslo vyšší specializaci jednotlivých databází, ale v on-premise prostředí #abbr("KZ", none) by to současně znamenalo více provozních komponent, složitější zálohování a riziko nekonzistence mezi systémy.

Zvolil jsem proto `PostgreSQL 17` jako primární databázovou platformu a rozšíření `pgvector` pouze tam, kde je potřeba sémantické porovnávání životopisů a pracovních pozic. Přínosem je jeden autoritativní zdroj pravdy pro transakční proces, organizační filtr, auditní události i outbox. Toto rozhodnutí podporuje ochranu osobních údajů (NF01), protože citlivá data a jejich vazby zůstávají pod jednotnou správou, a současně nasaditelnost v on-premise prostředí (NF07), protože nevzniká závislost na externí vektorové službě. Kompromisem je, že specializovaná vektorová databáze by mohla být vhodnější při výrazně větším objemu podobnostního vyhledávání.

Použití `jsonb` u proměnlivých formulářových struktur a `pgvector` u embeddingů je omezeno na oblasti, kde pružnější datový typ skutečně snižuje složitost modelu. V jádru procesu zůstává relační model s referenční integritou. Přínosem pro #abbr("KZ", none) je jednodušší provozní správa a jasnější životní cyklus dat.

=== Fyzický datový model
Fyzický model odpovídá hlavním doménovým hranicím. Nábor je veden kolem vazby pracovní role, pracovní pozice, uchazeče a pohovoru, zatímco vstupní agenda odděluje šablonu adaptačního postupu od její konkrétní instance nad zaměstnancem. Alternativou by byl plošší model s menším počtem tabulek a větším množstvím stavových polí. Jeho nevýhodou by byla nejasná odpovědnost záznamů a obtížnější vysvětlení, zda daný údaj popisuje pravidlo procesu, nebo jeho skutečné plnění.

Zvolené rozdělení proto zachovává doménovou sémantiku i ve fyzickém schématu. Organizační izolace je nesena přes klíčové entity a přístupový model je opřen o uživatele, role, členství v organizaci a oprávnění ke zdrojům. Přínosem je, že datová vrstva přímo podporuje multi-tenantní model #abbr("KZ", none) a omezuje riziko, že se autorizace bude řešit až dodatečně nad již načtenými daty. Kompromisem je složitější dotazování a větší nárok na konzistenci relačních vazeb.

Tento model zároveň pomáhá naplnit auditovatelnost podle NF11, protože změny klíčových entit lze vztáhnout ke konkrétnímu uchazeči, pozici, adaptaci nebo organizačnímu kontextu, nikoli pouze k anonymnímu technickému řádku.

=== Migrace schématu
Migrace zajišťují řízenou evoluci databázového modelu. Alternativou by byly ruční změny schématu prováděné přímo v prostředí databáze nebo jednorázové skripty mimo životní cyklus aplikace. Takový postup je rychlý při prototypování, ale špatně se audituje, obtížně se opakuje a zvyšuje riziko, že aplikace poběží proti nekompatibilní verzi schématu.

Zvolené řešení používá verzované migrace jako kontrolovaný přechod mezi verzemi aplikace a databáze. Migrace určují, jak se datový model vyvíjí, v jakém pořadí a s jakou vazbou na nasazovanou verzi systému. Přínosem pro #abbr("KZ", none) je reprodukovatelnost, dohledatelnost a lepší předatelnost řešení, což přímo podporuje udržitelnost podle NF08. Kompromisem je nutnost navrhovat i přechodové stavy, aby nová verze aplikace, dlouho běžící workery a existující data zůstaly kompatibilní.

=== Perzistence dokumentů a infrastrukturní tabulky
Dokumenty uchazečů a zaměstnanců představují jiný typ dat než transakční záznamy. Možností by bylo ukládat soubory přímo do relační databáze, což by zjednodušilo práci s referencemi, ale zbytečně by zatížilo transakční úložiště velkými binárními objekty a komplikovalo by práci s verzemi dokumentů.

Zvolené řešení proto ukládá v databázi metadata a vazbu na objektový klíč, zatímco fyzický obsah dokumentu je uložen v objektovém úložišti (_SeaweedFS_). Přínosem je jednodušší škálování úložiště dokumentů a lepší kontrola nad citlivým obsahem. Kompromisem je nutnost hlídat konzistenci mezi databázovým záznamem a objektem v úložišti, zejména při výmazu nebo anonymizaci.

Vedle doménových tabulek proto používám i infrastrukturní struktury pro odložené vedlejší efekty, idempotenci zápisů a auditní události. Tyto tabulky nejsou samostatnou byznysovou doménou, ale chrání správnost životního cyklu dat. Outbox spouští navazující kroky po rozhodnutí transakční vrstvy, idempotence omezuje duplicitní zápisy a auditní tabulka uchovává důkaz o citlivých operacích. Tím se podporuje ochrana osobních údajů (NF01) i auditovatelnost změn klíčových entit (NF11). Kompromisem je vyšší provozní složitost, protože je nutné sledovat nejen stav doménových záznamů, ale také stav navazujících infrastrukturních procesů.

=== Implementace bezpečnosti a identity
V multi-tenantním prostředí #abbr("KZ", none) by čisté RBAC založené pouze na globální roli uživatele nestačilo. Role typu HR pracovník nebo vedoucí oddělení sice popisuje, jaký druh činnosti může uživatel vykonávat, ale sama neurčuje, pro který závod, pracovní pozici nebo skupinu uchazečů má oprávnění platit. Nestačil by ani jednodušší model kombinující globální roli a organizaci, protože některé oprávněné osoby, například vedoucí pracovníci, nemají mít přístup ke všem náborům v dané organizaci, ale jen ke konkrétním inzerátům. Takový model by vedl buď k příliš širokému zpřístupnění dat, nebo k množství lokálních výjimek rozptýlených v aplikačním kódu. Z tohoto důvodu jsem zvolil vztahově orientovaný autorizační model ReBAC, který oprávnění neváže pouze k roli, ale také ke konkrétnímu vztahu uživatele ke zdroji.

Implementace proto myslí na přihlášení přes SSO, globální roli a vazbu ke konkrétnímu zdroji. Přínosem je jemnější řízení přístupů a menší rozsah zpřístupnění osobních údajů (podle NF01). Nevýhodou tohoto řešení je složitější autorizační model.

Princip tohoto oddělení znázorňuje @obr:impl-auth-rebac-flow na příkladu vedoucího pracovníka, který si chce zobrazit životopis uchazeče. Přihlášení pouze potvrzuje jeho identitu a globální role určuje, že jde o oprávněný typ interního uživatele. Samotné zobrazení životopisu je však povoleno až tehdy, když má vedoucí vztah ke konkrétnímu inzerátu, k němuž uchazeč patří.

#figure(
  image(
    "../procesy/architecture/seq-auth-rebac-flow.svg",
    width: 100%,
  ),
  caption: [Příklad ReBAC autorizace při zobrazení životopisu uchazeče vedoucím pracovníkem],
) <obr:impl-auth-rebac-flow>

Dědění přístupu je v tomto modelu řešeno přes vztah k nadřazenému zdroji. Oprávnění se materializují zejména pro organizaci a pracovní pozici, zatímco navázaná data uchazeče, poznámky, přílohy nebo pohovory přebírají přístup přes vazbu na konkrétní inzerát. Přínosem je menší redundance a nižší riziko zastaralých ACL záznamů. Kompromisem jsou náročnější dotazy, které musí tento vztah při čtení nebo změně dat správně vyhodnotit.

== Implementace onboardingového portálu
Onboardingový portál jsem implementoval jako samostatnou aplikaci oddělenou od veřejného kariérního portálu. Důvodem není pouze odlišné uživatelské rozhraní, ale jiná povaha celého procesu. Kariérní portál pracuje s anonymním nebo externím uchazečem, zatímco onboardingový portál obsluhuje interní vstupní agendu, konkrétního zaměstnance, jeho úkoly, dokumenty a odpovědnosti HR pracovníků.

Na @obr:candidate-to-employee je vidět detail uchazeče. Náborář na první pohled vidí všechny identifikační údaje, má rychlý přístup k dokumentům, poznámkám a analytickým výstupům nad životopisem. Dále má možnost využít akce, které posouvají uchazeče v procesu, například odeslání e-mailu, naplánování pohovoru, zamítnutí nebo schválení a vytvoření zaměstnance.

#figure(
  image(
    "../procesy/implementation/candidate-to-employee.jpeg",
    width: 100%,
  ),
  caption: [Detail uchazeče jako pracovní plocha náboráře],
) <obr:candidate-to-employee>

@obr:onboarding-dashboard zachycuje dashboard interního uživatele jako realizační prvek požadavku R6 na reporting a analytiku pro vedení. Obrazovka neslouží pouze ke sledování adaptačních procesů, ale poskytuje souhrnný pohled na více metrik a oblastí systému, zejména uchazeče, pracovní pozice, dokumenty, notifikace a probíhající nástupy.
#figure(
  image(
    "../procesy/implementation/onboarding-dashboard.jpeg",
    width: 100%,
  ),
  caption: [Provozní přehled interního portálu s metrikami náboru a adaptace],
) <obr:onboarding-dashboard>

Na @obr:onboarding-workflow-builder je zachycena správa adaptačního procesu pro konkrétní organizační kontext. Horní část obrazovky poskytuje souhrn postupu, například celkovou dobu, počet kroků a povinné položky. Samostatná část pro informační dokumenty odděluje obecné podklady od samotných úkolů. Seznam kroků pak pracuje s pořadím, typem kroku, povinností, instrukcemi a navázanými dokumenty. Rozhraní tím zviditelňuje rozdíl mezi administrací šablony a pozdějším plněním konkrétního onboardingového procesu zaměstnancem.

#figure(
  image(
    "../procesy/implementation/onboarding-workflow-builder.jpeg",
    width: 100%,
  ),
  caption: [Správa šablony onboardingového workflow v interním portálu],
) <obr:onboarding-workflow-builder>

Přínosem pro #abbr("KZ", none) je možnost řídit vstupní agendu jako opakovatelný proces, nikoli jako sadu ručně předávaných pokynů. HR pracovník získává místo pro správu pravidel a dokumentů, zatímco nastupující zaměstnanec v portálu pracuje pouze se svou konkrétní sadou úkolů.


== Implementace kariérního portálu
Kariérní portál `kariera.kzcr.eu` jsem implementoval jako veřejný vstup do náborového procesu. Frontend je oddělen od backendu záměrně. Veřejný portál řeší prezentaci obsahu, navigaci a interakci s uchazečem, zatímco byznysová pravidla pro práci s pozicemi, uchazeči a formulářovými daty zůstávají v jednom autoritativním API.

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
  caption: [Katalog volných pozic s filtračním panelem a výsledkovou kartou],
) <obr:career-portal-catalog>

Rozhraní záměrně vychází z ustálených vzorců kariérních portálů. Náhledová karta shrnuje klíčové atributy nabídky a filtrační panel zůstává při práci s katalogem stabilní, aby uchazeč mohl porovnávat více výsledků bez opakované orientace v rozhraní. Nejde tedy o grafické rozhodnutí samo o sobě, ale o snahu snížit kognitivní zátěž v situaci, kdy uživatel rychle prochází větší množství podobných nabídek a rozhoduje se, zda pokračovat do detailu a formuláře reakce.

=== E2E testování portálu
Spolehlivost veřejného portálu je podpořena automatizovaným ověřením celé veřejné náborové cesty. Vzhledem k tomu, že portál představuje vstupní bod pro uchazeče, nepovažoval jsem za dostačující ověřovat jen jednotlivé prvky uživatelského rozhraní. Klíčové bylo chránit tok od vyhledání pracovní pozice přes otevření jejího detailu až po odeslání reakce s životopisem a současně tak ověřit integrační kontrakt mezi frontendem a odděleným transakčním API. Tento krok nepředstavuje přímé měření dostupnosti ve smyslu NF04, tedy dostupnosti alespoň 99,5 % v pracovních dnech mezi 6:00 a 22:00, ale snižuje riziko regresí v kritické veřejné náborové cestě. Dostupnost jako provozní vlastnost je následně sledována až v dohledové vrstvě prostřednictvím healthchecků, metrik dostupnosti služeb a stavů integračních komponent. Jako alternativu jsem mohl zvolit pouze komponentové nebo integrační testy s mockovaným API, ty by však neodhalily poruchy vznikající až při běhu sestaveného portálu proti skutečně spuštěnému backendu. Reálnou alternativou byl i `Cypress`, avšak pro tento projekt jsem zvolil `Playwright`, protože umožňuje spouštět scénáře nad sestavenou verzí portálu v reálném prohlížeči, dobře pracuje s navigací, nahráváním příloh a vícekrokovým formulářovým tokem a současně se přirozeně integruje do `CI/CD` pipeline, včetně opakování selhaných běhů a záznamu trasování při chybě.

Testovací scénáře obsahují zobrazení veřejného seznamu pozic, vyloučení neveřejných nabídek, filtrování a vyhledávání nad skutečným API, přechod ze seznamu do detailu a dále na formulář reakce, odeslání přihlášky v režimu s povinným i nepovinným životopisem, klientskou validaci formulářů, samostatný kontaktní formulář i formulář pro zájemce bez vazby na konkrétní pozici. U klíčových scénářů nekončím na úrovni obrazovky, ale kontroluji i perzistenci výsledku v databázi, například vznik záznamu uchazeče, uložení přílohy nebo zápis kontaktního dotazu. Tímto postupem snižuji riziko, že po změně frontendu, API nebo validační logiky zůstane portál vizuálně dostupný, ale fakticky přestane spolehlivě přijímat použitelné reakce.

=== Integrace analytického nástroje Umami
Pro analytické účely jsem do portálu integroval nástroj `Umami`. Jeho smyslem není zasahovat do rozhodování systému, ale měřit průchod uživatelů portálem a identifikovat místa, kde uchazeči proces opouštějí. Inicializace analytiky je provedena centrálně v kořenové komponentě aplikace, aby bylo zajištěno jednotné měření napříč stránkami.

Sleduji zejména interakce s katalogem pozic, otevření detailu nabídky, zahájení reakce na pozici, práci s formulářem a výsledek jeho odeslání. Tato data slouží jako podpůrný vstup pro další iterace portálu a doplňují kvalitativní poznatky z pilotního uživatelského ověření.

`Umami` jsem zvolil především proto, že odpovídá provozní logice celého řešení. Jde o relativně lehký nástroj, který lze provozovat ve vlastním prostředí, nevyžaduje rozsáhlou marketingovou konfiguraci a dobře se hodí pro měření účelově definovaných událostí nad veřejným portálem. Tato vlastnost je důležitá i ve vztahu k nefunkcionálnímu požadavku NF07, podle něhož musí být systém nasaditelný na infrastruktuře organizace v režimu on-premise. V mém případě bylo proto podstatné i to, že analytický skript mohu do aplikace připojit centrálně a při on-premise nasazení jej zpřístupnit přes vlastní proxy cestu, takže analytická vrstva nenarušuje architektonickou kontrolu nad veřejným rozhraním. Alternativou byly robustnější platformy typu `Google Analytics 4`, které však přinášejí vyšší závislost na externí cloudové službě a širší záběr, než jaký byl pro tento portál potřebný. Druhou realistickou alternativou bylo `Matomo`, které je rovněž možné provozovat lokálně, ale pro daný rozsah by znamenalo vyšší provozní režii a složitější správu. `Umami` se proto ukázalo jako přiměřený kompromis mezi kontrolou nad daty, jednoduchostí provozu a dostatečnou analytickou vypovídací hodnotou.

== Komunikace s národními registry
Napojení na národní registry jsem řešil primárně pro Národní registr zdravotnických pracovníků (`NRZP`) spravovaný #abbr("ÚZIS", none). Praktická zkušenost ukázala, že samotné technické rozhraní ještě neznamená funkční integraci. Vedle klientského certifikátu bylo nutné řešit i přidělení externích identifikačních údajů a odpovídajících oprávnění na straně poskytovatele služby.

Konkrétním integračním problémem bylo, že veřejně popsané `SOAP/WSDL` rozhraní neodpovídalo plně rozhraní, které bylo ve skutečnosti zpřístupněno pro provozní použití. V praxi se tak rozcházel očekávaný způsob napojení s reálně dostupnou vrstvou nad `InterSystems IRIS`, včetně konkrétních metod pro dotaz podle čísla pracovníka a rodného čísla. Součástí řešení proto bylo i doplnění potřebné `WSDL` popisné vrstvy a mapování metod na straně `IRIS`, aby bylo možné službu volat konzistentně a bez přenášení těchto odchylek do aplikační vrstvy. Nebylo proto účelné vázat backend přímo na generovaného `SOAP` klienta, protože by tím přebíral nestabilitu cizího integračního detailu do vlastní doménové logiky.

Z architektonického hlediska jsem proto integrační logiku neumístil přímo do `hiring_backend`, ale zarámoval ji jako adaptační mezivrstvu blízkou vzorům adaptér a `Anti-Corruption Layer`. Backend vystavuje pouze administrační endpoint `POST /api/v1/admin/qualifications/lookup`, který je dostupný vybraným rolím. Doménová služba podporuje dotaz podle čísla pracovníka v `NRZP` i podle rodného čísla, vstup normalizuje a validuje a teprve potom volá platformní adaptér.

`qualification-adapter` běží pouze v interní Docker síti a funguje jako mezivrstva mezi backendem a integrační vrstvou nad `InterSystems IRIS`. Volba `IRIS` zde není náhodná. V prostředí #abbr("KZ", none) se tato platforma dlouhodobě používá jako integrační vrstva pro napojování okolních systémů, a proto bylo vhodnější navázat na existující provozní standard než zavádět pro jedinou vazbu samostatný integrační middleware. Tento mezistupeň pak řeší tři problémy najednou. Izoluje specifika skutečně dostupného integračního rozhraní mimo business logiku, sjednocuje chybové stavy do kontrolovaného HTTP kontraktu a zjednodušuje případnou výměnu integračního detailu bez zásahu do domény.

Výstup z registru backend převádí do jednotné doménové struktury obsahující identifikaci pracovníka a seznam odborných, specializovaných a zvláštních odborných způsobilostí. Současně vytváří auditní záznam o úspěšném i neúspěšném dotazu. Z důvodu ochrany osobních údajů se v auditu neukládá plné rodné číslo ani plné identifikátory dotazu, ale pouze jejich maskovaná podoba a hash. Implementace tak spojuje automatizaci kontroly kvalifikace s provozní kontrolou nad citlivou integrační vazbou.

V případě úplné nedostupnosti registru nebo integrační platformy IRIS nedochází k zablokování náborového procesu. Systém tuto skutečnost reportuje HR pracovníkovi s možností opakovat ověření později.


== Ověření architektonických cílů
Prokázání, že implementace skutečně naplňuje dříve definované cíle, je nezbytnou součástí inženýrského přístupu. Tato sekce proto mapuje nefunkcionální požadavky NF01–NF11 a také hlavní funkční požadavky F01–F25 a jejich vazbu na rámcové cíle R1–R6.

Funkční část řešení je pokryta rozdělením systému na veřejný kariérní portál, interní administrační rozhraní, portál vstupní agendy, integrační služby a datovou a reportingovou vrstvu. Kariérní portál naplňuje požadavky F01–F06 tím, že poskytuje katalog pozic, detail nabídky, online reakci uchazeče, registraci zájemce a kontaktní vstup do organizace. Interní náborová agenda pokrývá F07–F12 prostřednictvím správy pracovních pozic, evidence kandidátů, pohovorů, stavových změn, komunikačních šablon a přehledů pro vedoucí pracovníky.

Požadavky F13–F15 jsou realizovány integračním napojením na #abbr("NRZP", none) přes oddělený `qualification-adapter`, který umožňuje ověření odborné způsobilosti, sjednocuje výsledek dotazu do doménového modelu a vytváří auditovatelný záznam o provedené kontrole. Vstupní agenda a adaptace podle F16–F21 jsou pokryty samostatným portálem a doménovým modelem, který odděluje šablonu adaptačního postupu od konkrétní instance zaměstnance, eviduje plnění kroků a umožňuje sledovat stav adaptace. Požadavky F22–F25 se promítají do multi-tenantního datového modelu, organizačních filtrů, rolí centrální správy a přehledových dat nad náborem a adaptací.

Ochrana osobních údajů podle NF01 je v implementaci podpořena tím, že zpracování životopisů a inference modelu probíhá v on-premise prostředí, citlivé identifikátory v auditních záznamech jsou maskovány nebo nahrazeny hashem a přístup k osobním údajům je vyhodnocován přes autorizační model. Autentizace podle NF02 je řešena napojením na SSO prostřednictvím OpenID Connect (OIDC) nad OAuth 2.0 a navazujícím vytvořením aplikačního kontextu uživatele. Řízení přístupů podle NF03 je realizováno kombinací globálních rolí a vztahových oprávnění nad konkrétní organizací nebo zdrojem.

Požadavek NF04 na dostupnost alespoň 99,5 % není prokazován samotnými E2E testy, ale provozním dohledem popsaným v kapitole nasazení, kde se sledují healthcheck endpointy, metriky dostupnosti a stav integračních komponent. Výkon podle NF05 podporuje oddělení výpočetně náročné vrstvy od transakčního backendu, asynchronní zpracování vedlejších efektů a audit mimo hlavní cestu požadavku. Přístupnost podle NF06 se týká především veřejného kariérního portálu, který je navržen jako responzivní rozhraní s ohledem na zásady WCAG 2.1 na úrovni AA a je ověřován scénáři nad reálným prohlížečem.

Nasaditelnost podle NF07 je podpořena volbou technologií provozovatelných v infrastruktuře organizace prostřednictvím kontejnerizace, zejména `PostgreSQL`, `SeaweedFS`, `RabbitMQ` a `Ollama`. Udržitelnost podle NF08 podporuje modulární struktura backendu, verzované migrace, architektonické testy a dokumentované hranice mezi doménou a adaptéry. Lokalizace podle NF09 je naplněna českým uživatelským rozhraním a prací s českou diakritikou ve frontendové, API i databázové vrstvě. Kompatibilita kariérního portálu podle NF10 je podporována volbou běžného webového stacku kompatibilního s aktuálními verzemi prohlížečů Chrome, Firefox, Safari a Edge. Auditovatelnost podle NF11 je realizována auditní tabulkou a asynchronní auditní vrstvou, která uchovává záznamy o změnách klíčových entit bez zbytečného zvyšování odezvy běžných operací.
