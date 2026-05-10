# kariera.kzcr.eu

Kariérní web postavený na Next.js.

## Lokální spuštění

### Bez Dockeru
```bash
npm i
npm run dev
```

### Přes Docker Compose
```bash
docker network inspect app-network >/dev/null 2>&1 || docker network create app-network -d bridge
docker compose up -d --build
```

## Deploy přes Gitea Actions

Release flow je image-based: Gitea Actions na release tagu buildne image, pushne ho do `docker.kzcr.eu` a na server pak nahraje deploy manifest z `deploy/compose.yaml`, přihlásí se do registry a provede `docker compose pull && docker compose up -d`. Server pro release deploy nepotřebuje checkout repa.

Workflow očekává release tagy pouze ve formátu `vX.Y.Z`.

Produkční release workflow očekává v Gitea tyto repository variables:

- `REGISTRY_IMAGE`: plná image cesta včetně registry hostu, např. `docker.kzcr.eu/kzcr.eu/kariera.kzcr.eu`
- `NEXT_PUBLIC_BASE_API_URL_PROD`
- `NEXT_PUBLIC_BASE_PATH`: pro root nechat prázdné nebo `/`, pro subpath používat např. `/kariera`
- `NEXT_PUBLIC_UMAMI_ENABLED`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `NEXT_PUBLIC_UMAMI_DOMAINS`
- `UMAMI_PROXY_TARGET`

A tyto repository secrets:

- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `DEPLOY_HOST`
- `DEPLOY_PORT`: volitelně, default je `22`
- `DEPLOY_USER`
- `DEPLOY_PATH`: absolutní cesta k minimálnímu deploy adresáři na serveru
- `DEPLOY_SSH_PRIVATE_KEY`

Na serveru je potřeba pouze:

- Docker
- Docker Compose plugin
- prázdný nebo existující deploy adresář z `DEPLOY_PATH`

Workflow při release tagu:

1. validuje tag `vX.Y.Z`
2. buildne image s produkčními build-time proměnnými
3. pushne `${REGISTRY_IMAGE}:${TAG}`
4. nahraje `deploy/compose.yaml` a `.env.deploy` na server
5. vytvoří `app-network`, pokud neexistuje
6. provede remote `docker login`, `docker compose pull` a `docker compose up -d`

Deploy spustíš například takto:

```bash
git tag v1.2.3
git push origin v1.2.3
```

Rollback je pak jen změna `IMAGE_TAG` v `.env.deploy` na serveru a znovuspuštění:

```bash
docker compose --env-file .env.deploy -f compose.yaml pull
docker compose --env-file .env.deploy -f compose.yaml up -d --remove-orphans
```

## Version endpoint

Na `/version` aplikace vrací plain text verzi. V release deployi odpovídá tagu z `IMAGE_TAG`, lokálně fallbackuje na `package.json.version`.
