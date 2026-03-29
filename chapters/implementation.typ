#import "../template/abbreviations.typ": abbr

V této kapitole popisuji, jak jsem architektonický návrh převedl do konkrétní implementace. Zatímco předchozí kapitola řešila důvody a principy návrhu, zde uvádím reálné technické artefakty, integrační mechanismy a provozní implementační rozhodnutí.

Popsány jsou pouze klíčové části projektu, které jsou pro chod systému stěžejní. Mezi tyto části patří doménově orientované jádro (`DDD`), návrhový vzor `Ports and Adapters`, spolehlivá asynchronní integrace (`Outbox service`) a implementace výpočetní vrstvy.

== Struktura řešení
Celé řešení je implementováno jako sada spolupracujících aplikací a služeb s oddělenými odpovědnostmi. Transakční část systému je realizována v prostředí Node.js/Express, webové portály jsou implementovány pomocí Next.js a podpůrné zpracovatelské a integrační služby jsou provozovány jako samostatné procesy, převážně v jazyce Go.

Vedle hlavního backendu tak řešení zahrnuje i samostatné služby pro asynchronní zpracování událostí, auditní zápis a inteligentní zpracování dat. Tyto komponenty jsou provozně odděleny a komunikují mezi sebou prostřednictvím HTTP rozhraní a asynchronní komunikace pomocí fronty zpráv (RabbitMQ). Toto rozdělení umožňuje nezávislé nasazení, škálování a řízení jednotlivých částí systému.

TODO: VYPLNIT DÍRU A NEBO TO NĚJAK PŘEFORMÁTOVAT

#figure(
  image(
    "../procesy/architecture-implementation-16x9.svg",
    width: 100%,
  ),
  caption: [Diagram implementace],
) <obr:impl-outbox-ai>

== Implementace backendu
Backend jsem implementoval jako modulární aplikaci s dominantním hexagonálním uspořádáním. Vstupem každého požadavku je route a middleware pipeline, která zajišťuje autentizaci, autorizaci, request kontext a chybové mapování. Teprve poté přechází požadavek do služby konkrétní domény, která provádí business logiku a pracuje s porty nebo repozitáři.

Z hlediska fyzické struktury je backend rozdělen do pěti hlavních částí. `src/routes` a `src/app.js` tvoří vstupní HTTP adaptéry. `src/domain` obsahuje byznysové moduly jako `jobs`, `applicants`, `employees`, `qualification` nebo `internalUsers`, přičemž každý modul registruje své kontrolery, služby a repozitáře přes vlastní `index.js`. `src/shared/contracts/ports` drží explicitní portové kontrakty a `src/platform` obsahuje technologické adaptéry pro databázi, audit, messaging, storage, autentizaci, ReBAC i volání interních integračních služeb. Vazbu mezi těmito částmi zajišťuje dependency injection kontejner `Awilix`, jehož centrální registr je v `src/container.registry.js`.

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
      [Výstupní adaptéry],
      [`src/platform/*`, například `platform/qualification`, `platform/userSearch`, `platform/audit`, `platform/outbox`, `platform/storage`],

      [Vazba port-adaptér], [DI registr `src/container.registry.js` a Awilix tokeny],
    )
  ],
  caption: [Implementační realizace hexagonální architektury backendu],
) <tab:impl-backend-layers>

=== Implementace doménové vrstvy
Doménové jádro aplikace je členěno do modulů odpovídajících hlavním doménovým kontextům systému, takže každá oblast zůstává samostatně udržovatelnou částí backendu.
V implementaci jde například o správu uchazečů (`applicants`), pracovních pozic (`jobs`), pohovorů (`interviews`), zaměstnanců (`employees`), organizací (`organizations`), číselníků (`catalog`) nebo interních uživatelů (`internal_users`).

=== Implementace hexagonální architektury

Hexagonální architekturu (Ports and Adapters) jsem implemenotval prostřednictvím stabilních portů a vyměnitelných adaptérů, které oddělují doménovou logiku od konkrétních technologií.

