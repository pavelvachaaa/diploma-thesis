== Příklady kódu

Níže jsou krátké ukázky kódu, které můžete použít ve své práci jako ilustraci automatizace nebo volání API.

-- Shell (volání REST API pro registraci nového uživatele)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"jsmith","email":"jsmith@example.com"}' \
  https://api.example.org/onboarding/users
```

-- Typst / konfigurace (JSON přenos dat) — ukázka payloadu

```json
{
  "username": "jsmith",
  "email": "jsmith@example.com",
  "role": "nurse",
  "start_date": "2026-01-05"
}
```


