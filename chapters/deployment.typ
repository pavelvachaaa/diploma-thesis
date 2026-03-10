#import "../template/abbreviations.typ": abbr

V této kapitole popisuji nasazení navrženého systému do cílového provozního prostředí. Navazuji na architektonická rozhodnutí kapitoly 4 a na implementační realizaci kapitoly 5. Cílem kapitoly je prokázat, že navržené řešení je provozně realizovatelné v podmínkách #abbr("KZ", none), zejména ve vztahu k požadavkům na on-premise provoz (NF07), dostupnost (NF04), auditovatelnost (NF11) a interoperabilitu (NF12).

== Cílová topologie nasazení
Nasazení koncipuji jako distribuovaný model složený ze tří částí. Aplikační vrstva, oddělená AI výpočetní vrstva a dohledová vrstva. Aplikační vrstva zajišťuje transakční provoz náborových a adaptačních procesů, AI vrstva realizuje výpočetně náročné jazykové úlohy a dohledová vrstva zajišťuje sběr logů, metrik a vizualizaci provozních indikátorů.

TODO: Překreslit
#figure(
  image(
    "../procesy/deployment/deployment-topology.svg",
    width: 100%,
  ),
  caption: [Topologie nasazení aplikační, AI a dohledové vrstvy],
) <obr:deployment-topology>

Topologie na @obr:deployment-topology vychází z principu oddělení odpovědností. Aplikační část drží business tok a datovou perzistenci, AI část drží inferenci a embeddingy a poslední část drží provozní dohled. Tím snižuji provázání mezi transakční a výpočetní vrstvou a umožňuji škálovat AI část nezávisle na API.

== Kontejnerizační model a síťová segmentace
Aplikační část nasazuji pomocí Docker Compose. TODO:

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.2fr, 2fr, 1.7fr, 1.8fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Služba], [Role v nasazení], [Perzistence], [Síťový kontext],
      [migration], [Jednorázové spuštění migrací schématu před startem API], [Bez perzistentního stavu], [app-network],
      [hr-backend],
      [Transakční API a integrační orchestrace],
      [Aplikační stav je v PostgreSQL a SeaweedFS],
      [app-network + monitoring_network],

      [onboarding-frontend], [Webové rozhraní pro admin a zaměstnance], [Bez perzistentního stavu], [app-network],
      [PostgreSQL (pgvector)], [Transakční i analytická relační data], [Volume `pgdata`], [app-network],
      [SeaweedFS], [S3-compatible úložiště dokumentů], [Volume `seaweedfs_data`], [app-network],
      [RabbitMQ], [Asynchronní integrační messaging], [Volume `rabbitmq_data`], [app-network],
      [Apache Tika], [TODO:], [Bez perzistentního stavu], [app-network],
      [cv_processor], [TODO:ů], [Bez perzistentního stavu], [app-network],
      [job_processor], [TODO:], [Bez perzistentního stavu], [app-network],
      [audit_writer], [TODO:], [Bez perzistentního stavu], [app-network],
    )
  ],
  caption: [Kontejnerové služby a jejich nasazovací role],
) <tab:deployment-services>

Síťovou segmentaci řeším třemi vrstvami. Interní sítí `app-network` pro transakční komunikaci, externě sdílenou sítí `monitoring_network` pro dohled a sdílenou sítí `kz` pro oddělené compose soubory AI služeb. Tento model omezuje zbytečnou síťovou expozici a současně zachovává integrační prostupnost tam, kde ji potřebuji.

== Distribuovaná AI výpočetní vrstva
Vrstva zpracování přirozeného jazyka je provozována na separátním serveru. Tuto vrstvu tvoří služby cv-processor a job-processor, které využívají lokální runtime Ollama akcelerovaný GPU NVIDIA A10 s kapacitou 24 GB VRAM. Oddělením výpočetně náročných modelových inference na samostatný host jsou tyto operace izolovány od transakční části aplikačního API.

`cv-processor` je navázán na asynchronní tok přes RabbitMQ a zpracovává dokumentové události v pipeline objektové úložiště -> extrakce textu -> AI analýza -> publikace výsledku. `job-processor` je nasazen jako samostatná AI služba pro scénáře tvorby a úprav pracovních inzerátů. Obě služby používají stejný inferenční backend (Ollama), ale mají odlišný integrační účel.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.2fr, 2fr, 1.8fr, 1.6fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Služba], [Role v AI vrstvě], [Integrační vazba], [Host],
      [cv-processor],
      [Asynchronní analýza CV a generování embeddingů],
      [RabbitMQ + SeaweedFS + Tika],
      [AI server (separátní)],

      [job-processor], [AI podpora práce s obsahem inzerátů], [Aplikační integrační rozhraní], [AI server (separátní)],
      [Ollama],
      [LLM inference a embedding backend],
      [Lokální volání z AI processor služeb],
      [AI server (GPU A10 24 GB)],
    )
  ],
  caption: [Distribuovaná AI vrstva v nasazení],
) <tab:deployment-ai-services>

== Startovací pořadí, release workflow a migrace schématu
V provozu dodržuji explicitní startovací posloupnost, která omezuje riziko startu aplikace proti nekompatibilnímu stavu datové vrstvy.