Porty představují explicitní kontrakty, které definují, jaké operace může doména požadovat od svého okolí. Jsou soustředěny ve složce `src/shared/contracts/ports` a vytvářeny pomocí helperu `createServicePort`, který vystaví pouze explicitně povolené metody a uzamkne je do neměnného rozhraní. Vznikají tak kontrakty jako `cvPublishPort`, `internalUsersPort` nebo `rebacPort`, které určují, *co* má být provedeno, nikoli *jak*.

Samotná implementace těchto kontraktů je realizována pomocí adaptérů ve složce `src/platform`. Adaptéry obsahují veškeré technologické detaily a převádějí doménové požadavky na konkrétní integrační mechanismy. Například `platform/qualification` mapuje doménový požadavek na interní HTTP volání služby `qualification-adapter`, `platform/userSearch` zajišťuje komunikaci se službou `user-search-adapter`, `platform/audit` implementuje auditní transport včetně fallback scénářů a `platform/outbox` se soustředí na spolehlivé doručování vedlejších efektů.

Díky tomuto rozdělení doménová vrstva neřeší, zda je komunikace realizována prostřednictvím SQL, HTTP, AMQP nebo objektového úložiště. Tyto detaily jsou plně zapouzdřeny v adaptační vrstvě, což umožňuje jejich změnu bez zásahu do business logiky.

=== Vynucení architektonických pravidel

Hexagonální architektura není v implementaci používána pouze jako návrhový princip, ale jako pravidlo, které je aktivně vynucováno pomocí testů architektury.

V testech ověřuji, že doménové moduly neimportují repozitáře jiných modulů napřímo, že nepoužívají služby mimo definované hranice a že business vedlejší efekty nejsou volány mimo outbox handlery. Současně sleduji, aby nové doménové služby nezískávaly přímou závislost na databázovém spojení, s výjimkou řízeného seznamu historických případů.

Tento přístup zajišťuje, že architektonická pravidla nejsou pouze deklarována, ale také dlouhodobě dodržována. Implementace tak odpovídá hexagonálnímu principu nejen strukturou složek, ale i systematickou kontrolou architektonické kázně.

=== Implementace spolehlivé asynchronní komunikace

V implementaci používám tabulku `side_effect_outbox` a samostatný worker. Doménová operace zapisuje business data i záznam do outboxu v rámci jedné transakce; po _commit_ fázi worker položky vyzvedává a publikuje.

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

Z implementačního pohledu používám v outbox workeru dávkové zpracování, zamykání položek, řízené opakování a mrtvý stav pro neobnovitelné chyby. Přímé volání business vedlejších efektů je v implementaci omezeno na outbox handlery; doménové operace pouze zapisují záznam do outboxu.

Verzování událostí (např. v1) slouží k zajištění zpětné kompatibility a bezpečné evoluce integračního rozhraní. Při změně struktury zprávy nebo její sémantiky je vytvořena nová verze (např. v2), aniž by došlo k narušení existujících konzumentů. Tento přístup umožňuje paralelní běh více verzí událostí, postupnou migraci jednotlivých služeb a minimalizaci rizika při nasazování změn v distribuovaném systému.


== Implementace vrstvy inteligentního zpracování dat
Vrstva inteligentního zpracování dat je implementována jako samostatné služby v jazyce Go, oddělené od hlavního backendu. Každá služba má jasně definovanou odpovědnost a komunikuje prostřednictvím asynchronního komunikačního rozhraní založeného na zprávách, což umožňuje její nezávislé škálování mimo transakční API.

Služba `cv_processor` realizuje asynchronní zpracování dokumentů uchazečů. Po přijetí události z RabbitMQ načte dokument z objektového úložiště, provede extrakci textu a jeho následnou strukturovanou analýzu. Výsledek je následně publikován zpět do systému ve formě integrační události.

Služba `job_processor` zajišťuje zpracování dat souvisejících s pracovními pozicemi. Na základě přijatých událostí provádí analýzu a generuje výstupy, které backend ukládá nebo dále distribuuje dle konkrétního doménového scénáře.
Navržené řešení odděluje výpočetně náročné operace od hlavní transakční cesty a zároveň zachovává jednotný integrační mechanismus založený na asynchronní komunikaci.

