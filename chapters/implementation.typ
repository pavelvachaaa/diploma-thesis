#import "../template/abbreviations.typ": abbr

V této kapitole popisuji, jak jsem architektonický návrh převedl do konkrétní implementace. Zatímco předchozí kapitola řešila důvody a principy návrhu, zde uvádím reálné technické artefakty, integrační mechanismy a provozní implementační rozhodnutí.

Popsány budou pouze klíčové části projektu, které jsou pro chod systému stěžejní. Mezi tyto části patří doménově orientované jádro (`DDD`), návrhový vzor `Ports and Adapters`, spolehlivou asynchronní integraci (`Outbox service`) a implementaci AI vrstvy.

== Struktura řešení
Celé řešení implementuji jako sadu spolupracujících aplikací s jasně rozdělenými odpovědnostmi. Transakční jádro běží v Node.js/Express, webové rozhraní v Next.js a (TODO: pořad jsem nevymyslel jak nepoužívat slovíčko AI) AI zpracování v Go procesorech.

TODO: Přidat audit_writer, kariera.kzcr.eu
#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.4fr, 1.2fr, 2.4fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Projekt], [Technologie], [Role v implementaci],
      [`hiring_backend`], [Node.js 25, Express 5], [Transakční API, doménová logika, autorizace, outbox worker, publikace integračních událostí],
      [`onboarding.kzcr.eu`], [Next.js 16, React 19, TypeScript], [Admin a employee UI, aplikační workflow, volání API],
      [`cv_processor`], [Go 1.23], [Asynchronní analýza dokumentů, extrakce dat, embeddingy, publikace výsledků],
      [`job_processor`], [Go 1.23], [AI zpracování požadavků nad pracovními pozicemi],
      [Datová vrstva], [PostgreSQL 17 + pgvector], [Transakční data, auditní stopa, outbox záznamy, vektorové indexy],
      [Integrační vrstva], [RabbitMQ], [Asynchronní páteř mezi backendem a AI procesory],
    )
  ],
  caption: [Implementační baseline systému]
) <tab:impl-baseline>

Toto rozdělení mi umožnilo oddělit business kritickou transakční část od výpočetně náročných AI operací a zároveň udržet konzistentní integrační kontrakty mezi jednotlivými komponentami.

== Implementace backendu (`hiring_backend`)
Backend jsem implementoval jako modulární aplikaci s oddělením HTTP vrstvy, aplikační orchestrace, doménových služeb a perzistence. Vstupem každého požadavku je route a middleware pipeline, která zajišťuje autentizaci, autorizaci, organizační scoping a auditovatelný request context. Následně požadavek přechází do služby domény, která provádí business logiku a volá repository vrstvu.

V implementaci používám dependency injection kontejner (Awilix), který mi umožňuje držet stabilní kontrakty mezi doménou a infrastrukturou. Každý modul registruji přes vlastní `index` soubor a závislosti řeším přes DI tokeny, nikoli přímé importy konkrétních adapterů. Tento postup snižuje provázánís a usnadňuje testování i refaktoraci.

TODO: Přidat porty pro komunikaci mezi službami (a pokud to stihnu tak event bus)
#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.5fr, 2.5fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Vrstva], [Implementační odpovědnost],
      [HTTP + middleware], [Routing, validace vstupu, autentizace, role check, organizační scope, chybové mapování],
      [Aplikační služby], [Orchestrace use-case scénářů a řízení transakčních kroků],
      [Doménové služby], [Business pravidla pro nábor, pohovory, onboarding, notifikace],
      [Repository], [Perzistence přes parametrizované SQL dotazy],
      [Platform adaptery], [DB, storage, RabbitMQ, mailer, audit, logger],
    )
  ],
  caption: [Vrstvení implementace backendu]
) <tab:impl-backend-layers>

== Realizace DDD + Ports and Adapters
Doménové jádro jsem implementoval kolem explicitních byznysových kontextů (např. uchazeči, zaměstnanci, onboarding, pohovory, notifikace). Každý kontext obsahuje vlastní služby a repository rozhraní. Na úrovni implementace tím držím jasné hranice odpovědnosti a omezuji přenos doménových pravidel do infrastrukturních částí.

Architekturu `Ports and Adapters` jsem realizoval přes stabilní porty (DI kontrakty) a vyměnitelné adaptéry pro konkrétní technologii. Doménové služby tak neřeší, zda je komunikace realizována přes SQL, AMQP nebo objektové úložiště. Tento princip mi v praxi umožnil měnit integrační chování bez zásahu do business logiky.

Z pohledu této práce je důležité, že `Outbox service`, `RabbitMQ` a AI procesory nevystupují jako ad hoc přídavky, ale jako adaptery napojené na explicitní integrační porty domény.

== Implementace spolehlivé asynchronní komunikace (Outbox service + RabbitMQ)

