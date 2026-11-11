# PS-097-06 — Failure recovery and idempotency: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-06.R01** Evaluation is idempotent for the same input and index snapshot, and events are deduplicated on (targetCid, rulesVersion).
- **PS-097-06.R02** Index updates and the detection event commit in one store transaction.
- **PS-097-06.R03** Index loss degrades to exact-hash mode and recovers automatically without operator action.

## Specification

- **idempotency:** Event dedupe key (targetCid, rulesVersion); repeated evaluation of the same projection updates no counters twice because the index records targetCid; author_presign writes nothing.
- **concurrency:** Index writes use upsert on (tenant, keyHash, targetCid); velocity counters use the F12.S03.M03 atomic increment; parallel evaluations of one projection are safe.
- **retries:** Event delivery follows CTR-EVT-001 retry rules; evaluation itself is not retried.
- **offline:** author_presign and the vault filter work fully offline over locally held records; relay-side heuristics need no vault.
- **partial failure:** If the signal store is unavailable the event still fires from the outbox later; if the index is unavailable evaluation returns degraded true rather than failing intake or publication.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T03 | property | PS-097-01.R01, PS-097-01.R03, PS-097-02.R03, PS-097-03.R01, PS-097-06.R01 | random and hostile texts evaluated twice with the same index snapshot | identical output including rulesVersion and thresholds; no exceptions; score within 0..100; bounded runtime |
| TEST-PS-097-09.T06 | integration | PS-097-04.R03, PS-097-06.R01 | relay index-intake hook with projection text; identity.session.started delivered twice; federation.record.accepted for a listing in a vault with fold on | evaluated before indexing; first observation recorded once; vault filter folds the listing; no identity.account.created consumer exists |
| TEST-PS-097-09.T08 | chaos | PS-097-06.R02, PS-097-06.R03, PS-097-03.R03 | index lost mid-run; signal store down; crash between index write and event | degraded true with exact-hash mode; recovery within 5 minutes; index row and event both present or both absent; events delivered later |

## Dependencies

Module depends on: F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