#figure(
  image(
    "../procesy/architecture/seq-outbox-rabbitmq-ai.svg",
    width: 100%,
  ),
  caption: [Realizační tok Outbox-RabbitMQ a vrstvy inteligentního zpracování dat v implementaci],
) <obr:impl-outbox-ai>

== Implementace datové vrstvy a migrací
Perzistenci dat je implementována nad PostgreSQL 17 s rozšířením `pgvector`. Relační část pokrývá transakční agendu náboru a onboardingu, vektorová část podporuje scénáře vrstvy inteligentního zpracování dat (embeddingy CV a pozic). Schéma rozvíjím řízeně přes verze SQL migrací.

V implementaci důsledně držím organizační izolaci dat přes `organization_id` v klíčových entitách a kontrolu přístupového rozsahu v aplikační vrstvě. Auditní stopu ukládám do samostatné struktury s omezením mutací, aby byl zajištěn požadovaný stupeň auditovatelnosti.

Důležitou součástí datové vrstvy je i outbox tabulka, která propojuje transakční konzistenci s asynchronními integracemi bez nutnosti distribuované transakce.

=== Fyzický datový model
Na úrovni fyzického modelu pracuji s konkrétními tabulkami, které odpovídají doménovým skupinám popsaným v architektuře. V náborové části jsou klíčové zejména `job_postings`, `job_roles`, `applicants`, `interview_events` a navázané pomocné tabulky pro obsah inzerátu, účastníky pohovorů a přiložené dokumenty. Onboardingová část je realizována nad tabulkami `onboarding_workflows`, `onboarding_steps`, `user_onboarding_steps`, `onboarding_documents` a `user_documents`. Přístupový model je fyzicky opřen o `users`, `user_roles`, `organization_memberships` a `resource_permissions`, takže datová vrstva přímo nese organizační kontext i ReBAC oprávnění.

Konkrétní datové typy volím podle charakteru uložených informací. Formuláře a odpovědi zaměstnanců ukládám jako `jsonb`, protože jejich struktura se v čase mění a nechci ji vázat na rigidní schéma. Embeddingy životopisů a pracovních pozic ukládám jako `vector(768)` přes `pgvector`, aby bylo možné provádět sémantické porovnávání přímo v databázi.

=== Migrace schématu
Schéma rozvíjím řízeně přes číslované SQL migrace. Běžné strukturální změny provádím transakčně standardními DDL příkazy, zatímco změny indexů pro živé prostředí odděluji do neblokujících kroků přes `CREATE INDEX CONCURRENTLY`. Tím snižuji riziko dlouhých zámků nad produkčními tabulkami a současně zachovávám auditovatelný vývoj schématu v čase.

Tento přístup je důležitý i kvůli provozu release workflow popsaného v kapitole nasazení. Migrace představují explicitní quality gate mezi novou binární verzí aplikace a stavem databáze. Díky tomu nevzniká situace, kdy by backend běžel proti nekompatibilnímu schématu.

=== Perzistence dokumentů a infrastrukturní tabulky
Dokumenty uchazečů a zaměstnanců neukládám přímo do relační databáze. Tabulky jako `application_attachments`, `user_documents` nebo `onboarding_documents` obsahují metadata a reference na objektové klíče, zatímco fyzický obsah souborů je uložen v SeaweedFS přes S3 kompatibilní rozhraní. Relační databáze tak drží pouze to, co je potřeba pro dohledání, verzování, stav dokumentu a vazbu na konkrétní entitu procesu.

Vedle doménových tabulek používám i několik infrastrukturních tabulek. `side_effect_outbox` slouží pro transactional outbox pattern a zajišťuje spolehlivé doručení vedlejších efektů po commit fázi. `command_idempotency` omezuje riziko duplicitního provedení zápisových operací při opakování požadavků a `audit_events` uchovává auditní stopu citlivých akcí. Tyto tabulky nepředstavují samostatnou business doménu, ale jsou nezbytnou fyzickou oporou pro spolehlivost, bezpečnost a provozní dohled systému.

