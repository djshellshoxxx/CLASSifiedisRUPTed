# PS-002-06 — Failure recovery and idempotency: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-06.R01** Commands are idempotent per CTR-IDM-001 using a local command-key table kept for 24 h.
- **PS-002-06.R02** Concurrent writers inside one vault (two tabs, two devices after sync) are resolved by expectedRevision and never merged silently.
- **PS-002-06.R03** A crash mid-command leaves either the full change with its outbox event or nothing.

## Specification

- **idempotency:** Idempotency-Key (UUIDv7) required on create and delete; the vault stores key and request hash for 24 h and replays the stored result; a different body with the same key returns IDEMPOTENCY_KEY_REUSED.
- **concurrency:** One IndexedDB readwrite transaction per command; apply_* use expectedRevision; a second tab gets CONFLICT_REVISION. Forked histories from a second device of the same principal are detected by revision mismatch on sync and surface a resolve-or-discard prompt.
- **retries:** Local commands are retried only after transaction aborts (max 3, 100 ms apart); user-visible errors are never retried automatically.
- **offline:** Fully offline: create, edit and delete work with no network and are committed locally at once; no relay acknowledgement exists or is claimed for this module.
- **partial failure:** If the media blob check fails after a successful category check, nothing is written; a draft with an unreadable blob stays editable and the field is flagged.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T08 | integration | PS-002-06.R01, PS-002-06.R02 | replay create with same key (same and different body) and two tabs editing | original result replayed; IDEMPOTENCY_KEY_REUSED; second tab CONFLICT_REVISION |
| TEST-PS-002-09.T09 | chaos | PS-002-04.R02, PS-002-06.R03 | abort the IndexedDB transaction after the outbox write | neither the listing nor the outbox event persists |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
