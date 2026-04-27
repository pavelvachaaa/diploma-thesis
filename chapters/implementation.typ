#import "../template/abbreviations.typ": abbr

Architektonický návrh má smysl jen tehdy, pokud se podaří převést jeho principy do konkrétní implementace bez toho, aby se po cestě rozpadly pod tlakem technologických kompromisů. V této kapitole proto nesleduji úplný výpis všech tříd, tabulek a endpointů, ale ta rozhodnutí, na nichž se láme rozdíl mezi formálně správným návrhem a skutečně provozně použitelným systémem.

Pozornost soustředím především na modulární backend, hexagonální rozdělení odpovědností, spolehlivou asynchronní komunikaci, datovou vrstvu, bezpečnostní model a oddělenou vrstvu inteligentního zpracování dat. Právě v těchto částech se ukazuje, zda navržená architektura dokáže unést reálné procesní a provozní požadavky #abbr("KZ", none).

== Struktura řešení
Celé řešení je implementováno jako sada spolupracujících aplikací a služeb s oddělenými odpovědnostmi. Transakční část systému je realizována v prostředí Node.js/Express, webové portály jsou postaveny na Next.js a podpůrné zpracovatelské či integrační služby běží převážně v jazyce Go. Toto rozdělení nevyplývá z technologické preference samo o sobě, ale z rozdílného charakteru jednotlivých problémů. Backend vyžaduje doménovou konzistenci, frontendy rychlý rozvoj rozhraní a procesory vrstvy inteligentního zpracování dat efektivní práci s asynchronními úlohami.

Volba jazyka Go u procesorů přitom nebyla motivována tím, že by právě tento jazyk nabízel zásadně lepší knihovny pro práci s modely. Samotná inference je totiž delegována do `Ollama` a extrakce textu do `Apache Tika`, tedy do oddělených služeb dostupných přes HTTP. Z čistě funkčního hlediska by proto bylo možné procesory implementovat i v `Node.js`, což by sjednotilo technologický stack. Rozhodující byly spíše jejich provozní vlastnosti. `cv_processor` běží jako dlouhožijící worker s více souběžnými konzumenty fronty a `job_processor` jako samostatná `HTTP/SSE` služba. Go v tomto kontextu přináší jednoduchý model souběžnosti, malé samostatně nasaditelné binární soubory a předvídatelné chování u specializovaných služeb, které neřeší rozsáhlou doménovou logiku ani práci s uživatelským rozhraním.

Vedle hlavního backendu tak řešení zahrnuje i samostatné služby pro auditní zápis, integrační adaptéry a inteligentní zpracování dokumentů či textů pracovních pozic. Tyto komponenty spolu komunikují přes HTTP rozhraní nebo přes `RabbitMQ`. Praktickým důsledkem je možnost odděleně nasazovat a škálovat části s odlišným provozním profilem, aniž by se celý systém rozpadl na síťově fragmentovaný soubor mikroslužeb.

Z implementačního hlediska jde o převod architektonické dělby práce do konkrétních runtime prostředků. Cílem není technologická pestrost sama o sobě, ale přiřazení vhodného nástroje ke konkrétnímu typu problému. Přínosem je lepší přizpůsobení jednotlivých částí jejich provoznímu profilu, omezením naopak vyšší nárok na koordinaci buildů, nasazení a provozního dohledu mezi více technologickými celky.

#figure(
  image(
    "../procesy/architecture-implementation-16x9.svg",
    width: 100%,
  ),
  caption: [Diagram implementace],
) <obr:impl-outbox-ai>

== Implementace backendu
Backend jsem implementoval jako modulární aplikaci s dominantním hexagonálním uspořádáním. Každý požadavek vstupuje přes route a middleware pipeline, která řeší autentizaci, autorizaci, request kontext a mapování chyb. Teprve potom přechází řízení do doménové služby, kde probíhá business logika.

Z fyzického hlediska je backend rozdělen do pěti hlavních částí. `src/routes` a `src/app.js` tvoří vstupní HTTP adaptéry. `src/domain` obsahuje byznysové moduly, například `jobs`, `applicants`, `employees`, `qualification` nebo `internalUsers`. `src/shared/contracts/ports` drží explicitní kontrakty a `src/platform` soustřeďuje technologické adaptéry pro databázi, audit, messaging, storage, autentizaci, `ReBAC` i interní integrační služby. Vazby mezi těmito částmi spravuje dependency injection kontejner `Awilix`.

Takto navržený backend plní roli autoritativní transakční hranice systému. Právě zde se rozhoduje o tom, zda je konkrétní změna v souladu s doménovými pravidly, s organizačním rozsahem uživatele i s požadavkem na auditní dohledatelnost. Akademicky řečeno jde o koncentraci invariantů do jedné aplikační vrstvy, která omezuje riziko, že se stejná pravidla budou rozcházet mezi frontendem, integračními službami a databázovými skripty.

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
      [Vstupní adaptéry], [`src/routes`, kontrolery v `src/domain/*/controller`, middleware a bootstrap v `src/app.js`],
      [Doménové moduly], [`src/domain/*/service`, `repository`, `events` a modulové registrace přes `index.js`],
      [Porty], [`src/shared/contracts/ports`, například `cvPublishPort`, `internalUsersPort`, `rebacPort`],
      [Výstupní adaptéry], [`src/platform/*`, například `platform/qualification`, `platform/userSearch`, `platform/audit`, `platform/outbox`, `platform/storage`],
      [Vazba port-adaptér], [DI registr `src/container.registry.js` a Awilix tokeny],
    )
  ],
  caption: [Implementační realizace hexagonální architektury backendu],
) <tab:impl-backend-layers>

