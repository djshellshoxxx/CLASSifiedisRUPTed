# PS-006-06 — Failure recovery and idempotency: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-06.R01** The command is idempotent per CTR-IDM-001 and carries expectedRevision when replacing existing terms.
- **PS-006-06.R02** Terms, listing revision record and outbox event commit in one transaction or not at all.
- **PS-006-06.R03** Offline edits are committed locally and remain unsent until the next signed projection is accepted; no certainty beyond that state is claimed.

## Specification

- **idempotency:** Idempotency-Key required; key and request hash kept 24 h in the vault; replay returns the stored result.
- **concurrency:** expectedRevision on every replace; the unique index on listing id prevents two terms records; stale revision returns CONFLICT_REVISION with currentRevision and both values are shown.
- **retries:** Only IndexedDB aborts are retried (max 3); RATE_LIMITED is retried only after retryAfterMs.
- **offline:** Fully offline capable; sync state of the affected projection is tracked by F01.S01.M03 (prepared, transport_acknowledged, peer_accepted).
- **partial failure:** If recording the listing revision fails, the terms write is rolled back and DEPENDENCY_UNAVAILABLE is returned only for transient storage faults.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T05 | integration | PS-006-04.R02, PS-006-06.R03 | define on published P with price change | event emitted once; revision recorded as material; draft L emits no event |
| TEST-PS-006-09.T07 | integration | PS-006-06.R01, PS-006-06.R02 | replay define; stale expectedRevision | original result; CONFLICT_REVISION with currentRevision |
| TEST-PS-006-09.T08 | chaos | PS-006-06.R03 | revision record fails inside define | terms write rolled back |
| TEST-PS-006-09.T09 | integration | PS-006-06.R03 | edit offline then send projection | state unsent, then prepared, transport_acknowledged, peer_accepted only after signed ack |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
