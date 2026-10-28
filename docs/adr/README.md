# Architecture decision records

Implementation proceeded on the owner's instruction to build autonomously. The OPEN items in
[DECISIONS.md](../../DECISIONS.md) are accepted with their recommended defaults as below.
Accepted means "implemented this way"; it does not imply external security review.

| ADR | Decision | Status |
|---|---|---|
| ADR-0001 | PWA trust boundaries: static PWA is untrusted client; relay enforces authz, validation, rate limits, persistence | Accepted |
| ADR-0002 | IDs: prefixed ULIDs; versioned event envelope (CTR-EVT-001); one owner per collection; transactional outbox in a synchronous store | Accepted |
| ADR-0003 | Cycle matching: bounded deterministic DFS/Johnson-style enumeration with max length, max results and time budget; unanimous consent state machine (D02) | Accepted |
| ADR-0004 | Federation: Ed25519-signed versioned envelopes, explicit opt-in per record, provenance, tombstones, peer trust and blocklists (D01) | Accepted |
| ADR-0005 | Settlement: noncustodial; claims vs independently verified evidence; bigint minor units; pinned rational FX quotes with expiry (D03, D06, D09) | Accepted |
| ADR-0006 | Geoprivacy: public geohash cells of length <= 5 (~5 km); exact location only by explicit user disclosure to named participants (D05) | Accepted |
| ADR-0007 | Partial barter execution: per-party attestations, compensating recovery, no atomic real-world guarantee (D04) | Accepted |
| ADR-0008 | Retention: minimal per-class defaults, legal hold blocks deletion (D07) | Accepted |
| ADR-0009 | Offline writes: client outbox queue, pending until relay acknowledgement, idempotency keys for safe retry (D08) | Accepted |
| ADR-0010 | Auth and portability: user-held Ed25519 device keys, challenge-response sessions, recovery codes and key rotation (D10) | Accepted |
| ADR-0011 | Stack: TypeScript strict, pnpm workspaces, zod validation, @noble crypto, Hono relay on Node 22 with node:sqlite, Preact + Vite PWA, Vitest + fast-check, Playwright + axe | Accepted |