=== Použité návrhové a integrační vzory v hiring_backend
Architektonická kapitola obhajuje principy backendu na koncepční úrovni. V implementační části proto již není účelné znovu vysvětlovat, co jednotlivé vzory obecně znamenají, ale ukázat, v jakých konkrétních místech kódu nesou odpovědnost za čitelnost, rozšiřitelnost a provozní stabilitu `hiring_backend`.

Nejviditelněji se to týká hexagonálního uspořádání. V implementaci se neprojevuje jako obecná definice, ale jako konkrétní hranice mezi doménou, kontrakty a technologickými adaptéry. V `hiring_backend` je tato hranice patrná v kontraktech ve `src/shared/contracts/ports`, v adaptérech ve `src/platform/*` i v rozdělení vstupních a výstupních hranic aplikace. Praktickým přínosem je, že doména vyjadřuje pouze schopnosti, které potřebuje, zatímco konkrétní infrastruktura zůstává uzavřena v adaptační vrstvě.

S hexagonálním uspořádáním úzce souvisí vzor `Repository`. Jeho smyslem je oddělit práci s perzistencí od aplikačních služeb tak, aby use-cases nemusely nést detailní znalost SQL dotazů a fyzického schématu. V backendu se tento přístup projevuje přímo v modulové struktuře `src/domain/*/repository`, kde každý kontext zapouzdřuje vlastní datový přístup. Přínosem je menší vazba mezi business logikou a databázovou vrstvou a současně čitelnější hranice odpovědnosti uvnitř jednotlivých modulů.

Dalším důležitým vzorem je `Dependency Injection`. Ten řeší problém skládání závislostí v aplikaci, která už není malým monolitickým skriptem, ale systémem s porty, adaptéry, službami a moduly s odlišnými rolemi. V `hiring_backend` tuto úlohu plní kontejner `Awilix` spolu s registrací vazeb v `src/container.registry.js`. Praktickým přínosem je, že jednotlivé části backendu nejsou pevně svázány konkrétní implementací při vytváření objektů, což zjednodušuje výměnu adaptérů, testování i dlouhodobou údržbu.

Pro zápisové a integrační toky je klíčový vzor `Transactional Outbox`. Řeší problém, jak bezpečně navázat vedlejší efekty na doménovou transakci bez rizika, že se business data uloží, ale navazující notifikace, audit nebo publikační událost se kvůli chybě nikdy nevykoná. V backendu se tento vzor realizuje pomocí tabulky `side_effect_outbox`, samostatného workeru a outbox handlerů. Praktickým přínosem je vyšší konzistence mezi databází a integrační vrstvou a menší náchylnost systému k chybám v mezistavech.

Na outbox navazuje vzor `Idempotency`. Ten řeší opačný, ale stejně důležitý problém: aby opakovaný požadavek nebo duplicitní zpracování nezpůsobilo opětovné provedení stejné zápisové operace. V textu backendu se tento přístup promítá zejména do `command_idempotency` a do řízení zápisových toků, kde je potřeba odlišit nový požadavek od opakovaného doručení. Praktickým přínosem je vyšší odolnost vůči nestabilní síti, opakovanému kliknutí uživatele nebo znovudoručení zprávy v integračním řetězci.

Posledním důležitým vzorem je `Adapter`, přesněji integrační mezivrstva blízká `Anti-Corruption Layer`. Řeší problém, jak ochránit doménu před cizími protokoly, datovými modely a chybovými stavy externích systémů. V `hiring_backend` se tento princip projevuje například přes `qualification-adapter` a `user-search-adapter`, zatímco doména pracuje pouze s kontrolovaným interním kontraktem. Praktickým přínosem je, že změna integračního detailu nebo specifik externího systému neprotéká přímo do business logiky backendu.

`hiring_backend` tedy nestojí na jednom izolovaném vzoru, ale na jejich kombinaci. Hexagonální uspořádání omezuje vazby mezi doménou a infrastrukturou, `Repository` abstrahuje přístup k datům, `Dependency Injection` řídí skládání závislostí, `Transactional Outbox` a `Idempotency` stabilizují integrační a zápisové toky a integrační adaptéry chrání doménu před cizími rozhraními. Právě tato kombinace umožňuje, aby backend zůstal čitelný i v situaci, kdy musí současně řešit business pravidla, bezpečnost, messaging a více externích vazeb.

=== Implementace doménové vrstvy
Doménové jádro je členěno do modulů odpovídajících hlavním kontextům systému. Prakticky jde například o správu uchazečů (`applicants`), pracovních pozic (`jobs`), pohovorů (`interviews`), zaměstnanců (`employees`), organizací (`organizations`), číselníků (`catalog`) nebo interních uživatelů (`internal_users`). Každý modul má vlastní use-cases, repozitáře a události, takže změna v jedné oblasti nemusí automaticky rozbít zbytek systému.

