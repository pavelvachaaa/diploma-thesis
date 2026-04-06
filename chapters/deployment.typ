#import "../template/abbreviations.typ": abbr

Navržený systém má hodnotu jen tehdy, pokud jej lze provozně udržet v podmínkách #abbr("KZ", none). Nasazení proto v této práci nevystupuje jako technický dovětek k implementaci, ale jako samostatná vrstva návrhu, která musí respektovat požadavky na on-premise provoz (NF07), dostupnost (NF04), auditovatelnost (NF11) a interoperabilitu (NF12). Nejde o uvedení jediné aplikace do běhu, ale o koordinaci spolupracujících frontendových, backendových, integračních a výpočetních služeb, které dohromady tvoří jeden provozní celek.

== Kontejnerizační model a síťová segmentace
Jednotlivé části systému distribuuji jako samostatné kontejnerové image a provozuji je pomocí `Docker Compose`. Tento přístup odpovídá cílovému on-premise prostředí a současně nevyžaduje zavedení rozsáhlejšího orchestračního rámce už v pilotní fázi. Bezstavové služby jsou aktualizovány výměnou image, zatímco stavové komponenty používají perzistentní volumes nebo sdílenou databázovou vrstvu. Přehled hlavních služeb uvádím v @tab:deployment-services.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.4fr, 2.6fr, 1.6fr, 1.8fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,

      [Služba], [Role], [Stav], [Expozice],

      [`kariera.kzcr.eu`], [Kariérní portál pro publikaci inzerátů a podání přihlášek], [Bezstavová], [Veřejná],

      [`onboarding.kzcr.eu`], [Onboardingový portál pro HR a zaměstnance], [Bezstavová], [Interní web],

      [`hr-backend`], [Transakční API a integrační logika], [Bezstavová (PostgreSQL, SeaweedFS)], [Interní API],

      [`migration`], [Migrace databázového schématu], [Bezstavová], [Bez expozice],

      [`qualification-adapter`], [Lookup kvalifikací z NRZP], [Bezstavová], [Interní],

      [`user-search-adapter`], [Lookup interních uživatelů], [Bezstavová], [Interní],

      [`audit_writer_processor`], [Zápis auditních událostí], [Bezstavová (RabbitMQ → PostgreSQL)], [Bez HTTP],

      [`PostgreSQL (pgvector)`], [Transakční a auditní data], [Stavová], [Interní],

      [`SeaweedFS`], [Úložiště dokumentů], [Stavová], [Interní],

      [`RabbitMQ`], [Fronta zpráv pro asynchronní zpracování], [Stavová], [Interní],

      [`Umami`], [Webová analytika], [Stavová (PostgreSQL)], [Omezená interní],
    )
  ],
  caption: [Hlavní služby v nasazení],
) <tab:deployment-services>

Síťový model používá čtyři logické segmenty. `app-network` nese hlavní aplikační komunikaci mezi frontendy, backendem a stavovými službami. `adapter-internal` odděluje interní adaptéry `qualification-adapter` a `user-search-adapter`, které jsou přístupné pouze službě `hr-backend`. `monitoring_network` je vyhrazena pro sběr logů a metrik. Síť `kz` propojuje host vrstvy inteligentního zpracování dat s procesory `cv_processor`, `job_processor`, `Apache Tika` a `Ollama`. Interní adaptéry záměrně nemají publikovaný host port, protože jejich rozhraní slouží jen pro komunikaci mezi službami a nepatří do veřejného síťového perimetru.

Podrobnější síťová opatření, například konkrétní firewallová pravidla nebo umístění jednotlivých služeb do širší infrastruktury organizace, závisejí na cílovém prostředí #abbr("KZ", none). V této práci proto zachycuji především logické segmenty a důvody jejich oddělení, nikoli detailní síťovou konfiguraci konkrétní instalace.

== Nasazení aplikačního stacku `hiring_backend`
Aplikační stack tvoří `hr-backend`, migrační služba `migration`, interní adaptéry `qualification-adapter` a `user-search-adapter`, stavové služby `PostgreSQL`, `SeaweedFS`, `RabbitMQ` a doprovodná analytická služba `Umami`. Toto rozdělení zachovává transakční API oddělené od integračních detailů i od pomocných provozních funkcí.

