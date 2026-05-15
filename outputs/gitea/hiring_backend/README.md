# Hiring Backend

Backendova cast systemu pro spravu naboru, uchazecu a onboardingu zamestnancu ve zdravotnickem prostredi. Aplikace poskytuje REST API pro verejny karierni portal a administracni/onboarding rozhrani, uklada data do PostgreSQL, soubory do S3-kompatibilniho uloziste SeaweedFS a pro vybrane asynchronni ulohy pouziva outbox a RabbitMQ.

## Poznamka k overeni inteligentnich funkci

Jelikoz orchestrace celeho projektu muze byt narocna, zejmena u inteligentnich vrstev napojenych na dalsi sluzby, doporucuji vybrane AI funkce overit take primo na produkcnim portalu pomoci poskytnutych pristupovych udaju. Typicky jde napriklad o generativni tvorbu nabidky pracovni pozice nebo analyzu zivotopisu uchazece.

Lokalni spusteni backendu a infrastruktury je popsane nize, ale produkcni prostredi je pro rychle funkcni overeni techto casti nejjednodussi a nejvernejsi varianta.

### Lokalni setup Ollama pro AI funkce

AI casti projektu pouzivaji lokalni Ollama server. Backend sam o sobe model nespousti; vola navazujici sluzby `cv_processor` a `job_processor`, ktere nasledne komunikuji s Ollamou pres HTTP API.

Ollamu lze stahnout z oficialni stranky:

```text
https://ollama.com/download
```

Na macOS ji lze nainstalovat take pres Homebrew:

```bash
brew install ollama
```

Na Linuxu lze pouzit oficialni instalacni skript:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Na Windows je nejjednodussi pouzit instalator z oficialni stranky. Po instalaci overte dostupnost prikazu:

```bash
ollama --version
```

Alternativne lze Ollamu spustit v Dockeru:

```bash
docker volume create ollama
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama
```

Modely se pak stahuji uvnitr kontejneru:

```bash
docker exec -it ollama ollama pull llama3.1:8b
docker exec -it ollama ollama pull nomic-embed-text
```

Pokud maji `cv_processor` nebo `job_processor` bezet ve stejne Docker siti jako kontejner `ollama`, pripojte Ollamu do teto site:

```bash
docker network connect app-network ollama
```

V takovem pripade lze ve sluzbach pouzit `OLLAMA_URL=http://ollama:11434`. Pokud procesory bezi lokalne na hostu a Ollama je v Dockeru s mapovanym portem `11434`, pouzijte `OLLAMA_URL=http://localhost:11434`.

Pri instalaci Ollamy primo na hosta se modely stahuji takto:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

`llama3.1:8b` slouzi jako generativni model pro analyzu CV a tvorbu/upravy nabidek. `nomic-embed-text` slouzi pro embeddingy pri semantickem porovnavani textu.

Pri instalaci primo na hosta se Ollama spousti prikazem:

```bash
ollama serve
```

Na macOS a Linuxu muze Ollama bezet take jako systemova/sluzbova aplikace. Pri Docker variante uz server bezi v kontejneru `ollama`. Dostupnost lze overit:

```bash
curl http://localhost:11434/api/tags
```

Pro sluzby spustene primo na hostu nastavte:

```env
OLLAMA_URL=http://localhost:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
```

Pokud `cv_processor` nebo `job_processor` bezi v Docker kontejneru a Ollama bezi na hostitelskem systemu, pouzijte na Docker Desktopu:

```env
OLLAMA_URL=http://host.docker.internal:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
```

Pokud je Ollama spustena jako samostatna sluzba ve stejne Docker siti pod nazvem `ollama`, pouzijte:

```env
OLLAMA_URL=http://ollama:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
```

Rychly smoke test generovani:

```bash
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1:8b","prompt":"Napis jednu vetu cesky.","stream":false}'
```

Rychly smoke test embedding modelu:

```bash
curl http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","prompt":"test"}'
```

Pro slabsi lokalni stroj lze pouzit mensi generativni model, ale v tom pripade je nutne nastavit stejnou hodnotu v `MODEL_USED` pro `cv_processor` i `job_processor`. Kvalita vystupu se muze oproti produkcnimu prostredi lisit.

### Spusteni navazujicich AI sluzeb

Samotny `hiring_backend` poskytuje API a publikuje udalosti, ale inteligentni funkce jsou rozdelene do dalsich sluzeb v exportu:

- `outputs/gitea/cv_processor` - asynchronni analyza CV, extrakce textu pres Tiku, vyhodnoceni pres Ollamu a publikace vysledku pres RabbitMQ
- `outputs/gitea/job_processor` - generativni tvorba, extrakce a upravy nabidky pracovni pozice pres Ollamu

