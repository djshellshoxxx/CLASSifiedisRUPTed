# PS-146-06 — Failure recovery and idempotency: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-06.R01** Authoring and apply commands are idempotent per CTR-IDM-001; packs are deduplicated by packCid.
- **PS-146-06.R02** apply_pack replaces the active rule set atomically; evaluation always sees a complete pack, never a partial one.
- **PS-146-06.R03** Offline vaults evaluate with the last applied pack; relay unavailability never blocks local evaluation.

## Specification

- **idempotency:** Idempotency-Key required on authoring and release; keys kept 24 h; apply_pack is idempotent by packCid; evaluate is a pure query.
- **concurrency:** expectedRevision on draft and retire; expectedPackVersion on release; apply_pack runs in one IndexedDB transaction so a concurrent evaluate sees the previous or the new pack, never a mix; competing packs from different publishers coexist and results are merged by strictest action.
- **retries:** Relay upload retries follow IDM-4 (base 500 ms, cap 30 s, 6 attempts); apply failures are validation outcomes and are not retried.
- **offline:** Evaluation, apply and authoring work offline; release shows prepared until a relay receipt exists.
- **partial failure:** A failing validation rejects the whole pack and keeps the previous version; consumers of the changed event retry per CTR-EVT-001 and a failure in one consumer does not roll back the applied pack.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T07 | integration | PS-146-04.R03, PS-146-06.R03 | apply pack while publications are active | changed event emitted; F01.S01.M03 re-evaluation ends a publication that now blocks |
| TEST-PS-146-09.T09 | integration | PS-146-06.R01, PS-146-06.R02 | replay release; apply two packs concurrently with evaluate | one packCid; evaluate sees old or new pack only |
| TEST-PS-146-09.T10 | chaos | PS-146-06.R03 | relay down during release; one consumer fails | local state intact; delivery prepared; consumer retries without rolling back the pack |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
