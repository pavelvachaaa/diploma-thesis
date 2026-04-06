#import "../template/abbreviations.typ": abbr

Architektonický návrh má smysl jen tehdy, pokud se podaří převést jeho principy do konkrétní implementace bez toho, aby se po cestě rozpadly pod tlakem technologických kompromisů. V této kapitole proto nesleduji úplný výpis všech tříd, tabulek a endpointů, ale ta rozhodnutí, na nichž se láme rozdíl mezi formálně správným návrhem a skutečně provozně použitelným systémem.

Pozornost soustředím především na modulární backend, hexagonální rozdělení odpovědností, spolehlivou asynchronní komunikaci, datovou vrstvu, bezpečnostní model a oddělenou vrstvu inteligentního zpracování dat. Právě v těchto částech se ukazuje, zda navržená architektura dokáže unést reálné procesní a provozní požadavky #abbr("KZ", none).

== Struktura řešení
Celé řešení je implementováno jako sada spolupracujících aplikací a služeb s oddělenými odpovědnostmi. Transakční část systému je realizována v prostředí Node.js/Express, webové portály jsou postaveny na Next.js a podpůrné zpracovatelské či integrační služby běží převážně v jazyce Go. Toto rozdělení nevyplývá z technologické preference samo o sobě, ale z rozdílného charakteru jednotlivých problémů. Backend vyžaduje doménovou konzistenci, frontendy rychlý rozvoj rozhraní a procesory vrstvy inteligentního zpracování dat efektivní práci s asynchronními úlohami.

Vedle hlavního backendu tak řešení zahrnuje i samostatné služby pro auditní zápis, integrační adaptéry a inteligentní zpracování dokumentů či textů pracovních pozic. Tyto komponenty spolu komunikují přes HTTP rozhraní nebo přes `RabbitMQ`. Praktickým důsledkem je možnost odděleně nasazovat a škálovat části s odlišným provozním profilem, aniž by se celý systém rozpadl na síťově fragmentovaný soubor mikroslužeb.

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
Architektonická kapitola obhajuje principy backendu na koncepční úrovni. Z pohledu implementace je ale důležité ukázat, že nejde o abstraktní slovník pojmů, nýbrž o soubor konkrétních vzorů, které společně drží `hiring_backend` čitelný, rozšiřitelný a provozně stabilní.

Nejvýrazněji je přítomen vzor `Ports and Adapters`, tedy hexagonální architektura. Řeší problém, jak oddělit doménovou logiku od technologií a integračních detailů tak, aby se business pravidla nerozpadla při každé změně databáze, messaging vrstvy nebo externí služby. V `hiring_backend` se tento vzor promítá do kontraktů ve `src/shared/contracts/ports`, do technologických adaptérů ve `src/platform/*` i do rozdělení vstupních a výstupních hranic aplikace. Praktickým přínosem je, že doména vyjadřuje pouze schopnosti, které potřebuje, zatímco konkrétní infrastruktura zůstává uzavřena v adaptační vrstvě.

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

=== Implementace auditní vrstvy
Auditní stopu nezapisuji synchronně v hlavní request cestě, ale přes samostatný worker `audit_writer_processor`. Ten konzumuje auditní události z `RabbitMQ`, validuje jejich payload a ukládá výsledek do tabulky `audit_events` v `PostgreSQL`. Tím zkracuji odezvu aplikačního API a současně snižuji riziko, že dočasné selhání transportní nebo databázové vrstvy zablokuje běžný transakční tok.

Z implementačního hlediska je důležité odlišovat vykonávací komponentu od datové struktury. `audit_writer_processor` představuje samostatnou zpracovatelskou službu navázanou na messaging vrstvu, zatímco `audit_events` je perzistentní tabulka, do níž se auditní stopa ukládá. Tato dvojice společně zajišťuje, že audit zůstává mimo kritickou request cestu, ale neztrácí vazbu na transakční dění systému.

== Implementace vrstvy inteligentního zpracování dat
Vrstva inteligentního zpracování dat vznikla jako řešení na provozní tlak popsaný v analytické části práce. V prostředí #abbr("KZ", none) probíhá nábor kontinuálně, takže systém souběžně pracuje s větším množstvím životopisů i průběžně upravovaných pracovních nabídek. Manuální screening životopisů je přitom časově náročný a snadno vede k přehlédnutí důležitých údajů. Transakční jádro proto nemá nést dokumentové a AI úlohy přímo.