Toto členění řeší dva problémy současně. Zaprvé omezuje přímé závislosti mezi nesouvisejícími částmi backendu. Zadruhé umožňuje číst a rozvíjet konkrétní oblast bez nutnosti držet v hlavě celou aplikaci. Právě tato vlastnost je důležitá pro dlouhodobou udržitelnost projektu.

=== Implementace hexagonální architektury
Architektonické principy rozebrané v předchozí kapitole se v implementaci promítají do konkrétní struktury kódu. `src/domain` nese doménové jádro, `src/shared/contracts/ports` explicitní port kontrakty a `src/platform` sekundární adaptéry; vazbu mezi nimi skládá `Awilix` v composition rootu a registru závislostí.

Vůči svému okolí doména komunikuje výhradně prostřednictvím explicitních kontraktů vytvářených pomocí helperu `createServicePort`, který zpřístupní jen povolené metody a uzamkne jejich rozhraní. Implementaci těchto odchozích závislostí následně realizují adaptéry jako `platform/qualification`, `platform/userSearch`, `platform/audit` a `platform/outbox`. Právě zde se doménové požadavky převádějí na interní HTTP volání, auditní transport nebo spolehlivé doručování vedlejších efektů, zatímco samotná doména zůstává odstíněna od toho, zda je fyzická vrstva realizována prostřednictvím SQL, HTTP, AMQP nebo objektového úložiště.

=== Vynucení architektonických pravidel
Architektonická pravidla nestačí pouze deklarovat. Proto jsem je v implementaci částečně vynutil testy architektury. Ty ověřují, že doménové moduly neimportují repozitáře jiných modulů napřímo, že služby nepoužívají infrastrukturu mimo definované porty a že business vedlejší efekty nejsou volány mimo outbox handlery.

Tento mechanismus je důležitý hlavně proto, že architektonická kázeň má tendenci upadat právě v okamžiku, kdy projekt roste a přibývá tlak na rychlé úpravy. Testy zde fungují jako technická pojistka proti tomu, aby se výjimka z pravidla stala novým standardem.

=== Implementace spolehlivé asynchronní komunikace
Klíčovým implementačním problémem bylo zajistit, aby vedlejší efekty navázané na doménovou transakci byly spolehlivě doručeny i při chybách integrační vrstvy a současně nebyly prováděny duplicitně. Tento problém řeším kombinací vzorů `Transactional Outbox` a `Idempotency`, konkrétně tabulkou `side_effect_outbox`, samostatným workerem a řízením zápisových toků nad idempotency vrstvou. Doménová operace zapisuje business data i záznam do outboxu v jedné transakci až po commit fázi worker položku vyzvedne a publikuje.

`RabbitMQ` zde neplní pouze roli technického transportu, ale architektonického oddělovače mezi producentem a konzumentem události. Umožňuje časově oddělit transakční cestu požadavku od zpracování vedlejších efektů, vyrovnat krátkodobé špičky a izolovat lokální selhání konzumentů. Výměnou za to systém přijímá sémantiku opakovaného doručení a potřebu pracovat s eventual consistency. Právě proto musí být konzumenti navrženi idempotentně a provoz doplněn o dohled nad frontami, retry politikami a mrtvými zprávami.

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

Worker používá dávkové zpracování, zamykání položek, řízené opakování a mrtvý stav pro neobnovitelné chyby. Přímé volání business vedlejších efektů je omezeno na outbox handlery; doménové služby pouze zapisují požadavek do outboxu. Tím se snižuje riziko nekonzistence mezi databází a integrační vrstvou.

Verzování událostí pomocí suffixu `v1`, případně dalších verzí, slouží k bezpečné evoluci integračního rozhraní. Pokud se změní struktura zprávy nebo její sémantika, lze zavést novou verzi bez nutnosti rozbít stávající konzumenty v jednom kroku.

Cena za tuto robustnost spočívá ve vyšší implementační i provozní komplexitě. Systém musí evidovat stav zpráv, řešit opakované zpracování, sledovat stáří front a rozlišovat dočasnou chybu od neobnovitelného selhání. Přínosem je však výrazně vyšší konzistence dat a nižší riziko tichého výpadku vedlejších efektů, což je v auditovatelném informačním systému důležitější než minimální počet infrastrukturních komponent.

=== Implementace auditní vrstvy
Auditní stopu nezapisuji synchronně v hlavní request cestě, ale přes samostatný worker `audit_writer_processor`. Ten konzumuje auditní události z `RabbitMQ`, validuje jejich payload a ukládá výsledek do tabulky `audit_events` v `PostgreSQL`. Tím zkracuji odezvu aplikačního API a současně snižuji riziko, že dočasné selhání transportní nebo databázové vrstvy zablokuje běžný transakční tok.

Z implementačního hlediska je důležité odlišovat vykonávací komponentu od datové struktury. `audit_writer_processor` představuje samostatnou zpracovatelskou službu navázanou na messaging vrstvu, zatímco `audit_events` je perzistentní tabulka, do níž se auditní stopa ukládá. Tato dvojice společně zajišťuje, že audit zůstává mimo kritickou request cestu, ale neztrácí vazbu na transakční dění systému.

