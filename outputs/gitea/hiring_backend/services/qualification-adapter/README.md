# Qualification Adapter (NRZP)

Interni mikrosluzba pro lookup kvalifikaci pres InterSystems IRIS Native SDK.
Sluzba je urcena pouze pro interni provoz v Docker siti a vola ji `hiring_backend`.

## Co sluzba dela
- Prijme interni HTTP request s bearer tokenem.
- Zavola IRIS class method (`UCP.UZIS.ApiTest` nebo konfigurace z env).
- Vrati surovou upstream odpoved jako JSON.
- Pri chybe vraci kontrolovany format `error/code/reason_code`.

## Endpointy
- `GET /healthz`
  - Liveness/health endpoint pro Docker healthcheck.
- `POST /internal/qualification/lookup/by-worker-number`
  - Body: `{ "pracovnikNrzpCislo": "..." }`
- `POST /internal/qualification/lookup/by-birth-number`
  - Body: `{ "rodneCislo": "..." }`

## Auth mezi sluzbami
- Povinne `Authorization: Bearer <QUAL_ADAPTER_AUTH_TOKEN>`.
- Token se porovnava constant-time (`timingSafeEqual`).
- Pri neplatnem tokenu vraci `401` + `QUAL_ADAPTER_UNAUTHORIZED`.

## Konfigurace (env)
### Povinne
- `QUAL_ADAPTER_AUTH_TOKEN`
- `QUAL_ADAPTER_IRIS_HOST`
- `QUAL_ADAPTER_IRIS_NS`
- `QUAL_ADAPTER_IRIS_USER`
- `QUAL_ADAPTER_IRIS_PASSWORD`

### Volitelne
- `QUAL_ADAPTER_PORT` (default `8088`)
- `QUAL_ADAPTER_IRIS_PORT` (default `1972`)
- `QUAL_ADAPTER_IRIS_CLASS` (default `UCP.UZIS.ApiTest`)
- `QUAL_ADAPTER_IRIS_METHOD_BY_NRZP` (default `CtiPracovnik`)
- `QUAL_ADAPTER_IRIS_METHOD_BY_RC` (default `CtiPracovnikPodleRodnehoCisla`)
- `QUAL_ADAPTER_IRIS_TIMEOUT_MS` (default `8000`)

## Logovani
Sluzba loguje:
- start/shutdown a degraded mode (kdyz chybi native knihovna),
- kazdy hit endpointu (bez citlivych dat),
- uspech lookupu (`upstream_status`, `upstream_success`),
- chyby (`status`, `code`, `reason_code`, `request_id`).

Do logu se neuklada raw rodne cislo ani bearer token.

## Chybove stavy
- `QUAL_ADAPTER_CONFIG_MISSING` - chybi povinna konfigurace.
- `QUAL_ADAPTER_UNAUTHORIZED` - neplatny/chybejici bearer token.
- `QUALIFICATION_PROVIDER_UNAVAILABLE` - provider nedostupny (vcetne missing native modulu).
- `QUALIFICATION_PROVIDER_CONNECT_FAILED` - chyba spojeni na IRIS.
- `QUALIFICATION_PROVIDER_CALL_FAILED` - selhani volani methody.
- `QUALIFICATION_PROVIDER_INVALID_JSON` - invalidni JSON odpoved z IRIS.

## Lokalni spusteni
```bash
cd services/qualification-adapter
npm install
npm test
npm run start
```

## Provoz v docker-compose
- Sluzba bezi jako `qualification-adapter`.
- Je na interni siti `adapter-internal`.
- Nema publikovany host port (internal-only).
- `hr-backend` ceka na `healthcheck` adapteru.
