# PS-029-06 — Failure recovery and idempotency: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-06.R01** All commands are idempotent per CTR-IDM-001 using a local command id, and revise, publish and withdraw require expectedRevision.
- **PS-029-06.R02** Publish and withdraw are atomic with their local outbox event and sync outbox entry; a crash between them leaves neither.
- **PS-029-06.R03** Listing events are consumed idempotently using the inbox table.

## Specification

- **idempotency:** Each command carries a client-generated command id stored in the vault for 24 h (IDM-1); replay returns the stored result; statement delivery to a relay is idempotent by cid.
- **concurrency:** expectedRevision on revise/publish/withdraw; one vault is single-writer per IndexedDB transaction; two tabs are serialized by a Web Locks lock named services-offering-<id>; two devices of the same principal that fork are detected through the seq/prev chain and frozen for explicit merge (ADR-0016 section 5).
- **retries:** The sync outbox retries relay upload with backoff 1 s, 2 s, 4 s, 8 s up to 8 attempts, then shows needs attention; local consumers retry per EVT-6.
- **offline:** All commands work offline and commit locally; publish shows prepared until a relay acknowledges (transport_acknowledged) and never shows peer_accepted unless a relay returns a signed acknowledgement.
- **partial failure:** If the taxonomy or currency registry cannot be read from the vault cache, publish returns DEPENDENCY_UNAVAILABLE and the offering stays draft; if relay upload fails the offering is published locally and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T08 | integration | PS-029-06.R01, PS-029-06.R02, PS-029-06.R03 | replay same key with same and different body; crash between state change and outbox | original response replayed; IDEMPOTENCY_KEY_REUSED; atomic outcome |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