Takto navržená auditní vrstva řeší napětí mezi dvěma požadavky, které se v personálních systémech často dostávají do konfliktu: vysokou dohledatelností a přijatelnou odezvou aplikace. Přínosem je, že audit nezpomaluje každou zapisovací operaci a lze jej dále zpracovávat jako samostatný datový tok. Omezením je krátké časové okno mezi vznikem události a jejím perzistentním zápisem, a tedy i nutnost provozně sledovat zdraví auditního kanálu stejně pečlivě jako samotného transakčního API.

== Implementace vrstvy inteligentního zpracování dat
Vrstva inteligentního zpracování dat vznikla jako řešení na provozní tlak popsaný v analytické části práce. V prostředí #abbr("KZ", none) probíhá nábor kontinuálně, takže systém souběžně pracuje s větším množstvím životopisů i průběžně upravovaných pracovních nabídek. Manuální screening životopisů je přitom časově náročný a snadno vede k přehlédnutí důležitých údajů. Transakční jádro proto nemá nést dokumentové a AI úlohy přímo.

Na tuto situaci odpovídám oddělenou vrstvou implementovanou jako samostatné služby v jazyce Go. Komunikace probíhá asynchronně přes `RabbitMQ` a inference zajišťuje `Ollama` s konfigurovatelným generativním modelem podle konkrétní služby a nasazení. Smyslem této vrstvy není řídit samotný náborový proces, ale doplnit jej o podpůrné schopnosti tam, kde by přímé zpracování dokumentů a textů zbytečně zatěžovalo backend.

Služba `cv_processor` zpracovává příchozí životopisy a je navázána na asynchronní tok přes `RabbitMQ`. Po přijetí události stáhne dokument z objektového úložiště, extrahuje text přes `Apache Tika`, pomocí `Ollama` provede strukturované vytěžení a shrnutí a nad připraveným textem vytvoří embedding pomocí modelu `nomic-embed-text`. Výsledek pak vrací zpět do backendu přes `RabbitMQ`. Embeddingy zde neslouží jen jako doplňkové metadata, ale jako podklad pro sémantické porovnávání uchazečů a pozic. Backend je ukládá do `pgvector` jako `vector(768)`.

Služba `job_processor` řeší jiný typ úlohy. Vystupuje jako samostatná `HTTP/SSE` služba, kterou `hr-backend` volá synchronně při generování a úpravě textů pracovních nabídek. Také zde se používá `Ollama`, ale role služby je odlišná než u `cv_processor`; zatímco jedna služba zpracovává dokumenty a vrací strukturované výstupy do asynchronního toku, druhá obsluhuje interaktivnější tvorbu textu blízkou uživatelské operaci.

Vedle toho běží samostatný asynchronní tok pro embeddingy pracovních pozic. Backend publikuje požadavek `job.embedding.requested.v1`, zpracování připraví text pozice do podoby vhodné pro vektorové porovnávání a výsledný embedding se vrací do tabulky `job_embeddings`. I zde se používá `nomic-embed-text`, takže sémantické porovnávání pracuje nad stejným typem reprezentace jako u životopisů. Oba procesory tak sdílejí stejný inferenční backend, ale plní odlišné implementační role.

Z pohledu ochrany osobních údajů je důležité, že se nevyužívá externí cloudová AI služba. `Ollama` je provozována jako self-hosted inferenční vrstva v rámci on-premise infrastruktury a procesory ji volají lokálně přes interní rozhraní hostitelského serveru. Dokument životopisu, extrahovaný text i výsledné embeddingy se tak pohybují pouze mezi interním objektovým úložištěm, interní vrstvou zpráv, procesory a lokálně provozovaným modelem. Data proto neopouštějí provozní hranici organizace, což je pro prostředí #abbr("KZ", none) podstatný argument z hlediska ochrany osobních údajů a minimalizace regulatorního rizika. Zároveň je zpracování životopisů navázáno na evidenci souhlasu se zpracováním osobních údajů v náborovém toku.

Technické oddělení této vrstvy má přímý provozní důvod. Inference, práce s dokumenty a vektorové výpočty mají jiný latencní i chybový profil než transakční API. Jejich dočasná nedostupnost proto nesmí zablokovat základní náborové a onboardingové funkce. Systém tak degraduje řízeně. Uživatelé mohou přijít o část rozšířené funkcionality, nikoli o samotné transakční jádro.

Současně jde o ukázku řízené distribuce pouze tam, kde přináší prokazatelný přínos. Oddělené procesory snižují tlak na backend a umožňují volit jiný runtime i škálování, ale zároveň zvyšují integrační složitost, potřebu observability a počet míst, kde může vzniknout prodleva nebo chyba přenosu. V implementaci proto tuto vrstvu odděluji jen pro úlohy s odlišným výpočetním profilem, nikoli jako obecné pravidlo pro celý systém.

TODO: Tohle dát do příloh a tady v textu se jen odkázat
#figure(
  image(
    "../procesy/architecture/seq-outbox-rabbitmq-ai.svg",
    width: 100%,
  ),
  caption: [Realizační tok Outbox-RabbitMQ a vrstvy inteligentního zpracování dat v implementaci],
) <obr:impl-outbox-ai>