Na tuto situaci odpovídám oddělenou vrstvou implementovanou jako samostatné služby v jazyce Go. Komunikace probíhá asynchronně přes `RabbitMQ` a inference zajišťuje `Ollama` s konfigurovatelným generativním modelem podle konkrétní služby a nasazení. Smyslem této vrstvy není řídit samotný náborový proces, ale doplnit jej o podpůrné schopnosti tam, kde by přímé zpracování dokumentů a textů zbytečně zatěžovalo backend.

Služba `cv_processor` zpracovává příchozí životopisy a je navázána na asynchronní tok přes `RabbitMQ`. Po přijetí události stáhne dokument z objektového úložiště, extrahuje text přes `Apache Tika`, pomocí `Ollama` provede strukturované vytěžení a shrnutí a nad připraveným textem vytvoří embedding pomocí modelu `nomic-embed-text`. Výsledek pak vrací zpět do backendu přes `RabbitMQ`. Embeddingy zde neslouží jen jako doplňkové metadata, ale jako podklad pro sémantické porovnávání uchazečů a pozic. Backend je ukládá do `pgvector` jako `vector(768)`.

Služba `job_processor` řeší jiný typ úlohy. Vystupuje jako samostatná `HTTP/SSE` služba, kterou `hr-backend` volá synchronně při generování a úpravě textů pracovních nabídek. Také zde se používá `Ollama`, ale role služby je odlišná než u `cv_processor`; zatímco jedna služba zpracovává dokumenty a vrací strukturované výstupy do asynchronního toku, druhá obsluhuje interaktivnější tvorbu textu blízkou uživatelské operaci.

Vedle toho běží samostatný asynchronní tok pro embeddingy pracovních pozic. Backend publikuje požadavek `job.embedding.requested.v1`, zpracování připraví text pozice do podoby vhodné pro vektorové porovnávání a výsledný embedding se vrací do tabulky `job_embeddings`. I zde se používá `nomic-embed-text`, takže sémantické porovnávání pracuje nad stejným typem reprezentace jako u životopisů. Oba procesory tak sdílejí stejný inferenční backend, ale plní odlišné implementační role.

Technické oddělení této vrstvy má přímý provozní důvod. Inference, práce s dokumenty a vektorové výpočty mají jiný latencní i chybový profil než transakční API. Jejich dočasná nedostupnost proto nesmí zablokovat základní náborové a onboardingové funkce. Systém tak degraduje řízeně. Uživatelé mohou přijít o část rozšířené funkcionality, nikoli o samotné transakční jádro.

#figure(
  image(
    "../procesy/architecture/seq-outbox-rabbitmq-ai.svg",
    width: 100%,
  ),
  caption: [Realizační tok Outbox-RabbitMQ a vrstvy inteligentního zpracování dat v implementaci],
) <obr:impl-outbox-ai>

== Implementace datové vrstvy a migrací
Perzistenci dat stavím na `PostgreSQL 17` s rozšířením `pgvector`. Relační část pokrývá transakční agendu náboru a onboardingu, vektorová část podporuje scénáře inteligentního zpracování dat. Toto spojení řeší problém, jak držet konzistentně business data i sémantické reprezentace bez zavádění další samostatné databázové technologie.

V implementaci důsledně nesu organizační izolaci přes `organization_id` v klíčových entitách a kontroluji přístupový rozsah v aplikační vrstvě. Auditní stopu ukládám do samostatné struktury s omezením mutací, aby bylo možné doložit práci s citlivými daty i zpětně.

=== Fyzický datový model
Na úrovni fyzického modelu pracuji s tabulkami odpovídajícími doménovým skupinám popsaným v architektuře. V náborové části jsou klíčové zejména `job_postings`, `job_roles`, `applicants`, `interview_events` a návazné pomocné tabulky pro obsah inzerátu, účastníky pohovorů a přílohy. Onboardingová část je realizována nad tabulkami `onboarding_workflows`, `onboarding_steps`, `user_onboarding_steps`, `onboarding_documents` a `user_documents`.

Přístupový model je fyzicky opřen o `users`, `user_roles`, `organization_memberships` a `resource_permissions`. Datová vrstva tak přímo nese organizační kontext i pravidla `ReBAC`, místo aby byla autorizace řešena jen dodatečně nad již načtenými daty.

Konkrétní datové typy volím podle charakteru uložených informací. Formuláře a odpovědi zaměstnanců ukládám jako `jsonb`, protože jejich struktura se může v čase měnit. Embeddingy životopisů a pracovních pozic ukládám jako `vector(768)` přes `pgvector`, aby bylo možné provádět sémantické porovnávání přímo v databázi.

