# CTR-SCH-001 — Schema registry, compatibility and migration

**Status:** APPROVED. **Owner:** F15.S02.M03 (mod_storage).

- **SCH-1** Each schema name (CTR-ID-001 ID-5) has exactly one zod definition in its owning package, exported through the package public API; the relay exposes the JSON Schema rendering at `GET /api/v1/schemas`.
- **SCH-2** API input is parsed strictly (unknown keys rejected with `VALIDATION_FAILED`). Federated envelopes keep unknown keys only under `ext` (max 4 KiB).
- **SCH-3** Within a major version only additive optional fields are allowed. Breaking change ⇒ new major; relays accept current and previous major for 180 days.
- **SCH-4** Stored records are upgraded lazily by pure migration functions `vN → vN+1` registered per schema; a startup check verifies every registered major has a migration path to current.
- **SCH-5** Database migrations are forward-only, expand/contract: (1) add new structures, (2) dual-write, (3) backfill, (4) switch reads, (5) drop old in a later release. Each step is idempotent and recorded in `schema_migrations`.
- **SCH-6** Size limits: JSON body ≤ 256 KiB; string fields declare max length in code points; arrays declare max items.