== Implementace datové vrstvy a migrací
Perzistenci dat stavím na `PostgreSQL 17` s rozšířením `pgvector`. Relační část pokrývá transakční agendu náboru a onboardingu, vektorová část podporuje scénáře inteligentního zpracování dat. Toto spojení řeší problém, jak držet konzistentně byznysová data i sémantické reprezentace bez zavádění další samostatné databázové technologie.

Volba `PostgreSQL` přitom nebyla vedena jen jeho rozšířením `pgvector`. Pro řešený typ systému je podstatné, že kombinuje silné transakční vlastnosti, referenční integritu a vyzrálý relační model s možností pracovat i s pružnějšími strukturami dat. Nábor, přijetí zaměstnance, auditní stopa i outbox obsahují vazby, které musí být konzistentní napříč více tabulkami a více kroky jedné operace. Právě zde je důležitá schopnost spolehlivě provádět atomické zápisy, vynucovat cizí klíče a držet celý životní cyklus procesu nad jedním autoritativním zdrojem pravdy.

Současně jde o databázovou platformu, která v jednom prostředí pokrývá i požadavky, jež by jinak často vedly k nasazení více odlišných technologií. `jsonb` umožňuje ukládat proměnlivé struktury adaptačních formulářů bez zbytečné fragmentace schématu, `pgvector` rozšiřuje databázi o sémantické vyhledávání a standardní provozní vlastnosti `PostgreSQL` podporují zálohování, migrace i dohled v on-premise režimu. 

V implementaci důsledně nesu organizační izolaci přes `organization_id` v klíčových entitách a kontroluji přístupový rozsah v aplikační vrstvě. Auditní stopu ukládám do samostatné struktury s omezením mutací, aby bylo možné doložit práci s citlivými daty i zpětně.

Volba jedné primární databázové platformy podporuje nejen provozní jednoduchost, ale i datovou konzistenci. Multi-tenantní filtr, auditní události, outbox i běžná transakční agenda jsou tak uloženy v jednom prostředí a lze je spravovat společně v rámci stejných zálohovacích a migračních postupů. Alternativou by bylo vyčlenit embeddingy do specializované vektorové databáze, například typu `Qdrant` nebo `Pinecone`, která by přinesla vyšší specializaci a potenciálně lepší škálování podobnostního vyhledávání. V daném měřítku řešení by to však znamenalo další datový subsystém, synchronizaci mezi transakční a vektorovou vrstvou, samostatné zálohování a větší integrační plochu v on-premise provozu. Volba `pgvector` byla proto jednoduchá.

=== Fyzický datový model
Na úrovni fyzického modelu pracuji s tabulkami odpovídajícími doménovým skupinám popsaným v architektuře. V náborové části jsou klíčové zejména `job_postings`, `job_roles`, `applicants`, `interview_events` a návazné pomocné tabulky pro obsah inzerátu, účastníky pohovorů a přílohy. Onboardingová část je realizována nad tabulkami `onboarding_workflows`, `onboarding_steps`, `user_onboarding_steps`, `onboarding_documents` a `user_documents`.

Přístupový model je fyzicky opřen o `users`, `user_roles`, `organization_memberships` a `resource_permissions`. Datová vrstva tak přímo nese organizační kontext i pravidla `ReBAC`, místo aby byla autorizace řešena jen dodatečně nad již načtenými daty.

Konkrétní datové typy volím podle charakteru uložených informací. Formuláře a odpovědi zaměstnanců ukládám jako `jsonb`, protože jejich struktura se může v čase měnit. Embeddingy životopisů a pracovních pozic ukládám jako `vector(768)` přes `pgvector`, aby bylo možné provádět sémantické porovnávání přímo v databázi.

=== Migrace schématu
Schéma rozvíjím řízeně přes číslované SQL migrace. Tento přístup řeší problém, jak udržet databázový model auditovatelný a současně bezpečně nasaditelný do produkce. Běžné strukturální změny provádím transakčně standardními DDL příkazy, zatímco změny indexů pro živé prostředí odděluji do neblokujících kroků přes `CREATE INDEX CONCURRENTLY`.

Migrace zde zároveň fungují jako `quality gate` mezi novou binární verzí aplikace a stavem databáze. Backend tak nezačne běžet proti nekompatibilnímu schématu, což je v systému s více službami a asynchronními vazbami zásadní bezpečnostní pojistka.

Z teoretického pohledu představují migrace mechanismus řízené evoluce schématu, nikoli jen technický skript pro vytvoření tabulek. Umožňují zpětně doložit, kdy a proč se datový model změnil, a vytvářejí kontrolovaný přechod mezi verzemi systému. Omezením je nutnost disciplinovaně navrhovat i přechodové stavy, aby nová verze aplikace, dlouho běžící workery a stávající data nevytvářely nekompatibilní kombinace.

