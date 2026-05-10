# KZ Observability Stack

Grafana Alloy + Loki + Prometheus + Tempo + Grafana for the hiring_backend
ecosystem (hiring_backend, qualification-adapter, user-search-adapter,
Postgres, RabbitMQ, SeaweedFS).



## Prerequisites

External Docker networks must exist:

```bash
docker network create monitoring_network 2>/dev/null || true
docker network create app-network        2>/dev/null || true
docker network create adapter-internal   2>/dev/null || true
```
 

## Start

```bash
cp .env.example .env
# edit .env

docker compose up -d
```

## Ports

Pouze Grafana má konfigurovatelný bind host (defaultně `127.0.0.1`, přepnutelné přes
`GRAFANA_BIND_HOST=0.0.0.0` v `.env`). Všechno ostatní je natvrdo bindnuté na
`127.0.0.1` — služby spolu komunikují přes docker network (`monitoring_network`),
takže venku ty porty nikdo nepotřebuje.

| Service       | Bind                | Purpose                          |
|---------------|---------------------|----------------------------------|
| Grafana       | `${GRAFANA_BIND_HOST}:${GRAFANA_LOCAL_PORT}` → 3000 | UI (admin / `$GF_SECURITY_ADMIN_PASSWORD`) |
| Prometheus    | 127.0.0.1:9090      | UI / API (lokální debug)         |
| Loki          | 127.0.0.1:3100      | Push + query API (lokální debug) |
| Tempo         | 127.0.0.1:3200      | Query API (lokální debug)        |
| Alloy         | 127.0.0.1:12345     | Alloy UI                         |
| Alloy OTLP    | 127.0.0.1:4318      | OTLP HTTP receiver (in-network apps push přes `alloy:4318`) |

## Verification

```bash
# Stack health
docker compose ps

# Alloy ready
curl -fsS http://localhost:12345/-/ready

# Prometheus scrape targets — all should be "up"
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health}'

# Loki accepting writes
curl -fsS http://localhost:3100/ready

# Tempo accepting traces
curl -fsS http://localhost:3200/ready
```

## Stop

```bash
docker compose down       # keep volumes
docker compose down -v    # nuke retained data
```
