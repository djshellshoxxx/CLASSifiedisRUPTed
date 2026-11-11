# PS-027-06 — Failure recovery and idempotency: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-06.R01** declare, flag and acknowledge are idempotent, and projections dedupe by cid and ordering by seq.
- **PS-027-06.R02** Each command is one IndexedDB transaction covering the record, event and outbox entry.
- **PS-027-06.R03** A valuation changed while a reservation exists is refused; there is no merge of conflicting values from two devices, and the higher seq after user confirmation wins for the public projection.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; declare is also idempotent by (inventoryItemId, declared, basis, note) within 24 h.
- **concurrency:** expectedRevision on acknowledge; per-item Web Locks mutex; seq chain prevents lost updates between two devices of the same owner and surfaces a resolve prompt.
- **retries:** Outbox retries with IDM-4 backoff (base 500 ms, cap 30 s, max 6 attempts per relay); flags are re-sent as the same signed envelope.
- **offline:** All commands work offline and commit locally; matching in the vault uses new values immediately, and other vaults see them after delivery.
- **partial failure:** If the listing projection is temporarily missing, plausibility is unchecked and the valuation is stored with a warning; it is re-evaluated when the listing is available.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T08 | integration | PS-027-04.R03, PS-027-06.R03 | listing edited and sell terms set events | reference and plausibility recomputed; automatic flag set or cleared |
| TEST-PS-027-09.T10 | integration | PS-027-06.R01, PS-027-06.R02 | replay declare; two devices change value concurrently | single record; resolve prompt, higher seq wins only after user confirmation |
| TEST-PS-027-09.T14 | integration | PS-027-06.R03, PS-027-10.R01, PS-027-10.R02, PS-027-10.R03 | export, import into fresh vault, rollback | own valuations round-trip with signatures; imported peer projections re-verified; seq continues |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