TODO: Asi možná někde teorie k těm patternum? nevím
Klíčovým implementačním mechanismem je tabulka `side_effect_outbox` a její worker. Vždy když v rámci doménové transakce vznikne vedlejší efekt, zapisuji nejprve business data a zároveň _záměr_ vedlejší akce do outboxu. Teprve po _commit_ fázi worker událost vyzvedne a publikuje.

Tímto řešením odděluji kritickou transakci od nespolehlivých externích závislostí. Pokud je broker dočasně nedostupný, nedochází ke ztrátě primárních dat a outbox worker provede řízené opakování.

TODO: zmínit, že správce aplikace má možnost v UI onboardingu to taky vidět a spustit znovu

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.6fr, 2.4fr),
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
  caption: [Typy outbox událostí implementovaných v backendu]
) <tab:impl-outbox-events>

Z implementačního pohledu používám v outbox workeru dávkové zpracování, zamykání položek, řízené opakování a mrtvý stav pro neobnovitelné chyby. V kombinaci s `RabbitMQ` tím zajišťuji provozně stabilní integrační páteř mezi backendem a AI vrstvou.

#figure(
  image(
    "../procesy/architecture/seq-outbox-rabbitmq-ai.svg",
    width: 100%,
  ),
  caption: [Realizační tok Outbox-RabbitMQ-AI v implementaci]
) <obr:impl-outbox-ai>

== Implementace AI vrstvy  (cv_processor, job_processor)
AI vrstvu jsem implementoval jako samostatné Go procesory oddělené od backendu. Každý procesor má vlastní odpovědnost a je napojen na messaging kontrakty, aby bylo možné škálovat AI část nezávisle na transakčním API.

`cv_processor` implementuje asynchronní pipeline nad dokumenty uchazečů. Po přijetí události z RabbitMQ načte dokument z objektového úložiště, provede extrakci textu, strukturovanou analýzu a publikuje výsledek zpět jako integrační událost. `job_processor` realizuje AI funkce nad pracovním inzerátem a vrací výstupy, které backend zapisuje nebo dále publikuje podle doménového scénáře.

Tato implementace naplňuje požadavek na oddělení výpočetně náročných operací od hlavní transakční cesty a současně zachovává jednotnou integrační vrstvu.

== Implementace datové vrstvy a migrací
Perzistenci jsem implementoval nad PostgreSQL 17 s rozšířením `pgvector`. Relační část pokrývá transakční agendu náboru a onboardingu, vektorová část podporuje AI scénáře (embeddingy CV a pozic). Schéma rozvíjím řízeně přes verze SQL migrací.

V implementaci důsledně držím organizační izolaci dat přes `organization_id` v klíčových entitách a kontrolu přístupového rozsahu v aplikační vrstvě. Auditní stopu ukládám do samostatné struktury s omezením mutací, aby byl zajištěn požadovaný stupeň auditovatelnosti.

Důležitou součástí datové vrstvy je i outbox tabulka, která propojuje transakční konzistenci s asynchronními integracemi bez nutnosti distribuované transakce.

TODO: Asi ER diargam klíčových entit. teď je tam asi 60 tabulek..

== Implementace bezpečnosti a identity
Bezpečnostní implementaci stavím na více vrstvách. První vrstvou je autentizace uživatele a správa tokenu relace (session token). Druhou vrstvou je RBAC autorizace nad endpointy. Třetí vrstvou je organizační scoping, který omezuje data na úroveň jednotlivých tenantů.

V implementaci rozlišuji interní role (např. administrativní,HR role nebo vedoucí zaměstnanec) a pohled nastupujícího zaměstnance. Přístupová rozhodnutí neřeším pouze na prezenční vrstvě, ale primárně na backendu, kde vynucuji role i organizační vlastnictví zdrojů. Tím snižuji riziko, že by bylo možné obejít pravidla přímým voláním API.

TODO: Má cenu zminovat sso, když bude stejně v architektuře?
== Implementace onboardingového portálu
Frontend jsem implementoval jako Next.js aplikaci s oddělením administračních a zaměstnaneckých  scénářů. Na úrovni implementace jsem rozdělil layouty, cesty a stavovou logiku podle role uživatele, aby bylo možné konzistentně řídit přístup ke stránkám i workflow krokům.

todo: rozšířit asi třeba o obrázek a nějaké kecy okolo
== Implementace karierního portálu 
todo: rozšířit asi třeba o obrázek a nějaké kecy okolo

== Implementace dohledové vrstvy
Dohledovou vrstvu jsem implementoval jako kombinaci strukturovaného logování, metrik a centralizovaného dashboardingu. Na úrovni aplikace používám strukturované logy s request kontextem a kategorizací chyb. Tyto informace následně vstupují do monitorovací vrstvy (Grafana, Prometheus, Loki, Promtail), kde slouží pro diagnostiku a alerting.

Důležité je, že dohled neřeším jako doplněk po implementaci, ale jako klíčovou schopnost systému. Logování i metriky jsou proto součástí integračních a chybových větví kritických toků (auth, outbox, messaging, AI).

== Komunikace s národními registry

UZIS
Certifikaty
WSDL
SOAP
BOLEST
ALE USPECH