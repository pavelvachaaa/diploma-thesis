# Odevzdane zdrojove kody a lokalni spusteni

Tento adresar obsahuje export zdrojovych kodu projektu k diplomove praci. Cilem tohoto README je mit vsechny prakticke informace na jednom miste: co je v jednotlivych slozkach, v jakem poradi sluzby spoustet, kam patri `.env` soubory a jak overit hlavni casti systemu.

Tento soubor je primarni navod pro odevzdanou práci. README soubory uvnitr jednotlivych projektu jsou ponechane jako projektove doplnky, ale prakticke orchestrace celeho systemu je soustredena zde.

## Contents

- [Rychla orientace](#rychla-orientace)
- [Doporucene overeni inteligentnich funkci](#doporucene-overeni-inteligentnich-funkci)
- [Predpoklady](#predpoklady)
- [Docker site](#docker-site)
- [Ollama a modely](#ollama-a-modely)
- [Doporucene poradi lokalniho spusteni](#doporucene-poradi-lokalniho-spusteni)
- [hiring_backend](#hiring_backend)
- [job_processor](#job_processor)
- [cv_processor](#cv_processor)
- [audit_writer_processor](#audit_writer_processor)
- [kariera.kzcr.eu](#karierakzcreu)
- [onboarding.kzcr.eu](#onboardingkzcreu)
- [observability](#observability)
- [Kontrolni prikazy](#kontrolni-prikazy)
- [Uklid prostredi](#uklid-prostredi)

## Rychla orientace

Zdrojove kody jsou ulozene ve slozce `outputs/gitea`:

| Slozka | Ucel | Typ |
|---|---|---|
| `outputs/gitea/hiring_backend` | hlavni Node.js/Express API, databazove migrace, ReBAC autorizace, uploady, e-maily, outbox | Node.js |
| `outputs/gitea/job_processor` | generativni tvorba a upravy pracovnich nabidek pres Ollamu | Go HTTP service |
| `outputs/gitea/cv_processor` | asynchronni analyza zivotopisu, Tika, Ollama, RabbitMQ | Go worker |
| `outputs/gitea/audit_writer_processor` | zapis auditnich udalosti z RabbitMQ do PostgreSQL | Go worker |
| `outputs/gitea/kariera.kzcr.eu` | verejny karierni portal | Next.js |
| `outputs/gitea/onboarding.kzcr.eu` | administracni a zamestnanecky onboarding frontend | Next.js |
| `outputs/gitea/observability` | Grafana, Alloy, Loki, Prometheus, Tempo | Docker Compose |

Ukazkove `.env` bloky v tomto dokumentu nejsou samostatne soubory. Pri spusteni je zkopirujte do konkretni slozky dane sluzby jako `.env`, napr. backendovy `.env.example` patri do:

```text
outputs/gitea/hiring_backend/.env
```

Stejne pravidlo plati pro dalsi sluzby:

```text
outputs/gitea/job_processor/.env
outputs/gitea/cv_processor/.env
outputs/gitea/audit_writer_processor/.env
outputs/gitea/kariera.kzcr.eu/.env
outputs/gitea/onboarding.kzcr.eu/.env
outputs/gitea/observability/.env
```

## Doporucene overeni inteligentnich funkci

Orchestrace celeho systemu muze byt narocna, zejmena u inteligentnich vrstev napojenych na Ollamu, Tiku, RabbitMQ, SeaweedFS a navazujici Go procesory. Pro rychle funkcni overeni doporucuji vybrane AI funkce vyzkouset take primo na produkcnim portalu pomoci poskytnutych pristupovych udaju.

Typicky jde o:

- generativni tvorbu nabidky pracovni pozice
- upravy textu nabidky
- analyzu zivotopisu uchazece
- semanticke porovnani kandidata s pozici

Lokalni spusteni je popsane nize, ale produkcni prostredi je pro rychle overeni techto casti nejjednodussi a nejvernejsi varianta.

## Predpoklady

- Docker a Docker Compose plugin
- Node.js 22.x a npm
- Go 1.24+ pro lokalni beh Go sluzeb bez Dockeru
- Ollama, pokud se maji lokalne overovat AI funkce
- volne porty podle zvolene konfigurace, typicky `3322`, `3010`, `3011`, `8090`, `8444`, `5432`, `5672`, `9998`, `11434`, `4000`

## Docker site

Nektere compose soubory pocitaji s existujicimi externimi Docker sitemi. Pred spustenim je vytvorte:

```bash
docker network create app-network 2>/dev/null || true
docker network create monitoring_network 2>/dev/null || true
docker network create adapter-internal 2>/dev/null || true
docker network create kz 2>/dev/null || true
```

`app-network` pouziva backend, frontend a audit writer. `monitoring_network` pouziva observability stack. `kz` pouzivaji samostatne Go procesory `cv_processor` a `job_processor`.

## Ollama a modely

AI casti projektu pouzivaji Ollama server. Backend model primo nespousti; vola `job_processor` a publikuje udalosti pro `cv_processor`, ktere nasledne komunikuji s Ollamou pres HTTP API.

### Instalace na hosta

Ollamu lze stahnout z oficialni stranky:

```text
https://ollama.com/download
```

Na macOS lze pouzit Homebrew:

```bash
brew install ollama
```

Na Linuxu lze pouzit oficialni instalacni skript:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Na Windows pouzijte instalator z oficialni stranky. Po instalaci overte:

```bash
ollama --version
```

Stazeni modelu:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Spusteni serveru, pokud nebezi jako systemova aplikace:

```bash
ollama serve
```

### Ollama v Dockeru

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

Pokud maji Go procesory bezet ve stejne Docker siti jako Ollama:

```bash
docker network connect kz ollama 2>/dev/null || true
docker network connect app-network ollama 2>/dev/null || true
```

### Overeni Ollamy

```bash
curl http://localhost:11434/api/tags
```

Smoke test generovani:

```bash
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1:8b","prompt":"Napis jednu vetu cesky.","stream":false}'
```

Smoke test embedding modelu:

```bash
curl http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"nomic-embed-text","prompt":"test"}'
```

Pro slabsi lokalni stroj lze pouzit mensi generativni model, ale potom je nutne nastavit stejnou hodnotu `MODEL_USED` v `cv_processor` i `job_processor`. Kvalita vystupu se muze oproti produkcnimu prostredi lisit.

## Doporucene poradi lokalniho spusteni

Minimalni cesta pro overeni celeho stacku:

1. Vytvorte Docker site podle kapitoly [Docker site](#docker-site).
2. Spustte Ollamu a stahnete modely podle kapitoly [Ollama a modely](#ollama-a-modely).
3. Vytvorte `outputs/gitea/hiring_backend/.env` podle kapitoly [hiring_backend](#hiring_backend).
4. Spustte backendovy stack:

```bash
cd outputs/gitea/hiring_backend
docker compose up -d --build
```

5. Vytvorte a spustte `job_processor`, pokud chcete testovat generativni tvorbu nabidek.
6. Vytvorte a spustte `cv_processor`, pokud chcete testovat analyzu CV.
7. Vytvorte a spustte `audit_writer_processor`, pokud chcete samostatne zpracovavat auditni frontu.
8. Spustte frontendy `kariera.kzcr.eu` a `onboarding.kzcr.eu`.
9. Volitelne spustte `observability`.

Jednotlive `.env` ukazky a prikazy jsou v nasledujicich kapitolach.

## hiring_backend

Slozka:

```text
outputs/gitea/hiring_backend
```

Backend poskytuje REST API, databazove migrace, autentizaci, ReBAC autorizaci, upload souboru do SeaweedFS, e-maily, notifikace, chat a outbox.

### Spusteni

```bash
cd outputs/gitea/hiring_backend
npm ci
docker compose up -d --build
```

Compose spousti PostgreSQL, migrace, SeaweedFS, adaptery, backend a volitelne navazujici infrastrukturu podle konfigurace.

Health check:

```bash
curl http://localhost:3322/hrbackend/health
```

Ocekavana odpoved:

```text
OK
```

### Kam patri `.env.example`

Nasledujici blok ulozte jako:

```text
outputs/gitea/hiring_backend/.env
```

Hodnoty `change-me` a `replace-me` jsou pouze lokalni zastupne hodnoty. Produkcni tajemstvi se do repozitare ani do odevzdavanych zdrojovych kodu neukladaji.

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

# AI integrations
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

Pokud backend spoustite primo na hostu mimo Docker, zmente zejmena:

```env
POSTGRES_HOST=localhost
S3_ENDPOINT=http://localhost:8444
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
QUAL_ADAPTER_BASE_URL=http://127.0.0.1:8088
USER_SEARCH_ADAPTER_BASE_URL=http://127.0.0.1:8089
JOB_CHAT_URL=http://localhost:8090
```

## job_processor

Slozka:

```text
outputs/gitea/job_processor
```

Sluzba poskytuje HTTP API pro generativni tvorbu, extrakci a upravy pracovnich nabidek. Backend ji vola pres `JOB_CHAT_URL`.

### `.env` pro lokalni beh na hostu

Ulozte jako `outputs/gitea/job_processor/.env`:

```env
OLLAMA_URL=http://localhost:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
PORT=8090
LOG_LEVEL=info
```

Spusteni bez Dockeru:

```bash
cd outputs/gitea/job_processor
go mod download
go run ./cmd/server
```

### `.env` pro Docker

Ulozte jako `outputs/gitea/job_processor/.env`:

```env
OLLAMA_URL=http://ollama:11434
MODEL_USED=llama3.1:8b
NUM_CTX=16384
PORT=8090
LOG_LEVEL=info
JOB_PROCESSOR_PORT=8090
```

Spusteni pres Docker Compose:

```bash
cd outputs/gitea/job_processor
docker network create kz 2>/dev/null || true
docker compose up -d --build
```

Pokud Ollama bezi v Dockeru, pripojte ji do site `kz`:

```bash
docker network connect kz ollama 2>/dev/null || true
```

Health check:

```bash
curl http://localhost:8090/health
```

Ocekavana odpoved:

```text
OK
```

Backendovy `.env` musi obsahovat:

```env
JOB_CHAT_URL=http://localhost:8090
```

nebo pri Docker sitich:

```env
JOB_CHAT_URL=http://job-processor:8090
```

## cv_processor

Slozka:

```text
outputs/gitea/cv_processor
```

Worker konzumuje udalosti z RabbitMQ, stahuje CV ze SeaweedFS, extrahuje text pres Apache Tika, analyzuje obsah pres Ollamu a publikuje vysledek zpet do RabbitMQ.

### `.env` pro lokalni beh na hostu

Ulozte jako `outputs/gitea/cv_processor/.env`:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
S3_ENDPOINT=http://localhost:8444
S3_ACCESS_KEY=admin
S3_SECRET_KEY=admin
TIKA_URL=http://localhost:9998
OLLAMA_URL=http://localhost:11434
MODEL_USED=llama3.1:8b
```

Pokud Tika nebezi, lze ji spustit samostatne:

```bash
docker run -d --name tika -p 9998:9998 apache/tika:3.3.0.0
```

Spusteni bez Dockeru:

```bash
cd outputs/gitea/cv_processor
go mod download
go run ./cmd/worker
```

### `.env` pro Docker

Ulozte jako `outputs/gitea/cv_processor/.env`:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
S3_ENDPOINT=http://seaweedfs:8444
S3_ACCESS_KEY=admin
S3_SECRET_KEY=admin
TIKA_URL=http://tika:9998
OLLAMA_URL=http://ollama:11434
MODEL_USED=llama3.1:8b
```

Spusteni pres Docker Compose:

```bash
cd outputs/gitea/cv_processor
docker network create kz 2>/dev/null || true
docker compose up -d --build
```

Compose soubor teto sluzby spousti i Apache Tika. Pokud RabbitMQ, SeaweedFS nebo Ollama bezi jako kontejnery z jine compose sestavy, pripojte je do site `kz`:

```bash
docker network connect kz rabbitmq 2>/dev/null || true
docker network connect kz seaweedfs 2>/dev/null || true
docker network connect kz ollama 2>/dev/null || true
```

Pokud Ollama bezi v Dockeru s mapovanym portem, ale neni ve stejne siti jako `cv_processor`, nastavte:

```env
OLLAMA_URL=http://host.docker.internal:11434
```

## audit_writer_processor

Slozka:

```text
outputs/gitea/audit_writer_processor
```

Worker konzumuje auditni udalosti z RabbitMQ a uklada je do tabulky `audit_events` v PostgreSQL.

### `.env`

Ulozte jako `outputs/gitea/audit_writer_processor/.env`:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
AUDIT_EXCHANGE=audit_events
AUDIT_QUEUE=audit_writer
AUDIT_ROUTING_KEY=audit.event
POSTGRES_URL=postgres://admin:change-me@db:5432/hrdb?sslmode=disable
AUDIT_AUTO_CREATE_TABLE=false
```

Pro lokalni beh mimo Docker upravte hosty:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
POSTGRES_URL=postgres://admin:change-me@localhost:5432/hrdb?sslmode=disable
```

Spusteni bez Dockeru:

```bash
cd outputs/gitea/audit_writer_processor
go mod download
go run ./cmd/worker
```

Spusteni pres Docker Compose:

```bash
cd outputs/gitea/audit_writer_processor
docker network create app-network 2>/dev/null || true
docker network create monitoring_network 2>/dev/null || true
docker compose up -d --build
```

## kariera.kzcr.eu

Slozka:

```text
outputs/gitea/kariera.kzcr.eu
```

Verejny karierni portal postaveny na Next.js. Cte verejna data z backendu, typicky pracovni pozice a organizace.

Pozor: hodnoty `NEXT_PUBLIC_*` jsou v Next.js zapececene do buildu. Pro nejjednodussi lokalni overeni pouzijte `npm run dev`. Pri Docker buildu musi byt tyto hodnoty predane uz pri sestaveni image.

### `.env`

Ulozte jako `outputs/gitea/kariera.kzcr.eu/.env`:

```env
NEXT_PUBLIC_BASE_API_URL_DEV=http://localhost:3322/api/v1
NEXT_PUBLIC_BASE_API_URL_PROD=http://localhost:3322/api/v1
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_UMAMI_ENABLED=false
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
NEXT_PUBLIC_UMAMI_DOMAINS=localhost
UMAMI_PROXY_TARGET=http://localhost:3003
NEXT_OUTPUT=
APP_VERSION=local
EXPRESS_BIND_HOST=127.0.0.1
EXPRESS_PORT=3010
NODE_MAX_OLD_SPACE_SIZE=256
```

Spusteni bez Dockeru:

```bash
cd outputs/gitea/kariera.kzcr.eu
npm ci
npm run dev
```

Vychozi Next dev server bezi na `http://localhost:3000`, pokud neni port obsazeny.

Spusteni pres Docker Compose:

```bash
cd outputs/gitea/kariera.kzcr.eu
docker network create app-network 2>/dev/null || true
docker compose build \
  --build-arg NEXT_PUBLIC_BASE_API_URL_PROD=http://localhost:3322/api/v1 \
  --build-arg NEXT_PUBLIC_BASE_PATH= \
  --build-arg NEXT_PUBLIC_UMAMI_ENABLED=false
docker compose up -d
```

Docker varianta mapuje aplikaci typicky na:

```text
http://127.0.0.1:3010
```

## onboarding.kzcr.eu

Slozka:

```text
outputs/gitea/onboarding.kzcr.eu
```

Administracni a zamestnanecky frontend postaveny na Next.js. Obsahuje HR administraci, onboarding zamestnance, praci s dokumenty, pohovory, chat a AI nastroje dostupne pres backend.

Pozor: hodnoty `NEXT_PUBLIC_*` jsou v Next.js zapececene do buildu. Pro nejjednodussi lokalni overeni pouzijte `npm run dev`. Pri Docker buildu musi byt tyto hodnoty predane uz pri sestaveni image.

### `.env`

Ulozte jako `outputs/gitea/onboarding.kzcr.eu/.env`:

```env
NEXT_PUBLIC_BASE_API_URL_DEV=http://localhost:3322/api/v1
NEXT_PUBLIC_BASE_API_URL_PROD=http://localhost:3322/api/v1
NEXT_PUBLIC_REDIRECT_URI_DEV=http://localhost:3000/oauth/callback
NEXT_PUBLIC_REDIRECT_URI_PROD=http://localhost:3011/oauth/callback
NEXT_PUBLIC_REGULAR_LOGIN_URL_PROD=http://localhost:3011/login
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_APP_VERSION=local
APP_VERSION=local
FRONTEND_BIND_HOST=127.0.0.1
FRONTEND_PORT=3011
NODE_MAX_OLD_SPACE_SIZE=512
FRONTEND_MEMORY_LIMIT=1g
FRONTEND_MEMORY_SWAP_LIMIT=1g
```

Spusteni bez Dockeru:

```bash
cd outputs/gitea/onboarding.kzcr.eu
npm ci
npm run dev
```

Vychozi Next dev server bezi na `http://localhost:3000`, pokud neni port obsazeny.

Spusteni pres Docker Compose:

```bash
cd outputs/gitea/onboarding.kzcr.eu
docker network create app-network 2>/dev/null || true
docker compose build \
  --build-arg NEXT_PUBLIC_BASE_API_URL_PROD=http://localhost:3322/api/v1 \
  --build-arg NEXT_PUBLIC_REDIRECT_URI_PROD=http://localhost:3011/oauth/callback \
  --build-arg NEXT_PUBLIC_REGULAR_LOGIN_URL_PROD=http://localhost:3011/login \
  --build-arg NEXT_PUBLIC_BASE_PATH=
docker compose up -d
```

Docker varianta mapuje aplikaci typicky na:

```text
http://127.0.0.1:3011
```

## observability

Slozka:

```text
outputs/gitea/observability
```

Observability stack obsahuje Grafana Alloy, Loki, Prometheus, Tempo, Grafana a Postgres exporter. Slouzi pro logy, metriky a tracing.

### `.env`

Ulozte jako `outputs/gitea/observability/.env`:

```env
GRAFANA_BIND_HOST=127.0.0.1
GRAFANA_LOCAL_PORT=4000
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=change-me
GF_SERVER_ROOT_URL=http://localhost:4000

POSTGRES_EXPORTER_DSN=postgresql://admin:change-me@postgres-db:5432/hrdb?sslmode=disable
PG_EXPORTER_AUTO_DISCOVER_DATABASES=false

EMAIL_USER=noreply@example.local
EMAIL_PASSWORD=change-me
EMAIL_FROM=noreply@example.local
GF_SMTP_ENABLED=false
GF_SMTP_HOST=smtp.example.local:587
GF_SMTP_FROM_NAME=Grafana Alerts

ALLOY_VERSION=latest
LOKI_VERSION=latest
PROMETHEUS_VERSION=latest
TEMPO_VERSION=2.7.1
GRAFANA_VERSION=latest
POSTGRES_EXPORTER_VERSION=latest

ALLOY_BIND_HOST=127.0.0.1
ALLOY_UI_PORT=12345
OTLP_BIND_HOST=127.0.0.1
OTLP_HTTP_PORT=4318
LOKI_BIND_HOST=127.0.0.1
LOKI_PORT=3100
PROMETHEUS_BIND_HOST=127.0.0.1
PROMETHEUS_PORT=9090
PROMETHEUS_RETENTION_TIME=90d
PROMETHEUS_RETENTION_SIZE=20GB
TEMPO_BIND_HOST=127.0.0.1
TEMPO_PORT=3200
```

Spusteni:

```bash
cd outputs/gitea/observability
docker network create monitoring_network 2>/dev/null || true
docker network create app-network 2>/dev/null || true
docker compose up -d
```

Grafana bude dostupna typicky na:

```text
http://localhost:4000
```

Overeni:

```bash
curl -fsS http://localhost:12345/-/ready
curl -fsS http://localhost:3100/ready
curl -fsS http://localhost:3200/ready
```

## Kontrolni prikazy

Backend:

```bash
curl http://localhost:3322/hrbackend/health
```

Job processor:

```bash
curl http://localhost:8090/health
```

Ollama:

```bash
curl http://localhost:11434/api/tags
```

Docker kontejnery:

```bash
docker ps
```

Logy konkretni sluzby:

```bash
docker logs -f hr-backend
docker logs -f job-processor
docker logs -f cv-processor
docker logs -f audit-writer-processor
```

## Uklid prostredi

V kazde compose slozce lze stack zastavit:

```bash
docker compose down
```

Pokud chcete smazat i volumes s daty:

```bash
docker compose down -v --remove-orphans
```

Pozor: `-v` smaze lokalni databazi, ulozene soubory, logy nebo data observability stacku podle toho, ve ktere slozce prikaz spoustite.
