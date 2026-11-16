# PS-014-06 — Failure recovery and idempotency: Proposal party roster

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M02 Proposal party roster](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-014-06.R01** join and leave are idempotent; replaying the same body returns the stored result.
- **PS-014-06.R02** join creates all rows in one IndexedDB transaction so a partial roster never exists.
- **PS-014-06.R03** A mismatch between roster and head revision is surfaced and blocks consent until reconciled by ingesting the signed revision.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; join is also idempotent by (subjectId, parties) and leave by (subjectId, actorId).
- **concurrency:** IndexedDB transaction per command; expectedRevision on leave; uniqueness enforced by the two unique indexes.
- **retries:** No network use; the owning module sends statements through the sync outbox.
- **offline:** Fully available offline; reachability is judged from retained signed projections and their age.
- **partial failure:** A failing block-list read aborts the whole join with DEPENDENCY_UNAVAILABLE; no partial roster is stored.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-014-09.T08 | integration | PS-014-06.R01, PS-014-06.R02 | replay join; crash mid-transaction | one roster; no partial rows |
| TEST-PS-014-09.T09 | integration | PS-014-06.R03, PS-014-01.R02, PS-014-02.R03 | tampered revision with different party order | MUTINY_ROSTER_MISMATCH and consent blocked |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
