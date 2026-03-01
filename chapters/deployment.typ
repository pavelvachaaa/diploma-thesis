#import "../template/abbreviations.typ": abbr

Kapitola popisuje nasazení navrženého systému do cílového provozního prostředí a navazuje na architektonická rozhodnutí kapitoly 4 a implementační důkazy kapitoly 5. Jejím cílem je prokázat, že navržená architektura je provozně realizovatelná v podmínkách #abbr("KZ", none), zejména ve vztahu k požadavku na on-premise provoz (NF07), dostupnost (NF04), auditovatelnost (NF11) a interoperabilitu (NF12).

Text je orientován na provozní vrstvu systému: topologii nasazení, orchestrace kontejnerů, release postup, správu konfigurace, observability, zálohování a řízení provozních rizik.

== Cílová topologie nasazení
Nasazení je koncipováno jako distribuovaný model složený ze tří částí: aplikačního stacku, samostatného (TODO: to AI mi trhá oči, nějak to zlepšit) AI výpočetního uzlu a monitoring stacku. Aplikační stack zajišťuje transakční provoz náborových a adaptačních procesů, AI uzel zajišťuje výpočetně náročné jazykové úlohy a monitoring stack zajišťuje sběr logů, metrik a vizualizaci provozních indikátorů. Aplikační a monitoring část jsou propojeny přes dedikovanou Docker síť `monitoring_network`, AI uzel je provozován na separátním serveru a připojen integračními rozhraními.

TODO: Místo tohoto svg tam dát to z Archi
#figure(
  image(
    "../procesy/deployment/deployment-topology.svg",
    width: 100%,
  ),
  caption: [Topologie nasazení aplikačního a monitoring stacku]
) <obr:deployment-topology>

Topologie na @obr:deployment-topology reflektuje princip oddělení odpovědností. Aplikační služby řeší business tok a perzistenci dat, AI uzel řeší inferenční a embedding úlohy a observability vrstva řeší provozní dohled. Tento model snižuje coupling mezi doménovou a výpočetní vrstvou a umožňuje škálovat AI část nezávisle na transakčním backendu.

== Kontejnerizační model a síťová segmentace
Nasazení aplikační části je realizováno pomocí Docker Compose. Služby jsou rozděleny do interní sítě `app-network` a externě sdílené sítě `monitoring_network`. Interní síť slouží pro transakční komunikaci mezi API, databází, objektovým úložištěm a message brokerem. Monitoring síť je určena pro přenos provozních signálů směrem do stacku Grafana/Prometheus/Loki.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.2fr, 2fr, 1.7fr, 1.7fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Služba], [Role v nasazení], [Perzistence], [Síťový kontext],
      [migration], [Jednorázové spuštění databázových migrací před startem API], [Bez perzistentního stavu], [app-network],
      [hr-backend], [Aplikační API a integrační orchestrace], [Aplikační stav je v Postgresu a SeaWeedFS], [app-network + monitoring_network],
      [PostgreSQL (pgvector)], [Transakční a analytická relační data], [Volume `pgdata`], [app-network],
      [SeaweedFS], [S3-compatible úložiště dokumentů], [Volume `seaweedfs_data`], [app-network],
      [RabbitMQ], [Asynchronní messaging pro integrační toky], [Volume `rabbitmq_data`], [app-network],
    )
  ],
  caption: [Kontejnerové služby aplikačního stacku]
) <tab:deployment-app-services>

Podmíněné spouštění služeb je řízeno healthcheck závislostmi. Databáze a objektové úložiště musí být v dostupném stavu před startem API. Migration služba musí úspěšně dokončit běh před spuštěním aplikačního kontejneru. Tím je omezeno riziko startu aplikace proti nekompatibilnímu schématu databáze.

== Distribuovaná AI výpočetní vrstva
Vedle aplikačního stacku je provozována samostatná AI vrstva na odděleném serveru. Tuto vrstvu tvoří služby `job-processor` a `cv-processor`, které využívají lokálně dostupný runtime Ollama akcelerovaný GPU NVIDIA A10 s kapacitou 24 GB VRAM. Oddělení těchtí výpočtů na separátní host odpovídá cíli izolovat výpočetně náročné operace od transakční části systému a současně efektivně využít specializovaný hardware.