1. Nejprve startuji databázi a čekám na healthcheck.
2. Následně spouštím migrační službu (`migration`) a vyžaduji její úspěšné dokončení.
3. Teprve potom startuji `hr-backend`, `seaweedfs`, případně `rabbitmq` a AI profil.

#figure(
  image(
    "../procesy/deployment/deployment-flow.svg",
    width: 100%,
  ),
  caption: [Sekvenční tok release procesu],
) <obr:deployment-flow>

V release toku na @obr:deployment-flow chápu migrační krok jako explicitní quality gate. Při neúspěchu migrace nasazení ukončuji a novou verzi API nespouštím. Tím snižuji riziko nekonzistence mezi binární verzí aplikace a verzí databázového schématu.

== Správa konfigurace a bezpečnost provozu
Konfiguraci služeb držím v environment souborech, čímž odděluji provozní parametry od aplikačního kódu. Tento přístup podporuje udržitelnost (NF08) a umožňuje konzistentně spravovat rozdíly mezi lokálním, testovacím a produkčním režimem.

Z bezpečnostního hlediska neukládám citlivé hodnoty do zdrojových kódů. Přístupové údaje pro databázi, message broker, SMTP a identity provider předávám přes prostředí. Pro produkční režim předpokládám pravidelnou rotaci tajných údajů, omezení přístupů ke konfiguračním artefaktům a audit administrátorských zásahů.

== Dohledová vrstva
Dohledovou vrstvu jsem nasadil odděleně od aplikační části. Vrstva je tvořena komponentami Grafana, Loki, Promtail a Prometheus. Promtail sbírá logy z vybraných kontejnerů, Loki je ukládá a zpřístupňuje k dotazům, Prometheus sbírá metriky a Grafana poskytuje intutivní a přehlednou nástěnku s daty a v případě nutnosti varuje správce systému o dergadaci

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.2fr, 2fr, 1.8fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Komponenta], [Primární funkce], [Provozní přínos],
      [Promtail], [Sběr a předzpracování logů z kontejnerů], [Centralizovaná diagnostika bez zásahu do business logiky],
      [Loki], [Uložení a dotazování log streamů], [Rychlá analýza incidentů podle času a štítků],
      [Prometheus], [Sběr metrik a trendové vyhodnocení], [Podpora řízení dostupnosti a výkonu],
      [Grafana], [Vizualizace a upozornění], [Jednotné operátorské rozhraní pro logy i metriky],
    )
  ],
  caption: [Role komponent dohledové vrstvy],
) <tab:deployment-observability>

== Perzistence dat a stavové služby
Provoz systému zahrnuje několik stavových komponent, jejichž data musí být zachována i při restartu kontejnerů nebo aktualizaci aplikační vrstvy. Z tohoto důvodu jsou pro tyto služby použita perzistentní Docker úložiště (Docker volumes).

Perzistentní úložiště jsou využita zejména pro Postgres, SeaweedFS a RabbitMQ.

== Provozní omezení a mitigace

Navržený model nasazení představuje pragmatický kompromis mezi rychlostí implementace, provozní jednoduchostí a úrovní infrastruktury. Architektura byla navržena s ohledem na pilotní provoz, což s sebou přináší několik provozních omezení.

Prvním omezením je způsob orchestrace kontejnerů. Nasazení je realizováno pomocí nástroje Docker Compose, který poskytuje jednoduchou správu více kontejnerových služeb na jednom hostu. Tento přístup je vhodný pro vývojová a menší produkční prostředí, nicméně neposkytuje pokročilé vlastnosti typické pro kontejnerové orchestrátory vyšší úrovně, jako je automatická obnova služeb po selhání, horizontální škálování nebo distribuce zátěže mezi více výpočetními uzly.

Další omezení souvisí s dohledovou vrstvou. Systém již obsahuje základní infrastrukturu pro sběr logů a metrik, nicméně pokrytí jednotlivých komponent metrikami je stále postupně rozšiřováno. V současné fázi provozu je proto část provozních rozhodnutí založena především na analýze aplikačních logů a manuálním vyhodnocování provozních situací, zatímco plně formalizovaný model řízení dostupnosti založený na definovaných SLO (Service Level Objectives) zatím není implementován.

Určitou citlivost systému představuje také správa konfiguračních parametrů a tajných údajů. Přístupové údaje k databázi, message brokeru, SMTP serveru a dalším integračním službám jsou předávány prostřednictvím prostředí běhového systému. Tento model sice odděluje konfiguraci od aplikačního kódu, ale zároveň klade zvýšené nároky na provozní disciplínu při správě konfiguračních souborů a přístupových práv.

Zmírnění těchto omezení je řešeno kombinací několika opatření. Postupně je rozšiřováno pokrytí systému provozními metrikami, což umožňuje přesnější sledování chování systému v čase. Současně je uplatňována přísnější správa tajných údajů, zahrnující omezení přístupových práv ke konfiguračním souborům a pravidelnou rotaci přístupových klíčů a evidenci. Tato opatření přispívají ke zvýšení provozní bezpečnosti a postupnému posilování robustnosti nasazeného systému.