=== Perzistence dokumentů a infrastrukturní tabulky
Dokumenty uchazečů a zaměstnanců neukládám přímo do relační databáze. Tabulky jako `application_attachments`, `user_documents` nebo `onboarding_documents` obsahují metadata a reference na objektové klíče, zatímco fyzický obsah souborů je uložen v `SeaweedFS` přes S3 kompatibilní rozhraní. Tím řeším problém, jak zachovat výkonnou databázi pro transakční agendu a současně pracovat s většími soubory a jejich verzemi.

Vedle doménových tabulek používám i několik infrastrukturních tabulek. `side_effect_outbox` zajišťuje spolehlivé doručení vedlejších efektů po commit fázi, `command_idempotency` omezuje riziko duplicitního provedení zápisových operací a `audit_events` uchovává auditní stopu citlivých akcí. Tyto struktury nejsou byznysovou doménou samy o sobě, ale bez nich by nebylo možné naplnit požadavky na spolehlivost a auditovatelnost.

=== Implementace bezpečnosti a identity
Bezpečnost je řešena ve více vrstvách. První vrstvou je autentizace uživatele přes session token, který middleware převádí na jednotný request kontext obsahující identitu, role a seznam organizací. Druhou vrstvou jsou endpoint guardy, které rozhodují, zda uživatel smí vstoupit do dané části API. Třetí vrstvou je datová autorizace v `hiring_backend`, realizovaná nad `resource_permissions` a návaznými vazbami na `organization_memberships`.

V praxi tím odděluji dvě různé otázky. Globální role uložená v `users.role_id` říká, jaký typ uživatele je přihlášen. Vztah ke konkrétní organizaci nebo pracovní pozici pak rozhoduje, k jakým datům skutečně smí přistoupit. `organization_memberships` proto neslouží jako zdroj role, ale jako evidence organizačních přístupů, jejich platnosti a způsobu přidělení.

Toto rozdělení řeší časté napětí mezi centralizovanou identitou a lokální datovou autorizací. SSO odpovídá na otázku, kdo je uživatel, zatímco backend musí samostatně rozhodnout, k jaké části multi-tenantního modelu má tento uživatel přístup. Přínosem je vyšší auditovatelnost a jemnější řízení oprávnění nad konkrétními zdroji. Omezením je vyšší složitost autorizačního modelu, který vyžaduje přesnou synchronizaci rolí, membershipů a odvozených oprávnění.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (2fr, 2.6fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Role], [Praktický vztah k datům],
      [Běžný uživatel systému], [Pracuje primárně se svými scénáři a nemá zvýšená administrativní oprávnění],
      [Read-only role pro náborový dohled], [Vidí jen organizace, kde má membership, a konkrétní pozice, ke kterým má přímé přiřazení],
      [Operativní práce s náborem], [Má `write` přístup k organizaci a pracovním pozicím ve svěřeném závodě],
      [Správa organizace a přístupů], [Má `admin` přístup v rámci své organizace a může spravovat role i membershipy],
      [Systémová provozní role], [Má globální administrativní rozsah napříč organizacemi i provozními moduly],
    )
  ],
  caption: [Globální role a jejich praktický význam v ReBAC modelu backendu],
) <tab:impl-rebac-roles>

Role check v middleware tedy není poslední autorizační krok, ale jen vstupní filtr. Samotné čtení, změny a mazání zdrojů vyhodnocuji až na úrovni práce s daty nad `resource_permissions`. Dědičnost oprávnění neřeším kopírováním záznamů do každé dceřiné tabulky, ale relačním odvozením z nadřazeného zdroje. `resource_permissions` drží především oprávnění k organizaci a pracovní pozici, zatímco přístup k poznámkám uchazeče, jeho přílohám, pohovorům nebo přílohám pohovoru se vyhodnocuje přes vazbu na uchazeče a jeho `job_posting_id`. Pokud se tedy změní oprávnění k pracovní pozici, změní se automaticky i přístup ke všem navázaným dceřiným entitám bez nutnosti hromadně přepisovat jejich vlastní ACL záznamy. Přínosem je menší redundance a menší riziko zastaralých oprávnění. Omezením naopak složitější SQL dotazy a vyšší závislost na konzistenci relačních vazeb. Změny rolí a membershipů se navíc synchronizují asynchronně přes outbox události, aby model zůstal konzistentní i mimo kritickou request cestu.

== Implementace onboardingového portálu
Onboardingový portál jsem implementoval jako Next.js aplikaci oddělenou od veřejného kariérního portálu. Toto rozdělení řeší problém, že HR pracovníci a nastupující zaměstnanci potřebují pracovat s odlišnými typy úloh i s jiným bezpečnostním režimem. Na úrovni implementace jsem proto oddělil layouty, cesty i stavovou logiku podle role uživatele.
todo: rozšířit asi třeba o obrázek a nějaké kecy okolo

Na implementační úrovni portál skládá pohled zaměstnance a interních pracovníků nad stejným backendem, ale s odlišnými layouty, trasami a stavovou logikou. Tím se zachovává jednotný zdroj pravdy v API a zároveň se respektuje, že HR role pracuje s přehledem procesu, zatímco nastupující zaměstnanec s konkrétní sadou kroků, termínů a dokumentů. Přínosem je vyšší srozumitelnost práce s onboardingem, omezením naopak nutnost udržovat další frontendovou aplikaci a synchronizovat její vývoj s backendem.

TODO:FOTKY