#### cv_processor

Minimalni `.env` pro lokalni spusteni `cv_processor` na hostitelskem systemu. Soubor ulozte jako `outputs/gitea/cv_processor/.env`:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
S3_ENDPOINT=http://localhost:8444
S3_ACCESS_KEY=admin
S3_SECRET_KEY=admin
TIKA_URL=http://localhost:9998
OLLAMA_URL=http://localhost:11434
MODEL_USED=llama3.1:8b
```

Pokud `cv_processor` bezi v Dockeru a zavisle sluzby jsou ve stejne Docker siti, pouzijte v `outputs/gitea/cv_processor/.env` adresy podle nazvu kontejneru:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
S3_ENDPOINT=http://seaweedfs:8444
S3_ACCESS_KEY=admin
S3_SECRET_KEY=admin
TIKA_URL=http://tika:9998
OLLAMA_URL=http://ollama:11434
MODEL_USED=llama3.1:8b
```

Lokalni spusteni:

```bash
cd outputs/gitea/cv_processor
go mod download
go run ./cmd/worker
```

Spusteni pres Docker Compose ze slozky `cv_processor`:

```bash
cd outputs/gitea/cv_processor
docker network create kz || true
docker compose up -d --build
```

Compose soubor teto sluzby pouziva externi sit `kz`. Pokud RabbitMQ, SeaweedFS nebo Ollama bezi jako kontejnery z jine compose sestavy, pripojte je do site `kz`, napriklad:

```bash
docker network connect kz rabbitmq
docker network connect kz seaweedfs
docker network connect kz ollama
```

Pokud Ollama bezi v Dockeru, ale neni ve stejne siti jako `cv_processor`, nastavte misto toho `OLLAMA_URL=http://host.docker.internal:11434`.

#### job_processor

Minimalni `.env` pro lokalni spusteni `job_processor` na hostitelskem systemu. Soubor ulozte jako `outputs/gitea/job_processor/.env`:

```env
OLLAMA_URL=http://localhost:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
PORT=8090
LOG_LEVEL=info
```

Varianta pro Docker kontejner ve stejne siti jako Ollama, opet jako `outputs/gitea/job_processor/.env`:

```env
OLLAMA_URL=http://ollama:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
PORT=8090
LOG_LEVEL=info
JOB_PROCESSOR_PORT=8090
```

Lokalni spusteni:

```bash
cd outputs/gitea/job_processor
go mod download
go run ./cmd/server
```

Spusteni pres Docker Compose ze slozky `job_processor`:

```bash
cd outputs/gitea/job_processor
docker network create kz || true
docker compose up -d --build
```

Health check:

```bash
curl http://localhost:8090/health
```

Ocekavana odpoved:

```text
OK
```

Backend vola `job_processor` pres promennou `JOB_CHAT_URL`. Pri lokalnim spusteni `job_processor` nastavte v `.env` backendu:

```env
JOB_CHAT_URL=http://localhost:8090
```

Pokud `hiring_backend` bezi v Dockeru a `job_processor` je ve stejne Docker siti, pouzijte:

```env
JOB_CHAT_URL=http://job-processor:8090
```

## Technologicky prehled

- Node.js 22, Express 5
- PostgreSQL 17 s rozsirenim pgvector
- Raw SQL migrace ve slozce `src/database/migrations`
- SeaweedFS jako S3-kompatibilni uloziste souboru
- RabbitMQ pro asynchronni zpracovani udalosti a CV pipeline
- Pino logging, OpenTelemetry metriky/tracing
- Jest pro jednotkove a integracni testy
- Docker Compose pro lokalni i serverovou orchestrace

## Struktura projektu

```text
src/
  adapters/      vstupni a vystupni adaptery
  app.js         sestaveni Express aplikace
  core/          migrovane use-casy, domeny a porty
  database/      migracni runner a SQL migrace
  domain/        legacy domenove moduly: controller, service, repository
  middlewares/   auth, error handling, access log
  platform/      DB, email, storage, audit, outbox, RabbitMQ, logger
  routes/        verejne, admin a employee route mounty
  shared/        sdilene helpery, authz SQL, soubory, email sablony
services/
  qualification-adapter/
  user-search-adapter/
tests/
  jednotkove a architekturni testy
tests-integration/
  integracni testy
```

Importy v kodu pouzivaji aliasy z `package.json`, napriklad `@platform`, `@domain`, `@shared`, `@middlewares` a `@routes`.

## Hlavni funkcionalita