Startovací posloupnost má explicitní pořadí, protože právě na ní závisí, zda se nové nasazení rozběhne konzistentně vůči databázi a interním závislostem:

1. Nejprve se startuje `PostgreSQL` a čeká se na úspěšný `healthcheck`.
2. Následně se spustí jednorázová služba `migration`, která aplikuje SQL migrace a představuje quality gate mezi novou verzí aplikace a databázovým schématem.
3. Po úspěšné migraci se uvede do běhu interní adaptéry `qualification-adapter` a `user-search-adapter` a vyžaduji jejich `healthcheck`.
4. Teprve poté se startuje `hr-backend`, navázané infrastrukturní služby a analytická služba `Umami`.
5. Při prvním nebo změněném nasazení `Umami` se doplňují jednorázové inicializační kroky `umami-db-init` a `umami-bootstrap`, které připraví databázi a základní konfiguraci analytického prostředí.

Význam migrační služby spočívá v tom, že brání startu API proti nekompatibilní verzi schématu. `qualification-adapter` a `user-search-adapter` běží jako interní Node.js služby s vlastním `healthcheck`em. `Umami` v tomto modelu nepředstavuje byznysové jádro systému, ale provozní doplněk pro měření používání portálů. Samotný `hr-backend` je zároveň připojen do `monitoring_network`, aby bylo možné centrálně sbírat jeho logy a metriky.

Z hlediska hexagonální architektury je důležité, že nasazovací hranice nejsou totožné s hranicemi portů a adaptérů. Většina vstupních adaptérů (`routes`, kontrolery, middleware) i většina výstupních adaptérů (`audit`, `outbox`, `storage`, `ReBAC`) běží uvnitř procesu `hr-backend` a nejsou samostatnými nasazovacími jednotkami. Samostatně nasazuji pouze ty adaptéry, které mají odlišný runtime, síťové oddělení nebo vlastní provozní životní cyklus, konkrétně `qualification-adapter`, `user-search-adapter`, `audit_writer_processor`, `cv_processor` a `job_processor`.

== Nasazení auditní služby
Asynchronní persistenci auditu zajišťuje samostatný worker `audit_writer_processor`. Tato služba konzumuje auditní události z `RabbitMQ`, validuje jejich obsah a ukládá je do tabulky `audit_events` v `PostgreSQL`. Oddělení auditního zápisu od request cesty `hr-backend` zkracuje odezvu aplikačního API a současně zvyšuje odolnost proti dočasnému selhání databázové nebo messaging vrstvy.

`audit_writer_processor` nemá veřejné HTTP rozhraní a je provozován pouze jako interní asynchronní worker. Jeho provozními závislostmi jsou `RabbitMQ`, `PostgreSQL` a aplikační síť, v níž jsou obě služby dostupné. V textu je důležité odlišovat tento worker od samotné tabulky `audit_events`; tabulka je datová struktura, zatímco worker představuje vykonávací provozní komponentu.

== Nasazení vrstvy inteligentního zpracování dat
Vrstva inteligentního zpracování dat je provozována na samostatném hostu, aby byla výpočetně náročná inference oddělena od transakční části systému. Tento host obsluhuje `cv_processor`, `job_processor`, pomocnou službu `Apache Tika` a lokální inferenční backend `Ollama`. Oddělení této vrstvy omezuje riziko, že dlouhé nebo GPU náročné úlohy zhorší dostupnost `hr-backend`, a současně umožňuje nastavovat odlišný runtime profil než u hlavního aplikačního hostu.

`cv_processor` je navázán na asynchronní tok přes `RabbitMQ`. Po přijetí události stáhne dokument ze `SeaweedFS`, předá jej do `Apache Tika` pro extrakci textu, zavolá `Ollama` pro analýzu a generování embeddingů a výsledek publikuje zpět do messaging vrstvy. Naproti tomu `job_processor` vystupuje jako samostatná HTTP/SSE služba, kterou `hr-backend` volá synchronně při generování nebo úpravě obsahu pracovních inzerátů. Oba procesory sdílejí stejný inferenční backend, ale plní odlišné integrační role. Přehled vrstvy inteligentního zpracování dat uvádím v @tab:deployment-ai-services.