== Implementace kariérního portálu
Kariérní portál `kariera.kzcr.eu` jsem implementoval jako veřejný vstup do náborového procesu nad technologiemi `Next.js`, `React` a `TypeScript`. Frontend je oddělen od backendu záměrně. Veřejný portál řeší prezentaci obsahu, navigaci a interakci s uchazečem, zatímco business pravidla pro práci s pozicemi, uchazeči a formulářovými daty zůstávají v jednom autoritativním API.

Domovská stránka propojuje obsahové a transakční scénáře. Uchazeč zde najde benefity, tematické kategorie pracovních rolí, mapový přehled nemocnic a vstup do katalogu volných míst. Samotný náborový tok tvoří seznam pozic, detail konkrétní nabídky a formulář reakce na vybranou pozici. Vedle toho portál obsahuje i samostatný kontakt pro zájemce bez vazby na konkrétní inzerát.

Komunikaci s backendem jsem soustředil do centralizované API vrstvy místo přímých HTTP volání z jednotlivých komponent. Tím řeším problém duplicitní síťové logiky v rozhraní a zjednodušuji změny v adresaci endpointů, timeoutu požadavků i mapování chybových stavů. Stav filtrů v katalogu pozic je navíc synchronizován s URL parametry, aby bylo možné konkrétní výběr sdílet a znovu otevřít ve stejném stavu.

Z pohledu uživatelské zkušenosti bylo důležité zachovat kontext při pohybu mezi seznamem a detailem pozice. Pro krátkodobý kontext používá portál `sessionStorage`, například pro návrat na stejné místo v seznamu, zatímco `localStorage` slouží k uchování vybraných pozic mezi jednotlivými navigacemi. Formulář reakce současně provádí klientskou validaci a používá idempotency klíč, aby se snížilo riziko duplicitních žádostí při opakovaném kliknutí nebo nestabilním spojení.

Vzhledem k tomu, že backend vrací popis pozice ve formátu HTML, řešil jsem i bezpečné vykreslení obsahu. HTML proto před zobrazením sanitizuji, aby se do stránky nedostal neověřený nebo škodlivý obsah. Jde o zdánlivý detail, ale právě na podobných místech se láme důvěryhodnost veřejného portálu.
TODO:FOTKY

===  E2E Testování portálu
Spolehlivost veřejného portálu je zajištěna automatizovaným ověřením celé veřejné náborové cesty. Vzhledem k tomu, že portál představuje vstupní bod pro uchazeče, nepovažoval jsem za dostačující ověřovat jen jednotlivé prvky uživatelského rozhraní. Klíčové bylo chránit tok od vyhledání pracovní pozice přes otevření jejího detailu až po odeslání reakce s životopisem a současně tak ověřit integrační kontrakt mezi frontendem v `Next.js` a odděleným transakčním API. Tento krok přímo podporuje naplnění nefunkcionálního požadavku NF04 na dostupnost systému, který požaduje dostupnost alespoň 99,5 % v pracovních dnech mezi 6:00 a 22:00, protože snižuje riziko, že se po změně frontendu nebo API naruší právě veřejně exponovaná náborová cesta. Jako alternativu jsem mohl zvolit pouze komponentové nebo integrační testy s mockovaným API, ty by však neodhalily poruchy vznikající až při běhu sestaveného portálu proti skutečně spuštěnému backendu. Reálnou alternativou byl i `Cypress`, avšak pro tento projekt jsem zvolil `Playwright`, protože umožňuje spouštět scénáře nad sestavenou verzí portálu v reálném prohlížeči, dobře pracuje s navigací, nahráváním příloh a více krokovým formulářovým tokem a současně se přirozeně integruje do `CI/CD` pipeline, včetně opakování selhaných běhů a záznamu trasování při chybě.

Testovací scénaře obsahují zobrazení veřejného seznamu pozic, vyloučení neveřejných nabídek, filtrování a vyhledávání nad skutečným API, přechod ze seznamu do detailu a dále na formulář reakce, odeslání přihlášky v režimu s povinným i nepovinným životopisem, klientskou validaci formulářů, samostatný kontaktní formulář i formulář pro zájemce bez vazby na konkrétní pozici. U klíčových scénářů nekončím na úrovni obrazovky, ale kontroluji i perzistenci výsledku v databázi, například vznik záznamu uchazeče, uložení přílohy nebo zápis kontaktního dotazu. Tímto postupem snižuji riziko, že po změně frontendu, API nebo validační logiky zůstane portál vizuálně dostupný, ale fakticky přestane spolehlivě přijímat použitelné reakce.

=== Integrace analytického nástroje Umami
Pro analytické účely jsem do portálu integroval nástroj `Umami`. Jeho smyslem není zasahovat do rozhodování systému, ale měřit průchod uživatelů portálem a identifikovat místa, kde uchazeči proces opouštějí. Inicializace analytiky je provedena centrálně v kořenové komponentě aplikace, aby bylo zajištěno jednotné měření napříč stránkami.

Sleduji zejména interakce s katalogem pozic, otevření detailu nabídky, zahájení reakce na pozici, práci s formulářem a výsledek jeho odeslání. Tato data slouží jako podpůrný vstup pro další iterace portálu a doplňují kvalitativní poznatky z pilotního uživatelského ověření.