- sprava pracovnich pozic, uchazecu a stavu vyberoveho rizeni
- prevod uchazece na zamestnance a prirazeni onboarding workflow
- sprava onboardingu, formularu a dokumentu
- role a pristupy pro `super_admin`, `admin`, `hr`, `authorized_person` a `user`
- ReBAC autorizace nad organizacemi a pracovnimi pozicemi pres tabulku `resource_permissions`
- planovani pohovoru vcetne e-mailu a iCalendar priloh
- notifikace, chat a prace s prilohami
- outbox pro spolehlive doruceni vedlejsich efektu, napriklad e-mailu a publish udalosti

## Pozadavky

- Node.js 22.x
- npm
- Docker a Docker Compose
- volne porty podle `.env`, typicky:
  - backend: `PORT -> INTERNAL_PORT`
  - PostgreSQL: `5432`
  - SeaweedFS S3 API: `8444`
  - RabbitMQ: `5672`, management UI `15672`

Pred spustenim pres `docker compose` je potreba vytvorit externi site, pokud na stroji jeste neexistuji:

```bash
docker network create app-network
docker network create monitoring_network
```

## Rychle spusteni pres Docker Compose

1. Nainstalujte zavislosti pro lokalni praci:

```bash
npm ci
```

2. Vytvorte soubor `.env` v koreni projektu podle kapitoly `.env.example`.

3. Spustte sluzby:

```bash
docker compose up -d --build
```

Compose spusti PostgreSQL, migracni kontejner, SeaweedFS, adaptery a backend. Migrace bezi pred startem backendu.

4. Overte health check:

```bash
curl http://localhost:3322/hrbackend/health
```

Ocekavana odpoved:

```text
OK
```

Pokud je v `.env` nastaveno `PORT=3322` a `INTERNAL_PORT=3322`, backend je dostupny na `http://localhost:3322`.

## Lokalni vyvojovy rezim

Pro vyvoj lze spustit infrastrukturu v Dockeru a Node aplikaci lokalne:

```bash
npm run dev:local:infra-up
npm run dev:local:migrate
npm run dev
```

Plne automatizovany lokalni rezim:

```bash
npm run dev:local:up
```

Zastaveni:

```bash
npm run dev:local:down
```

Stav a logy:

```bash
npm run dev:local:status
npm run dev:local:logs
```

## Migrace databaze

Migrace jsou SQL soubory v `src/database/migrations/` a spousti se v abecednim poradi. Runner si vede evidenci v tabulce `migrations`.

```bash
npm run db:migrate
```

Migrace s `CONCURRENTLY` se spousti mimo transakci, ostatni migrace jsou transakcni.

## Testy a kontroly

```bash
npm test
npm run test:smoke
npm run test:integration
npm run lint
npm run check
```

`npm run check` kombinuje lint, jednotkove testy, architekturni kontroly a kontrolu OpenAPI vystupu.

## Vybrane endpointy

Zakladni prefix API je `API_PREFIX`, vychozi hodnota je `/api/v1`.

- `GET /hrbackend/health` - health check bez autentizace
- `/api/v1/jobs` - verejne pracovni pozice
- `/api/v1/organizations` - verejne informace o organizacich
- `/api/v1/auth` - prihlaseni, odhlaseni, informace o uzivateli
- `/api/v1/admin/*` - administracni cast, vyzaduje role `admin` nebo `hr`
- `/api/v1/employee/*` - zamestnanecka cast, vyzaduje prihlaseni
- `/api/v1/chat` - prime zpravy mezi HR a zamestnanci
- `/api/v1/notifications` - notifikace

## Autentizace a autorizace

Autentizace pouziva JWT token v HTTP-only cookie `auth_token`. Token obsahuje identitu uzivatele a zakladni organizacni kontext.

Autorizace dat je resena explicitne pres ReBAC:

- zdrojem pravd pro cteni, upravy a mazani je `resource_permissions`
- top-level opravneni se materializuji pro `organization` a `job_posting`
- child entity dedi pristup pres parent resource v SQL dotazech
- pri nenalezeni nebo nedostatecnem pristupu ke scoped resource se vraci `404`
- explicitni create/admin guardy mohou vracet `403`

Podrobnosti jsou v `docs/rebac-authorization.md`.

## Ukladani souboru

Uploady se zpracovavaji pres Multer v pameti a nasledne se ukladaji do SeaweedFS pres S3 API. Do databaze se uklada S3 object key, napriklad `applicant-attachments/attachment-uuid.pdf`.

Pouzivane buckety:

- `attachments`
- `chat-files`
- `documents`
- `templates`
- `cv-uploads`
- `public-organization-photos`

## .env.example

Nasledujici ukazka je urcena pro lokalni spusteni a oponentni kontrolu. Produkcni tajemstvi musi byt nahrazena skutecnymi hodnotami a nesmi byt verzovana.

```env
# Runtime
NODE_ENV=development
APP_ENV=local
API_PREFIX=/api/v1
INTERNAL_PORT=3322
PORT=3322
FRONTEND_URL=http://localhost:3000

# PostgreSQL
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=hrdb
POSTGRES_USER=admin
POSTGRES_PASSWORD=change-me

# Auth / JWT
JWT_SECRET=replace-with-long-random-secret
AUTH_HTTP_TIMEOUT_MS=8000
AUTH_DUO_CLIENT_ID=replace-me
AUTH_DUO_CLIENT_SECRET=replace-me
AUTH_DUO_TOKEN_URI=https://example.duosecurity.com/oidc/client-id/token
AUTH_DUO_ISSUER=https://example.duosecurity.com/oidc/client-id
AUTH_DUO_ALLOWED_REDIRECT_URIS=http://localhost:3000/auth/callback
AUTH_UCP_API_URL=https://ucp.example.local/api/mobile
AUTH_UCP_MODULE=mobile-api-pzm
AUTH_UCP_FUNCTION=GetUserInfoForHRBackend
AUTH_UCP_INSECURE_TLS=false

# SeaweedFS / S3
S3_ENDPOINT=http://seaweedfs:8444
S3_ACCESS_KEY=admin
S3_SECRET_KEY=admin
PUBLIC_S3_BASE_URL=http://localhost:8444

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
RABBIT_CONSUMERS_REQUIRED=false
RABBIT_CONSUMER_PREFETCH=5
RABBIT_CONSUMER_MAX_ATTEMPTS=5
RABBIT_CONSUMER_RETRY_BASE_MS=1000
RABBIT_CONSUMER_RETRY_MAX_MS=300000
RABBIT_CONSUMER_CONNECT_RETRY_BASE_MS=1000
RABBIT_CONSUMER_CONNECT_RETRY_MAX_MS=30000

# E-mail
EMAIL_HOST=smtp.example.local
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@example.local
EMAIL_PASSWORD=change-me
EMAIL_FROM="Hiring Backend <noreply@example.local>"

# Outbox
SIDE_EFFECT_OUTBOX_ENABLED=true
SIDE_EFFECT_OUTBOX_WORKER_ENABLED=true
SIDE_EFFECT_OUTBOX_BATCH_SIZE=20
SIDE_EFFECT_OUTBOX_POLL_INTERVAL_MS=2000
SIDE_EFFECT_OUTBOX_LOCK_TIMEOUT_SEC=120
SIDE_EFFECT_OUTBOX_MAX_ATTEMPTS=8
SIDE_EFFECT_OUTBOX_RETRY_BASE_MS=1000
SIDE_EFFECT_OUTBOX_RETRY_MAX_MS=300000
SIDE_EFFECT_OUTBOX_INLINE_ATTACHMENT_MAX_BYTES=262144
SIDE_EFFECT_OUTBOX_ENCRYPTION_KEY=replace-with-32-byte-hex-or-base64-key
OUTBOX_REPLAY_MAX_EXECUTE=100
OUTBOX_ALERT_OLDEST_PENDING_SEC=900
OUTBOX_ALERT_OLDEST_PROCESSING_SEC=600
OUTBOX_ALERT_DEAD_COUNT=50

# Audit
AUDIT_ENABLED=true
AUDIT_TRANSPORT=rabbitmq
AUDIT_FALLBACK_TO_DB=false
AUDIT_FAILURE_POLICY=best_effort_non_blocking
AUDIT_EXCHANGE=audit_events
AUDIT_QUEUE=audit_writer
AUDIT_ROUTING_KEY=audit.event
AUDIT_DEAD_ROUTING_KEY=audit.event.dead
AUDIT_INCLUDE_STATE=false
AUDIT_INCLUDE_STATE_ON_FAILURE=true
AUDIT_MAX_STATE_BYTES=16384
AUDIT_STATE_RESOURCE_TYPES=
AUDIT_HTTP_INCLUDE_READS=false

# Idempotency
COMMAND_IDEMPOTENCY_ENABLED=true
COMMAND_IDEMPOTENCY_CLEANUP_ENABLED=true
COMMAND_IDEMPOTENCY_TTL_SEC=86400
COMMAND_IDEMPOTENCY_LOCK_TIMEOUT_SEC=120
COMMAND_IDEMPOTENCY_CLEANUP_INTERVAL_MS=3600000
COMMAND_IDEMPOTENCY_CLEANUP_BATCH_SIZE=500

# Qualification adapter
QUAL_ADAPTER_BASE_URL=http://qualification-adapter:8088
QUAL_ADAPTER_AUTH_TOKEN=replace-me
QUAL_ADAPTER_TIMEOUT_MS=5000
QUAL_ADAPTER_IRIS_HOST=iris.example.local
QUAL_ADAPTER_IRIS_PORT=1972
QUAL_ADAPTER_IRIS_NS=USER
QUAL_ADAPTER_IRIS_USER=replace-me
QUAL_ADAPTER_IRIS_PASSWORD=replace-me
QUAL_ADAPTER_IRIS_CLASS=UCP.UZIS.ApiTest
QUAL_ADAPTER_IRIS_METHOD_BY_NRZP=GetByNrzp
QUAL_ADAPTER_IRIS_METHOD_BY_RC=GetByBirthNumber
QUAL_ADAPTER_IRIS_TIMEOUT_MS=8000

# User search adapter
USER_SEARCH_ADAPTER_BASE_URL=http://user-search-adapter:8089
USER_SEARCH_ADAPTER_AUTH_TOKEN=replace-me
USER_SEARCH_ADAPTER_TIMEOUT_MS=5000
USER_SEARCH_ADAPTER_IRIS_HOST=iris.example.local
USER_SEARCH_ADAPTER_IRIS_PORT=1972
USER_SEARCH_ADAPTER_IRIS_NS=USER
USER_SEARCH_ADAPTER_IRIS_USER=replace-me
USER_SEARCH_ADAPTER_IRIS_PASSWORD=replace-me
USER_SEARCH_ADAPTER_IRIS_CLASS=UCP.UZIS.ApiTest
USER_SEARCH_ADAPTER_IRIS_METHOD_SEARCH=SearchUsers
USER_SEARCH_ADAPTER_IRIS_TIMEOUT_MS=8000

# AI/CV integrations, optional for local review
TIKA_URL=http://tika:9998
OLLAMA_URL=http://ollama:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
JOB_CHAT_URL=http://job-processor:8090

# Umami analytics, optional
UMAMI_POSTGRES_DB=umami
UMAMI_POSTGRES_USER=umami
UMAMI_POSTGRES_PASSWORD=change-me
UMAMI_APP_SECRET=replace-with-random-secret
UMAMI_LOCAL_PORT=3003
UMAMI_INIT_BASE_URL=http://umami:3000
UMAMI_INIT_ADMIN_USERNAME=admin
UMAMI_INIT_ADMIN_PASSWORD=umami
UMAMI_INIT_WEBSITE_ID=
UMAMI_INIT_WEBSITE_NAME=Hiring
UMAMI_INIT_WEBSITE_DOMAIN=localhost

# Logging / observability
LOG_LEVEL=debug
LOG_QUERY=false
LOG_PRETTY=true
LOG_INCLUDE_STACK=true
LOG_HTTP_ACCESS_MODE=errors_and_slow
LOG_HTTP_SLOW_MS=2000
OTEL_ENABLED=false
OTEL_SERVICE_NAME=hiring-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4318
METRICS_OPENMETRICS=false
METRICS_REFRESH_MS=15000

# File housekeeping
FILE_RETENTION_DAYS=30
```

Pro lokalni beh mimo Docker je obvykle potreba zmenit hosty z nazvu kontejneru na localhost:

```env
POSTGRES_HOST=localhost
S3_ENDPOINT=http://localhost:8444
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
QUAL_ADAPTER_BASE_URL=http://127.0.0.1:8088
USER_SEARCH_ADAPTER_BASE_URL=http://127.0.0.1:8089
```

## Nejbeznejsi problemy pri spusteni

- `network app-network declared as external, but could not be found` - vytvorte sit prikazem `docker network create app-network`.
- `network monitoring_network declared as external, but could not be found` - vytvorte sit prikazem `docker network create monitoring_network`.
- Backend nenastartuje kvuli databazi - zkontrolujte `POSTGRES_*` promenne a stav kontejneru `postgres-db`.
- Upload nebo download souboru selhava - zkontrolujte `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` a health SeaweedFS.
- RabbitMQ consumer chybi - pro lokalni review lze nastavit `RABBIT_CONSUMERS_REQUIRED=false`.

## Uklid prostredi

```bash
docker compose down -v --remove-orphans
```

Tento prikaz smaze i Docker volumes, tedy i lokalni databazi a ulozene soubory.