`cv-processor` je integrován asynchronně přes RabbitMQ: konzumuje události o nahraných dokumentech, zpracovává je pomocí Ollama a publikuje výsledky zpět do integrační fronty. Pro práci s dokumenty využívá objektové úložiště (SeaweedFS/S3-compatible), čímž je zachována datová kontinuita mezi aplikačním a AI uzlem. `job-processor` je integrován synchronně přes HTTP/SSE rozhraní a slouží pro interaktivní AI scénáře v administračním rozhraní.

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
      [job-processor], [Interaktivní AI generování a úprava textu], [HTTP/SSE volání z backendu], [AI server (separátní)],
      [cv-processor], [Asynchronní analýza CV a generování embeddingů], [RabbitMQ + SeaweedFS], [AI server (separátní)],
      [Ollama], [LLM inference a embedding backend], [Lokální volání z processor služeb], [AI server (GPU A10 24 GB)],
    )
  ],
  caption: [Služby distribuované AI výpočetní vrstvy]
) <tab:deployment-ai-services>

== Release workflow a migrace schématu
Release proces je v provozu standardizován skriptem `deploy-compose.sh`, který automatizuje build, kontrolu sítě, start databáze, provedení migrací a následné spuštění aplikačních služeb. Sekvence je navržena tak, aby minimalizovala provozní riziko během nasazení nové verze.

#figure(
  image(
    "../procesy/deployment/deployment-flow.svg",
    width: 100%,
  ),
  caption: [Sekvenční tok release procesu]
) <obr:deployment-flow>

Provozní logika release procesu na @obr:deployment-flow zajišťuje, že migrační krok je vyhodnocen jako (jak se tohle asi řekne česky) explicitní quality gate. Při neúspěchu migrace se nasazení ukončí a nová verze API není spuštěna. Tento mechanismus snižuje riziko nekonzistence mezi verzí aplikace a verzí datového schématu.

Vzhledem k tomu, že databáze běží v samostatném kontejneru s perzistentním volume, je její stav zachován mezi jednotlivými release cykly. Nasazení tedy neprovádí destruktivní operace nad datovou vrstvou a podporuje kontinuální evoluci systému bez resetu produkčních dat. AI server je nasazován samostatným release cyklem. Z pohledu backendu je proto kritické průběžně ověřovat dostupnost externích endpointů `job-processor` a integračních toků `cv-processor`.

== Správa konfigurace a bezpečnostní aspekty provozu
Konfigurace služeb je v environment souborech, které oddělují provozní parametry od aplikačního kódu. Tento přístup odpovídá požadavku na udržitelnost (NF08) a zároveň umožňuje diferencovat prostředí podle charakteru provozu (lokální vývoj, testovací provoz, produkční režim).

Z bezpečnostního hlediska je klíčové, že citlivé údaje (hesla, tokeny, SMTP přístupové údaje) nejsou hardcoded v implementaci, ale předávány prostřednictvím proměnných prostředí. Pro produkční provoz je dále nutné zajistit pravidelnou rotaci tajných údajů, omezení přístupu k `.env` souborům a audit operací nad infrastrukturou.

Síťová segmentace doplňuje aplikační bezpečnostní model o provozní vrstvu ochrany. Databáze, messaging i úložiště nejsou publikovány jako veřejné HTTP služby aplikace a jsou určeny primárně pro interní komunikaci kontejnerů. Externí přístup je řízen pouze přes publikované aplikační body. Pro integrační komunikaci s AI serverem jsou využita explicitní endpointová rozhraní (např. `JOB_CHAT_URL`) a kanály přes RabbitMQ.

== Observability v provozu (Grafana, Loki, Promtail, Prometheus)
Observability stack je provozován samostatně v repozitáři `service-monitoring` a je tvořen komponentami Grafana, Loki, Promtail a Prometheus. Sběr logů je realizován přes Promtail s Docker service discovery, přičemž jsou vybírány kontejnery označené labelem `logging=promtail`. Tento model umožňuje cílené připojení pouze těch služeb, které mají být součástí centralizovaného logového dohledu.

