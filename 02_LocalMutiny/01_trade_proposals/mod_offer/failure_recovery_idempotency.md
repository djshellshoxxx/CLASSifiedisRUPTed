# PS-013-06 — Failure recovery and idempotency: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-06.R01** define is idempotent per Idempotency-Key and by (subjectId, position, items) so a retry cannot create a second leg.
- **PS-013-06.R02** Definition and the optional inventory read happen in one IndexedDB transaction.
- **PS-013-06.R03** A leg defined against a listing that later changes keeps its recorded listing revision hash and is flagged, never rewritten.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; additionally an identical (subjectId, position, items) within 24 h returns the existing defined leg.
- **concurrency:** IndexedDB transaction per define; duplicate-item and limit checks run inside the transaction; expectedRevision on void.
- **retries:** No network; the sync outbox is not used because no statement is produced here.
- **offline:** Fully available offline; peer item verification uses retained listing projections and shows their age.
- **partial failure:** If the listing projection of a peer item is missing, define fails with MUTINY_ITEM_NOT_OWNED rather than creating a leg that looks verified.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T08 | integration | PS-013-04.R03, PS-013-06.R03 | listing edited after drafting | leg flagged listingChanged, recorded listing revision hash unchanged |
| TEST-PS-013-09.T10 | integration | PS-013-06.R01, PS-013-06.R02 | replay define with same key and with identical body new key | single leg |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