=== Migrace schématu
Schéma rozvíjím řízeně přes číslované SQL migrace. Tento přístup řeší problém, jak udržet databázový model auditovatelný a současně bezpečně nasaditelný do produkce. Běžné strukturální změny provádím transakčně standardními DDL příkazy, zatímco změny indexů pro živé prostředí odděluji do neblokujících kroků přes `CREATE INDEX CONCURRENTLY`.

Migrace zde zároveň fungují jako quality gate mezi novou binární verzí aplikace a stavem databáze. Backend tak nezačne běžet proti nekompatibilnímu schématu, což je v systému s více službami a asynchronními vazbami zásadní bezpečnostní pojistka.

=== Perzistence dokumentů a infrastrukturní tabulky
Dokumenty uchazečů a zaměstnanců neukládám přímo do relační databáze. Tabulky jako `application_attachments`, `user_documents` nebo `onboarding_documents` obsahují metadata a reference na objektové klíče, zatímco fyzický obsah souborů je uložen v `SeaweedFS` přes S3 kompatibilní rozhraní. Tím řeším problém, jak zachovat výkonnou databázi pro transakční agendu a současně pracovat s většími soubory a jejich verzemi.

Vedle doménových tabulek používám i několik infrastrukturních tabulek. `side_effect_outbox` zajišťuje spolehlivé doručení vedlejších efektů po commit fázi, `command_idempotency` omezuje riziko duplicitního provedení zápisových operací a `audit_events` uchovává auditní stopu citlivých akcí. Tyto struktury nejsou business doménou samy o sobě, ale bez nich by nebylo možné naplnit požadavky na spolehlivost a auditovatelnost.

=== Implementace bezpečnosti a identity
Bezpečnostní implementaci stavím na více vrstvách. První vrstvou je autentizace uživatele přes session token, který middleware převádí na jednotný request kontext obsahující identitu, role a seznam organizací. Druhou vrstvou jsou endpoint guardy, které rozhodují, zda uživatel smí vstoupit do dané části API. Třetí vrstvou je datová autorizace v `hiring_backend`, realizovaná nad `resource_permissions` a návaznými vazbami na `organization_memberships`.

V praxi tím odděluji dvě různé otázky. Globální role uložená v `users.role_id` říká, jaký typ uživatele je přihlášen. Vztah ke konkrétní organizaci nebo pracovní pozici pak rozhoduje, k jakým datům skutečně smí přistoupit. `organization_memberships` proto neslouží jako zdroj role, ale jako evidence organizačních přístupů, jejich platnosti a způsobu přidělení.

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

Role check v middleware tedy není poslední autorizační krok, ale jen vstupní filtr. Samotné čtení, změny a mazání zdrojů vyhodnocuji až na úrovni práce s daty nad `resource_permissions`. Dceřiné entity, například uchazeči, pohovory nebo přílohy, dědí oprávnění z nadřazené pracovní pozice nebo organizace, místo aby se pravidla duplikovala v každé tabulce zvlášť. Změny rolí a membershipů se navíc synchronizují asynchronně přes outbox události, aby model zůstal konzistentní i mimo kritickou request cestu.

== Implementace onboardingového portálu
Onboardingový portál jsem implementoval jako Next.js aplikaci oddělenou od veřejného kariérního portálu. Toto rozdělení řeší problém, že HR pracovníci a nastupující zaměstnanci potřebují pracovat s odlišnými typy úloh i s jiným bezpečnostním režimem. Na úrovni implementace jsem proto oddělil layouty, cesty i stavovou logiku podle role uživatele.

todo: rozšířit asi třeba o obrázek a nějaké kecy okolo

== Implementace kariérního portálu
Kariérní portál `kariera.kzcr.eu` jsem implementoval jako veřejný vstup do náborového procesu nad technologiemi `Next.js`, `React` a `TypeScript`. Frontend je oddělen od backendu záměrně. Veřejný portál řeší prezentaci obsahu, navigaci a interakci s uchazečem, zatímco business pravidla pro práci s pozicemi, uchazeči a formulářovými daty zůstávají v jednom autoritativním API.

Domovská stránka propojuje obsahové a transakční scénáře. Uchazeč zde najde benefity, tematické kategorie pracovních rolí, mapový přehled nemocnic a vstup do katalogu volných míst. Samotný náborový tok tvoří seznam pozic, detail konkrétní nabídky a formulář reakce na vybranou pozici. Vedle toho portál obsahuje i samostatný kontakt pro zájemce bez vazby na konkrétní inzerát.

Komunikaci s backendem jsem soustředil do centralizované API vrstvy místo přímých HTTP volání z jednotlivých komponent. Tím řeším problém duplicitní síťové logiky v rozhraní a zjednodušuji změny v adresaci endpointů, timeoutu požadavků i mapování chybových stavů. Stav filtrů v katalogu pozic je navíc synchronizován s URL parametry, aby bylo možné konkrétní výběr sdílet a znovu otevřít ve stejném stavu.