#figure(
  [
    #set par(justify: false)
    #table(
      columns: (1.25fr, 2fr, 1.85fr, 1.55fr),
      inset: 7pt,
      align: left,
      fill: (x, y) => if y == 0 { rgb("#eeeeee") } else { white },
      stroke: 0.5pt + gray,
      [Služba], [Role ve vrstvě inteligentního zpracování dat], [Integrační vazba], [Host],
      [`cv_processor`], [Asynchronní analýza CV a generování embeddingů], [`RabbitMQ`, `SeaweedFS`, `Apache Tika`, `Ollama`], [Host vrstvy inteligentního zpracování dat v síti `kz`],
      [`job_processor`], [HTTP/SSE služba pro tvorbu a úpravy textu inzerátů], [Synchronní volání z `hr-backend` + `Ollama`], [Host vrstvy inteligentního zpracování dat v síti `kz`],
      [`Apache Tika`], [Extrakce textového obsahu z dokumentů CV], [Interní HTTP volání z `cv_processor`], [Host vrstvy inteligentního zpracování dat v síti `kz`],
      [`Ollama`], [Lokální inference a embedding backend], [Volání z `cv_processor` a `job_processor`], [Host vrstvy inteligentního zpracování dat s GPU NVIDIA A10 24 GB],
    )
  ],
  caption: [Distribuovaná vrstva inteligentního zpracování dat v nasazení],
) <tab:deployment-ai-services>

Výpočetní host využívá lokální `Ollama` akcelerovanou GPU kartou NVIDIA A10 s kapacitou 24 GB VRAM. Tento údaj v kontextu nasazení neuvádím jako marketingový parametr, ale jako provozní zdůvodnění, proč je vrstva inteligentního zpracování dat oddělena na samostatný uzel a proč má vlastní runtime konfiguraci.

== Release workflow, distribuce image a aktualizace služeb
Nasazení celého ekosystému stavím na jednotném image-based `CI/CD` modelu. Vývojář po dokončení změny publikuje release tag `vX.Y.Z`, který aktivuje workflow na Gitea runneru. Ten ověří formát tagu, podle povahy služby provede build a testy, sestaví produkční image a publikuje jej do interního registru kontejnerových image `docker.kzcr.eu`.

Po úspěšném buildu workflow vytváří minimální deploy bundle. U frontendů jde typicky o `compose.yaml` a `.env.deploy`, u backendových a worker služeb se přidává runtime konfigurace nebo pomocný deploy skript. Bundle je přenesen přes `SSH` na cílový host, kde se následně provede `docker login`, `docker compose pull` a `docker compose up -d --remove-orphans`. Cílový server proto nepotřebuje pracovní checkout repozitáře; postačuje mu Docker, `Docker Compose` plugin, runtime konfigurace a přístup do interní registry.

#figure(
  image(
    "../procesy/deployment/deployment-flow.svg",
    width: 100%,
  ),
  caption: [Obecný image-based release tok služby s distribucí do registry a nasazením na cílový host],
) <obr:deployment-flow>

U backendové části na tento obecný tok navazuje migrační quality gate. `migration` musí úspěšně dokončit změnu schématu ještě před startem `hr-backend`, jinak je nasazení ukončeno. U služeb vrstvy inteligentního zpracování dat zůstává princip shodný, ale deploy bundle navíc obsahuje runtime parametry pro přístup k `RabbitMQ`, `SeaweedFS`, `Apache Tika` a `Ollama`. Frontendy oproti tomu využívají hlavně build-time konfiguraci veřejných URL a analytiky.

Rollback je v tomto modelu realizován návratem ke staršímu release tagu a opětovným spuštěním Compose nad starším image. Výhodou image-based přístupu je, že rollback nevyžaduje nový build ze zdrojových kódů, ale pouze výběr dříve publikovaného artefaktu.