=== Implementace bezpečnosti a identity
Bezpečnostní implementaci stavím na více vrstvách. První vrstvou je autentizace uživatele přes session token, který middleware převádí na jednotný request kontext obsahující identitu, role a seznam organizací, do nichž má uživatel přístup. Druhou vrstvou jsou endpoint guardy, které rozhodují, zda uživatel vůbec smí vstoupit do dané části API. Třetí vrstvou je datová autorizace v `hiring_backend`, realizovaná nad tabulkou `resource_permissions` a návaznými vazbami na `organization_memberships`.

V praxi tím odděluji dvě různé otázky. Globální role uložená v `users.role_id` říká, jaký typ uživatele je přihlášen, zatímco vztah ke konkrétní organizaci nebo pracovní pozici rozhoduje, k jakým datům skutečně smí přistoupit. `organization_memberships` proto neslouží jako zdroj role, ale jako evidence přístupů do organizací, jejich expirace a metadata přidělení. Z membershipů a z přímých přiřazení ke konkrétním pozicím se následně materializují oprávnění `read`, `write` a `admin` do `resource_permissions`.

TODO: Počeštit
#figure(
  [
    #set par(justify: false)
    #table(
      columns: (2fr, 2.6fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Role], [Praktický vztah k datům], [Běžný uživatel systému],
      [Pracuje primárně se svými scénáři; bez zvýšených administrativních oprávnění],
      [Read-only role pro náborový dohled],
      [Vidí jen organizace, kde má membership, a konkrétní pozice, ke kterým má přímé přiřazení],

      [Operativní práce s náborem],
      [Má `write` přístup k organizaci a pracovním pozicím ve svěřeném závodě],
      [Správa organizace a přístupů],

      [Má `admin` přístup v rámci své organizace a může spravovat role a membershipy],
      [Systémová provozní role],
      [Má globální administrativní rozsah napříč organizacemi i provozními moduly],
    )
  ],
  caption: [Globální role a jejich praktický význam v ReBAC modelu backendu],
) <tab:impl-rebac-roles>

Role check v middleware proto není poslední autorizační krok, ale jen vstupní filtr. Samotné čtení, změny a mazání zdrojů vyhodnocuji až v repository SQL nad `resource_permissions`. Dceřiné entity, například uchazeči, pohovory nebo přílohy, tak dědí oprávnění z nadřazené pracovní pozice nebo organizace místo toho, aby se pravidla duplikovala v každé tabulce zvlášť. U vytváření top-level entit zůstává rozhodnutí kombinací globální role a aktivního membershipu do cílové organizace. Změny rolí a membershipů se navíc synchronizují asynchronně přes outbox události, takže ReBAC model zůstává konzistentní i mimo kritickou request cestu.

== Implementace onboardingového portálu
Frontend jsem implementoval jako Next.js aplikaci s oddělením administračních a zaměstnaneckých  scénářů. Na úrovni implementace jsem rozdělil layouty, cesty a stavovou logiku podle role uživatele, aby bylo možné konzistentně řídit přístup ke stránkám i workflow krokům.

todo: rozšířit asi třeba o obrázek a nějaké kecy okolo
== Implementace kariérního portálu
Kariérní portál `kariera.kzcr.eu` jsem implementoval jako veřejný vstup do náborového procesu nad technologiemi `Next.js`, `React` a `TypeScript`. Frontend je v tomto řešení oddělen od backendu záměrně. Webová aplikace řeší prezentaci obsahu, navigaci a interakci s uchazečem, zatímco doménová pravidla pro práci s pozicemi, uchazeči a formulářovými daty zůstávají soustředěna v jednom backendovém jádru. Toto rozdělení snižuje provázání uživatelského rozhraní s business logikou, umožňuje samostatně rozvíjet veřejný portál a současně zachovává jedno autoritativní API pro všechny klienty systému.

