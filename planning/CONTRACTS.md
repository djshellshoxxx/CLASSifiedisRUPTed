# Canonical cross-module contract placeholders

**Status:** DRAFT. These are single-owner design locations, not approved wire formats.

- `CTR-ID-001`: Stable IDs and versioning; owner F15; UUID/ULID choice OPEN.
- `CTR-EVT-001`: Event envelope (event ID, aggregate, revision, actor, timestamp, provenance, signature when needed, correlation/idempotency IDs); owner F15.
- `CTR-ERR-001`: Typed errors, retryability, localized presentation and privacy-safe diagnostics; owner F15.
- `CTR-CAP-001`: Capability/permission matrix, actor/resource/action and revocation; owner F16 with F07 identity.
- `CTR-SCH-001`: Schema registry, compatibility and migration; owner F15.
- `CTR-PRV-001`: Location, retention and disclosure classes; owner F10.
- `CTR-COM-001`: Payment evidence claims, verification source and finality; owner F09.
- `CTR-FED-001`: Federated envelope, provenance, deduplication, tombstones and rejection; owner F11.

Consumers reference these contract IDs; specific schemas and event subscriber maps require Prompt 3 expansion.
