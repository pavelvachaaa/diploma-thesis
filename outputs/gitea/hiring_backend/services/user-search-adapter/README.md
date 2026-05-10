# User Search Adapter

Interni mikrosluzba pro lookup internich uzivatelu pres InterSystems IRIS Native SDK.
Sluzba je urcena pouze pro interni provoz v Docker siti a vola ji `hiring_backend`.

## Co sluzba dela
- Prijme interni HTTP request s bearer tokenem.
- Zavola IRIS class method (`UCP.JoinKZ.Users.Api.Search` nebo konfigurace z env).
- Vrati seznam internich uzivatelu jako JSON pole.
- Pri chybe vraci kontrolovany format `error/code/reason_code`.

## Endpointy
- `GET /healthz`
  - Liveness/health endpoint pro Docker healthcheck.
- `POST /internal/users/search`
  - Body: `{ "query": "..." }`

## Auth mezi sluzbami
- Povinne `Authorization: Bearer <USER_SEARCH_ADAPTER_AUTH_TOKEN>`.
- Token se porovnava constant-time (`timingSafeEqual`).
- Pri neplatnem tokenu vraci `401` + `USER_SEARCH_ADAPTER_UNAUTHORIZED`.

## Konfigurace (env)
### Povinne
- `USER_SEARCH_ADAPTER_AUTH_TOKEN`
- `USER_SEARCH_ADAPTER_IRIS_HOST`
- `USER_SEARCH_ADAPTER_IRIS_NS`
- `USER_SEARCH_ADAPTER_IRIS_USER`
- `USER_SEARCH_ADAPTER_IRIS_PASSWORD`

### Volitelne
- `USER_SEARCH_ADAPTER_PORT` (default `8089`)
- `USER_SEARCH_ADAPTER_IRIS_PORT` (default `1972`)
- `USER_SEARCH_ADAPTER_IRIS_CLASS` (default `UCP.JoinKZ.Users.Api`)
- `USER_SEARCH_ADAPTER_IRIS_METHOD_SEARCH` (default `Search`)
- `USER_SEARCH_ADAPTER_IRIS_TIMEOUT_MS` (default `8000`)

## Logovani
Sluzba loguje:
- start/shutdown a degraded mode (kdyz chybi native knihovna),
- kazdy hit endpointu (bez citlivych dat),
- uspech lookupu (`result_count`),
- chyby (`status`, `code`, `reason_code`, `request_id`).

Do logu se neuklada raw query ani bearer token.

## Chybove stavy
- `USER_SEARCH_ADAPTER_CONFIG_MISSING` - chybi povinna konfigurace.
- `USER_SEARCH_ADAPTER_UNAUTHORIZED` - neplatny/chybejici bearer token.
- `USER_SEARCH_PROVIDER_UNAVAILABLE` - provider nedostupny (vcetne missing native modulu).
- `USER_SEARCH_PROVIDER_CONNECT_FAILED` - chyba spojeni na IRIS.
- `USER_SEARCH_PROVIDER_CALL_FAILED` - selhani volani methody.
- `USER_SEARCH_PROVIDER_INVALID_JSON` - invalidni JSON odpoved z IRIS.

## Lokalni spusteni
```bash
cd services/user-search-adapter
npm install
npm test
npm run start
```

## Provoz v docker-compose
- Sluzba bezi jako `user-search-adapter`.
- Je na interni siti `adapter-internal`.
- Nema publikovany host port (internal-only).
- `hr-backend` ceka na `healthcheck` adapteru.
