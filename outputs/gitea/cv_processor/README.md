# CV Processor

Go microservice pro asynchronní zpracování CV (životopisů) uchazečů. Stahuje dokumenty ze SeaweedFS, extrahuje text přes Apache Tika, analyzuje pomocí LLM (Ollama) a výsledky odesílá zpět do Node.js backendu přes RabbitMQ.

## Architektura

![image](architecture.jpg)

## Ukázkový .env.secrets

```conf
S3_ACCESS_KEY=app_access_key
S3_SECRET_KEY=app_secret_key_12345
RABBITMQ_URL=amqp://guest:guest@server-kde-je-rabbit:5672/
```

## Data Flow

1. **Node.js** (hiring_backend server 172.17.26.162) uloží CV do SeaweedFS a publikuje `cv.uploaded` event do RabbitMQ (server 172.17.26.162)
2. **Go Worker**  konzumuje event:
   - Stáhne soubor ze SeaweedFS (S3-compatible HTTP API)
   - Extrahuje text přes Apache Tika
   - Extrahuje strukturovaná data z CV přes Ollama (llama3.1:8b)
   - Ohodnotí kandidáta vůči popisu pozice přes Ollama
   - Vygeneruje embedding vektor přes Ollama (nomic-embed-text, 768 dims)
3. **Go Worker** publikuje výsledky jako `cv.analyzed` event do RabbitMQ
4. **Node.js** konzumuje výsledky a uloží do PostgreSQL (tabulka `cv_analyses` s pgvector)

## Struktura projektu

```
cv-processor/
├── Dockerfile
├── go.mod / go.sum
├── cmd/
│   └── worker/
│       └── main.go              # Entry point, graceful shutdown
└── internal/
    ├── config/
    │   └── config.go            # Env-based configuration
    ├── consumer/
    │   ├── consumer.go          # RabbitMQ consumer (cv.uploaded)
    │   └── publisher.go         # RabbitMQ publisher (cv.analyzed)
    ├── storage/
    │   └── seaweedfs.go         # SeaweedFS HTTP client (download)
    ├── extractor/
    │   └── tika.go              # Apache Tika HTTP client
    ├── ai/
    │   ├── ollama.go            # Ollama API client (generate + embed)
    │   ├── extract.go           # Structured data extraction (JSON)
    │   ├── evaluate.go          # Candidate evaluation logic
    │   └── embed.go             # Embedding generation
    └── models/
        └── models.go            # Shared structs (CVEvent, CVAnalysisResult)
```

## Lokální vývoj

```bash
# Stáhnout potřebné Ollama modely
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# Build
go build -o cv-processor ./cmd/worker

# Spustit (s běžícími RabbitMQ, SeaweedFS, Tika, Ollama)
./cv-processor
```

## Docker

```bash
# Build + spuštění v rámci celého stacku
docker-compose up -d --build cv-processor

# Pouze cv-processor (ostatní služby musí běžet)
docker-compose up --build cv-processor
```

## Produkční release přes Gitea

Release flow je image-based. Tag `vX.Y.Z`:

1. pustí `go test ./...`
2. buildne a pushne image `cv-processor`
3. vygeneruje CI-managed `.env.runtime`
4. nahraje na server `compose.yaml`, `deploy-cv-processor.sh` a `.env.runtime.next`
5. na serveru provede `docker login`, pull, restart služby a rollback při failu
6. po úspěchu spustí asynchronní cleanup nepoužívaných image starších než 7 dní

### Gitea repository variables

- `REGISTRY_IMAGE_CV_PROCESSOR`
- `S3_ENDPOINT`
- `OLLAMA_URL`
- `MODEL_USED`

### Gitea repository secrets

- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- `DEPLOY_SSH_PRIVATE_KEY`

## Hybrid runtime config

Produkční runtime config je rozdělený na dva soubory:

- `.env.runtime`
  - generuje a přepisuje ho CI
  - obsahuje jen non-secret config a image refs
- `.env.secrets`
  - zůstává pouze na serveru
  - CI na něj nesahá

Ukázka `.env.runtime` je v [deploy/env.runtime.example](deploy/env.runtime.example).

Server-only `.env.secrets` má minimálně:

```conf
RABBITMQ_URL=amqp://user:password@rabbitmq:5672/
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

## Produkční soubory na serveru

V `${DEPLOY_PATH}` mají být:

- `compose.yaml`
- `.env.runtime`
- `.env.runtime.next` jen během releasu
- `.env.secrets`
- `deploy-cv-processor.sh`
- `logs/`

## One-time bootstrap serveru

Po nahrání `deploy/compose.yaml`, `.env.runtime` a `.env.secrets` lze stack inicializovat:

```bash
mkdir -p "$DEPLOY_PATH"
cp deploy/compose.yaml "$DEPLOY_PATH/compose.yaml"
cp deploy/bootstrap-server.sh "$DEPLOY_PATH/bootstrap-server.sh"
cp deploy/env.runtime.example "$DEPLOY_PATH/.env.runtime"
# uprav .env.runtime
# vytvoř .env.secrets

cd "$DEPLOY_PATH"
sh bootstrap-server.sh
```

Bootstrap skript:

- vytvoří `logs/`
- vytvoří external Docker network `kz`, pokud neexistuje
- pullne `tika` a `cv-processor`
- spustí obě služby

## Rollback

Standardní rollback je nový deploy staršího tagu `vX.Y.Z`.

Nouzově lze ručně vrátit předchozí image v `.env.runtime` a znovu spustit službu:

```bash
tmp_file="$(mktemp)"
sed 's#^CV_PROCESSOR_IMAGE=.*#CV_PROCESSOR_IMAGE=docker.kzcr.eu/team/cv-processor:v1.2.2#' .env.runtime > "$tmp_file"
mv "$tmp_file" .env.runtime
docker compose --env-file .env.runtime -f compose.yaml up -d cv-processor
```

`deploy-cv-processor.sh` rollback provede automaticky při neúspěšném releasu, pokud na serveru existovala předchozí `.env.runtime`.

## Post-deploy cleanup

Po úspěšném deployi běží na pozadí:

```bash
docker image prune -a -f --filter "until=168h"
```

Cleanup neblokuje návrat CI jobu a jeho výstup jde do `logs/image-prune.log`.

## RabbitMQ zprávy

### Vstup: `cv.uploaded` (exchange: `cv_events`)

```json
{
  "attachment_id": "uuid",
  "applicant_id": "uuid",
  "job_posting_id": "uuid",
  "organization_id": "uuid",
  "s3_bucket": "attachments",
  "s3_key": "applicant-attachments/attachment-xxx.pdf",
  "mime_type": "application/pdf",
  "original_filename": "zivotopis.pdf",
  "job_title": "Všeobecná sestra",
  "job_description": "Popis pozice..."
}
```

### Výstup: `cv.analyzed` (exchange: `cv_events`)

```json
{
  "attachment_id": "uuid",
  "applicant_id": "uuid",
  "organization_id": "uuid",
  "raw_text": "Extrahovaný text z CV...",
  "candidate_name": "Jan Novák",
  "candidate_email": "jan@example.com",
  "candidate_phone": "+420123456789",
  "skills": ["ošetřovatelství", "první pomoc"],
  "languages": ["čeština", "angličtina"],
  "certifications": ["ACLS"],
  "education": [{"institution": "UK", "degree": "Bc.", "field": "Ošetřovatelství", "year": "2020"}],
  "experience": [{"company": "FN Motol", "position": "Sestra", "duration": "3 roky", "description": "..."}],
  "summary": "Shrnutí kandidáta z pohledu HR recruitera (~250 slov)...",
  "verbal_evaluation": "Slovní hodnocení kandidáta z pohledu HR recruitera...",
  "evaluation_score": 78,
  "evaluation_reasoning": "Kandidát má relevantní vzdělání...",
  "evaluation_strengths": ["3 roky praxe", "relevantní certifikace"],
  "evaluation_weaknesses": ["chybí zkušenost s..."],
  "embedding": [0.123, -0.456, ...],
  "model_used": "llama3.1:8b",
  "embedding_model": "nomic-embed-text",
  "processing_time_ms": 15234
}
```

## Graceful Shutdown

Worker reaguje na SIGINT/SIGTERM signály a dokončí rozpracovanou zprávu před ukončením.