`Umami` jsem zvolil především proto, že odpovídá provozní logice celého řešení. Jde o relativně lehký nástroj, který lze provozovat ve vlastním prostředí, nevyžaduje rozsáhlou marketingovou konfiguraci a dobře se hodí pro měření účelově definovaných událostí nad veřejným portálem. Tato vlastnost je důležitá i ve vztahu k nefunkcionálnímu požadavku NF07, podle něhož musí být systém nasaditelný na infrastruktuře organizace v režimu on-premise. V mém případě bylo proto podstatné i to, že analytický skript mohu do aplikace připojit centrálně a při on-premise nasazení jej zpřístupnit přes vlastní proxy cestu, takže analytická vrstva nenarušuje architektonickou kontrolu nad veřejným rozhraním. Alternativou byly robustnější platformy typu `Google Analytics 4`, které však přinášejí vyšší závislost na externí cloudové službě a širší záběr, než jaký byl pro tento portál potřebný. Druhou realistickou alternativou bylo `Matomo`, které je rovněž možné provozovat lokálně, ale pro daný rozsah by znamenalo vyšší provozní režii a složitější správu. `Umami` se proto ukázalo jako přiměřený kompromis mezi kontrolou nad daty, jednoduchostí provozu a dostatečnou analytickou vypovídací hodnotou.

== Implementace dohledové vrstvy
Dohledovou vrstvu jsem implementoval jako kombinaci strukturovaného logování, metrik a centralizovaného dashboardingu. Tento krok řeší problém, že v distribuovanějším systému už nestačí číst lokální logy jednotlivých služeb. Potřebuji sledovat request kontext, zdraví asynchronní vrstvy i chování oddělených procesorů z jednoho místa.

Na úrovni aplikace generuji strukturované logy a publikuji metriky pro kritické toky, například autentizaci, outbox, messaging a vrstvu inteligentního zpracování dat. Tyto výstupy následně vstupují do samostatné monitorovací vrstvy popsané v architektonické kapitole. 

== Komunikace s národními registry
Napojení na národní registry jsem řešil primárně pro Národní registr zdravotnických pracovníků (`NRZP`) spravovaný #abbr("ÚZIS", none). Praktická zkušenost ukázala, že samotné technické rozhraní ještě neznamená funkční integraci. Vedle klientského certifikátu bylo nutné řešit i přidělení externích identifikačních údajů a odpovídajících oprávnění na straně poskytovatele služby.

Konkrétním integračním problémem bylo, že veřejně popsané `SOAP/WSDL` rozhraní neodpovídalo plně rozhraní, které bylo ve skutečnosti zpřístupněno pro provozní použití. V praxi se tak rozcházel očekávaný způsob napojení s reálně dostupnou vrstvou nad `InterSystems IRIS`, včetně konkrétních metod pro dotaz podle čísla pracovníka a rodného čísla. Součástí řešení proto bylo i doplnění potřebné `WSDL` popisné vrstvy a mapování metod na straně `IRIS`, aby bylo možné službu volat konzistentně a bez přenášení těchto odchylek do aplikační vrstvy. Nebylo proto účelné vázat backend přímo na generovaného `SOAP` klienta, protože by tím přebíral nestabilitu cizího integračního detailu do vlastní doménové logiky.

Z architektonického hlediska jsem proto integrační logiku neumístil přímo do `hiring_backend`, ale zarámoval ji jako adaptační mezivrstvu blízkou vzoru `Adapter / Anti-Corruption Layer` a oddělil ji do interní služby `qualification-adapter`. Backend vystavuje pouze administrační endpoint `POST /api/v1/admin/qualifications/lookup`, který je dostupný vybraným rolím. Doménová služba podporuje dotaz podle čísla pracovníka v `NRZP` i podle rodného čísla, vstup normalizuje a validuje a teprve potom volá platformní adaptér.

`qualification-adapter` běží pouze v interní Docker síti a funguje jako mezivrstva mezi backendem a integrační vrstvou nad `InterSystems IRIS`. Volba `IRIS` zde není náhodná. V prostředí #abbr("KZ", none) se tato platforma dlouhodobě používá jako integrační vrstva pro napojování okolních systémů, a proto bylo vhodnější navázat na existující provozní standard než zavádět pro jedinou vazbu samostatný integrační middleware. Tento mezistupeň pak řeší tři problémy najednou. Izoluje specifika skutečně dostupného integračního rozhraní mimo business logiku, sjednocuje chybové stavy do kontrolovaného HTTP kontraktu a zjednodušuje případnou výměnu integračního detailu bez zásahu do domény. 

Výstup z registru backend převádí do jednotné doménové struktury obsahující identifikaci pracovníka a seznam odborných, specializovaných a zvláštních odborných způsobilostí. Současně vytváří auditní záznam o úspěšném i neúspěšném dotazu. Z důvodu ochrany osobních údajů se v auditu neukládá plné rodné číslo ani plné identifikátory dotazu, ale pouze jejich maskovaná podoba a hash. Implementace tak spojuje automatizaci kontroly kvalifikace s provozní kontrolou nad citlivou integrační vazbou.