Záznamy jsou v ingest pipeline transformovány do strukturované podoby a doplněny o provozní štítky (např. úroveň logu, služba, operace). Výsledkem je konzistentní dotazovatelnost v Loki a kvalitnější diagnostika incidentů v Grafaně. Na úrovni metrik je Prometheus konfigurován na periodický scrape. Aktuální konfigurace je využita pro monitorování vybraných služeb a je připravena na rozšíření o plné pokrytí backendu i AI uzlu.

Grafana je v nasazení používána nejen pro dashboarding, ale i pro alerting. Konfigurační provisioning datových zdrojů a kontaktů je součástí monitoring stacku, což zajišťuje opakovatelnost nasazení observability vrstvy a omezuje manuální kroky při obnově prostředí.

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
      [Promtail], [Sběr a předzpracování logů z Docker kontejnerů], [Centralizovaná logová observability bez zásahu do business logiky],
      [Loki], [Uložení a dotazování log streamů], [Rychlá diagnostika incidentů na základě časových a štítkových dotazů],
      [Prometheus], [Sběr a vyhodnocení metrik], [Podpora trendové analýzy dostupnosti a výkonu],
      [Grafana], [Vizualizace a alerting], [Jednotné operátorské rozhraní pro logy i metriky],
    )
  ],
  caption: [Role komponent observability stacku]
) <tab:deployment-observability>

== Zálohování, obnova a datová kontinuita
Datová kontinuita je v nasazení zajištěna využitím perzistentních Docker volumes pro klíčové stavové služby. Pro aplikační stack se jedná zejména o volumes `pgdata`, `seaweedfs_data` a `rabbitmq_data`. Pro monitoring stack jsou použity volumes pro data Grafany, Loki a Promethea.

Tento přístup snižuje riziko ztráty stavu při restartu kontejnerů nebo při release nové verze aplikace. Z provozního hlediska je zásadní, že release cyklus neprovádí automatické mazání volume vrstev. Obnova systému po incidentu tak může být provedena kombinací restartu služeb, obnovy databáze ze záloh a opětovného připojení persistentních dat.

Součástí provozní disciplíny musí být i periodické ověřování obnovitelnosti záloh. Samotná existence záloh bez pravidelných restore testů nezajišťuje reálnou odolnost systému vůči kritickým incidentům. TODO: Tohle se musí ještě doimplementovat, takže pak změnit podle finálního výsledku..

== Provozní omezení a mitigace
Aktuální model nasazení je zvolen jako pragmatický kompromis mezi rychlostí implementace a provozní robustností. Přináší však i omezení, která je nutné evidovat. Prvním omezením je orchestrace na úrovni Docker Compose, která je vhodná pro pilotní a menší produkční provoz, ale neposkytuje pokročilé orchestrace schopnosti typu automatický self-healing nebo horizontální autoscaling na úrovni clusteru.

Druhým omezením je postupná fáze pokrytí metrikami, kdy logová observability dosahuje vyššího pokrytí. V praxi to znamená, že část provozních rozhodnutí je stále více log-driven než SLO-driven. Mitigací je doplnění metrik pro všechny kritické komponenty aplikačního toku.

Třetím omezením je závislost na správném provozním nastavení tajných údajů v prostředí. Mitigací je zavedení centralizované správy secretů, pravidelná rotace hesel a audit přístupů k infrastrukturním konfiguračním artefaktům.

== Shrnutí kapitoly
Kapitola ukazuje, že navržený systém je nasaditelný v on-premise režimu pomocí kontejnerizačního modelu s oddělenou observability vrstvou. Topologie, release workflow a model perzistence dat podporují stabilní provoz, kontrolovanou evoluci systému a průběžný dohled nad kvalitou služby.

Zároveň byly explicitně identifikovány limity současného nasazení a odpovídající mitigační opatření. Tím je vytvořen realistický základ pro další provozní zrání řešení v navazujících etapách projektu.