== Správa konfigurace a bezpečnost provozu
Konfiguraci služeb rozděluji do tří vrstev. První vrstvu tvoří build-time parametry frontendů, například veřejná URL API nebo parametry analytiky `Umami`, které vstupují přímo do sestavení výsledného image. Druhou vrstvu tvoří runtime konfigurace backendových, integračních a worker služeb, předávaná přes environment soubory na cílovém hostu. Třetí vrstvu představují server-only tajné údaje, které zůstávají mimo repozitář i mimo veřejně přenášené deploy bundle.

Tento model je důležitý z bezpečnostního hlediska. CI spravuje jen netajné parametry releasu a reference na image, zatímco citlivé hodnoty zůstávají odděleně na cílovém serveru. To se týká přístupových údajů k databázi, `RabbitMQ`, SMTP, objektovému úložišti i interním registrům. Interní služby současně používají oddělené neveřejné přístupové údaje pro vzájemnou komunikaci a integrační vazby. U vrstvy inteligentního zpracování dat obdobně odděluji netajnou runtime konfiguraci od tajných údajů pro `RabbitMQ` a `SeaweedFS`, aby release tok nezpřístupňoval citlivé provozní hodnoty.

== Dohledová vrstva
Dohledovou vrstvu provozuji odděleně od aplikační i výpočetní části vrstvy inteligentního zpracování dat. Tvoří ji `Promtail`, `Loki`, `Prometheus` a `Grafana`. Smyslem této vrstvy je soustředit provozní diagnostiku mimo business logiku a umožnit operátorům sledovat stav systému z jednoho místa.

Konkrétní role jednotlivých komponent dohledové vrstvy shrnuje @tab:deployment-observability; tato vrstva centralizuje logy, metriky a alerting mimo business logiku systému. `Umami` do ní nezařazuji, protože jde o analytickou službu aplikace, nikoli o nástroj provozního dohledu.

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
      [`Promtail`], [Sběr a předzpracování logů z kontejnerů], [Centralizovaná diagnostika bez zásahu do business logiky],
      [`Loki`], [Uložení a dotazování log streamů], [Rychlá analýza incidentů podle času a štítků],
      [`Prometheus`], [Sběr metrik a trendové vyhodnocení], [Podpora řízení dostupnosti a výkonu],
      [`Grafana`], [Vizualizace a upozornění], [Jednotné operátorské rozhraní pro logy i metriky],
    )
  ],
  caption: [Role komponent dohledové vrstvy],
) <tab:deployment-observability>

== Provozní omezení a mitigace
Navržený model nasazení představuje pragmatický kompromis mezi rychlostí implementace, provozní jednoduchostí a mírou infrastrukturní vyspělosti. Oproti jednodušší monolitické aplikaci přináší vyšší počet samostatných obrazů, více release artefaktů a nutnost koordinovat aplikační host s odděleným hostem vrstvy inteligentního zpracování dat. Provoz je navíc závislý na interním registru kontejnerových obrazů a na správné správě environment konfigurace na cílových serverech.

Další omezení plyne ze zvolené orchestrace pomocí `Docker Compose`. Tento přístup je dobře obhajitelný pro pilotní a menší produkční prostředí, ale neposkytuje vlastnosti běžné u vyšších orchestrátorů, například automatické rozložení zátěže mezi více uzly, nativní self-healing napříč hosty nebo deklarativní správu rozsáhlého clusteru. Část provozních rozhodnutí je navíc stále založena více na logové analýze než na plně formalizovaném modelu `SLO`, protože pokrytí všech komponent metrikami se průběžně rozšiřuje.

Tato omezení zmírňuji kombinací několika opatření. Jednotný image-based `CI/CD` model s release tagy zjednodušuje build, distribuci i rollback. `Healthcheck`y a migrační quality gate snižují riziko startu nefunkční verze. Oddělení tajných údajů od deploy bundle omezuje expozici citlivých hodnot. Samostatná dohledová vrstva a centralizace logů zase zlepšují diagnostiku incidentů v distribuovaném prostředí. Výsledný model proto považuji za přiměřený pro cílový on-premise provoz v podmínkách #abbr("KZ", none).