Domovská stránka propojuje obsahové a transakční scénáře. Uchazeč zde najde benefity, tematické kategorie pracovních rolí, mapový přehled nemocnic a přímý vstup do katalogu volných míst. Vlastní náborový tok tvoří seznam pozic, detail konkrétní nabídky a formulář reakce na vybranou pozici. Portál současně obsahuje statické profily jednotlivých nemocnic, které slouží jako orientační obsah a rozcestník do nabídky práce. Kontaktní scénáře jsou rozděleny na formulář pro zařazení do databáze uchazečů a na obecný kontaktní formulář pro dotazy mimo konkrétní výběrové řízení. Toto členění není jen obsahové, ale i technické, protože jednotlivé formuláře pracují s odlišným vstupním kontextem, vyžadují jiná data a navazují na rozdílné backendové zpracování.

Komunikaci s backendem jsem soustředil do centralizované API vrstvy namísto přímých HTTP volání z jednotlivých komponent. Tato vrstva sjednocuje adresaci endpointů, časové limity požadavků, převod chybových stavů i pomocné funkce používané při odesílání dat. Díky tomu nejsou síťové detaily duplikovány napříč stránkami a změna komunikační logiky se promítá na jednom místě. V katalogu pracovních pozic je stav filtrů synchronizován s URL parametry, aby bylo možné konkrétní výběr sdílet odkazem a po návratu na stránku jej znovu obnovit. Pro uchování krátkodobého kontextu používá portál `sessionStorage`, například pro návrat ze stránky detailu do předchozího stavu seznamu, zatímco `localStorage` slouží k uchování vybraných pozic mezi jednotlivými navigacemi.

Při implementaci jsem řešil i bezpečnost a korektnost zobrazených i odesílaných dat. Popis pracovní pozice přichází z backendu ve formátu HTML, a proto jej před vykreslením sanitizuji, aby se do stránky nedostal neověřený nebo škodlivý obsah. Formulář reakce na pozici současně provádí klientskou validaci povinných polí a základních formátových omezení ještě před odesláním požadavku. Při zápisu používá idempotency klíč, který snižuje riziko vzniku duplicitních žádostí při opakovaném kliknutí nebo při nestabilním síťovém spojení.

Z pohledu uživatelské zkušenosti bylo cílem zachovat kontext práce i při přechodu mezi stránkami. Uživatel se proto může z detailu inzerátu vrátit do stejného stavu seznamu pozic, včetně dříve zvolených filtrů a pozice v seznamu. Stejný princip se promítá i do oddělení kontaktních scénářů, protože uchazeč nemusí nejprve rozhodovat ve všeobecném formuláři, jaký typ požadavku vlastně zadává. Praktickým důsledkem je menší počet opakovaných kroků, méně ztraceného kontextu při návratu a přehlednější průchod portálem.

Použití frameworku Next.js přináší výhody zejména díky integrované podpoře různých renderovacích strategií. Oproti klasickému SPA přístupu, kde je obsah generován až na straně klienta, umožňuje Next.js server-side rendering a statické generování bez nutnosti implementovat vlastní renderovací vrstvu.

Tento přístup je přínosný především z hlediska dohledatelnosti pracovních pozic a rychlosti načítání veřejného obsahu. Serverově generovaný HTML výstup je přímo indexovatelný vyhledávači a zároveň zajišťuje okamžité zobrazení klíčových informací uživateli bez čekání na JavaScript, než se stránka zobrazí

=== Integrace analytického nástroje Umami
Pro analytické účely byl v portálu integrován nástroj Umami. Inicializace (skript Umami, sledovací identifikátor) analytického nástroje je provedena centrálně ve kořenové komponentě aplikace, aby bylo zajištěno jednotné měření napříč všemi stránkami. Jednotlivé uživatelské akce jsou následně zaznamenávány v konkrétních částech aplikace, které pouze oznamují vznik dané události.