Z pohledu uživatelské zkušenosti bylo důležité zachovat kontext při pohybu mezi seznamem a detailem pozice. Pro krátkodobý kontext používá portál `sessionStorage`, například pro návrat na stejné místo v seznamu, zatímco `localStorage` slouží k uchování vybraných pozic mezi jednotlivými navigacemi. Formulář reakce současně provádí klientskou validaci a používá idempotency klíč, aby se snížilo riziko duplicitních žádostí při opakovaném kliknutí nebo nestabilním spojení.

Vzhledem k tomu, že backend vrací popis pozice ve formátu HTML, řešil jsem i bezpečné vykreslení obsahu. HTML proto před zobrazením sanitizuji, aby se do stránky nedostal neověřený nebo škodlivý obsah. Jde o zdánlivý detail, ale právě na podobných místech se láme důvěryhodnost veřejného portálu.

=== Integrace analytického nástroje Umami
Pro analytické účely jsem do portálu integroval nástroj `Umami`. Jeho smyslem není zasahovat do rozhodování systému, ale měřit průchod uživatelů portálem a identifikovat místa, kde uchazeči proces opouštějí. Inicializace analytiky je provedena centrálně v kořenové komponentě aplikace, aby bylo zajištěno jednotné měření napříč stránkami.

Sleduji zejména interakce s katalogem pozic, otevření detailu nabídky, zahájení reakce na pozici, práci s formulářem a výsledek jeho odeslání. Tato data slouží jako podpůrný vstup pro další iterace portálu a doplňují kvalitativní poznatky z pilotního uživatelského ověření.

== Implementace dohledové vrstvy
Dohledovou vrstvu jsem implementoval jako kombinaci strukturovaného logování, metrik a centralizovaného dashboardingu. Tento krok řeší problém, že v distribuovanějším systému už nestačí číst lokální logy jednotlivých služeb. Potřebuji sledovat request kontext, zdraví asynchronní vrstvy i chování oddělených procesorů z jednoho místa.

Na úrovni aplikace generuji strukturované logy a publikuji metriky pro kritické toky, například autentizaci, outbox, messaging a vrstvu inteligentního zpracování dat. Tyto výstupy následně vstupují do samostatné monitorovací vrstvy popsané v architektonické kapitole. Dohled tedy nevzniká jako provozní doplněk přidaný na konci projektu, ale jako součást implementace hlavních toků.

== Komunikace s národními registry
Napojení na národní registry jsem řešil primárně pro Národní registr zdravotnických pracovníků (`NRZP`) spravovaný #abbr("ÚZIS", none). Praktická zkušenost ukázala, že samotné technické rozhraní ještě neznamená funkční integraci. Vedle klientského certifikátu bylo nutné řešit i přidělení externích identifikačních údajů a odpovídajících oprávnění na straně poskytovatele služby.

Z architektonického hlediska jsem proto integrační logiku neumístil přímo do `hiring_backend`, ale zarámoval ji jako adaptační mezivrstvu blízkou vzoru `Adapter / Anti-Corruption Layer` a oddělil ji do interní služby `qualification-adapter`. Backend vystavuje pouze administrační endpoint `POST /api/v1/admin/qualifications/lookup`, který je dostupný vybraným rolím. Doménová služba podporuje dotaz podle čísla pracovníka v `NRZP` i podle rodného čísla, vstup normalizuje a validuje a teprve potom volá platformní adaptér.

`qualification-adapter` běží pouze v interní Docker síti a funguje jako mezivrstva mezi backendem a existující integrační vrstvou nad `InterSystems IRIS`. Tento mezistupeň řeší tři problémy najednou: izoluje specifika SOAP/WSDL rozhraní mimo business logiku, sjednocuje chybové stavy do kontrolovaného HTTP kontraktu a zjednodušuje případnou výměnu integračního detailu bez zásahu do domény.

Výstup z registru backend převádí do jednotné doménové struktury obsahující identifikaci pracovníka a seznam odborných, specializovaných a zvláštních odborných způsobilostí. Současně vytváří auditní záznam o úspěšném i neúspěšném dotazu. Z důvodu ochrany osobních údajů se v auditu neukládá plné rodné číslo ani plné identifikátory dotazu, ale pouze jejich maskovaná podoba a hash. Implementace tak spojuje automatizaci kontroly kvalifikace s provozní kontrolou nad citlivou integrační vazbou.
