# Platform Layer

Contains infrastructure adapters over external systems.

Rules:
- Own concrete implementations (email, storage, audit, logger, messaging, etc.).
- Expose stable interfaces to the rest of the app.

Current wrappers:
- `platform/db`
- `platform/rabbitmq`
- `platform/auth`
- `platform/userSearch`
- `platform/storage`
- `platform/audit`
- `platform/logger`
- `platform/email`