Umami je využíván především ke sledování průchodu uchazeče jednotlivými kroky náborového procesu. Monitorovány jsou zejména interakce s katalogem pozic (např. změny filtrů či vyhledávání), otevření detailu inzerátu, zahájení reakce na pozici, práce s formulářem včetně validačních chyb a výsledný stav jeho odeslání. Vedle toho jsou sledovány také samostatné kontaktní scénáře.

Získaná data slouží k vyhodnocení použitelnosti portálu a identifikaci kritických míst, ve kterých uchazeči proces opouštějí. Analytická vrstva přitom nepřebírá žádnou rozhodovací roli v rámci systému a zůstává čistě podpůrným nástrojem pro jeho další optimalizaci.


== Implementace dohledové vrstvy (TODO: trochu více do podrobna frajera)
Dohledovou vrstvu jsem implementoval jako kombinaci strukturovaného logování, metrik a centralizovaného dashboardingu. Na úrovni aplikace generuji strukturované logy s request kontextem a kategorizací chyb a současně publikuji metriky pro kritické toky. Tyto výstupy následně vstupují do samostatné monitorovací vrstvy, kde slouží pro diagnostiku a alerting.

Důležité je, že dohled neřeším jako doplněk po implementaci, ale jako klíčovou schopnost systému. Logování i metriky jsou proto součástí integračních a chybových větví kritických toků (auth, outbox, messaging, vrstva inteligentního zpracování dat).

== Komunikace s národními registry

Napojení na národní registry jsem v implementaci řešil primárně pro Národní registr zdravotnických pracovníků (NRZP) spravovaný Ústavem zdravotnických informací a statistiky ČR (ÚZIS), který slouží k ověření odborné způsobilosti pracovníků. Veřejná dokumentace ÚZIS publikuje datové rozhraní registru, číselníky i klientský přístup k NRZP; v provozní realitě se však ukázalo, že samotné technické napojení nestačí. Praktické zprovoznění vyžadovalo klientský certifikát a současně i přidělení externích identifikačních údajů a odpovídajících práv na straně ÚZIS. Při ověřování integrace se potvrdilo, že funkční certifikát sám o sobě ještě nezaručuje přístup k datům a že služba současně očekává i doplnění údajů `ExterniUzivatelLogin` a `ExterniUzivatelJmenoAPrijmeni`.

Z architektonického hlediska jsem proto integrační logiku neumístil přímo do `hiring_backend`, ale oddělil ji do samostatné interní služby `qualification-adapter`. Backend vystavuje pouze interní administrační endpoint `POST /api/v1/admin/qualifications/lookup`, který je dostupný rolím `admin`, `hr` a `authorized_person`. Doménová služba podporuje dva typy dotazu: podle čísla pracovníka v NRZP a podle rodného čísla. Vstup nejprve normalizuje a validuje, teprve poté volá platformní adaptér `platform/qualification`.

Samotný `qualification-adapter` běží pouze v interní Docker síti a představuje mezivrstvu mezi backendem a existující integrační vrstvou nad InterSystems IRIS. Adapter používá IRIS Native SDK a volá konfigurovatelné ObjectScript metody `CtiPracovnik` a `CtiPracovnikPodleRodnehoCisla` nad třídou `UCP.UZIS.ApiTest`. Toto oddělení považuji za důležité ze tří důvodů. Izoluje specifika SOAP/WSDL rozhraní a práci s přístupovými údaji mimo business logiku backendu, umožňuje sjednotit chybové stavy do kontrolovaného HTTP rozhraní a současně zjednodušuje testování i výměnu integračního detailu bez zásahu do doménové vrstvy.

Výstup z registru backend převádí do jednotné doménové struktury obsahující identifikaci pracovníka a seznam odborných, specializovaných a zvláštních odborných způsobilostí. Současně vytváří auditní záznam o úspěšném i neúspěšném dotazu. Z důvodu ochrany osobních údajů se v auditu neukládá plné rodné číslo ani plné identifikátory dotazu, ale pouze jejich maskovaná podoba a hash. Implementace tak splňuje dvojí cíl: umožňuje automatizované ověření kvalifikace proti státnímu registru a zároveň zachovává provozní kontrolu nad citlivou integrační vazbou.
