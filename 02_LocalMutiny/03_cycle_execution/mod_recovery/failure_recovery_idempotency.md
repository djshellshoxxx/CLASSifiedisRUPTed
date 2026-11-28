# PS-024-06 — Failure recovery and idempotency: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-06.R01** All commands are idempotent per CTR-IDM-001, attestations dedupe by cid and by (leg, kind), and mutating recovery commands carry expectedRevision.
- **PS-024-06.R02** Each command is one IndexedDB transaction covering records, completion verdict, events and outbox entries.
- **PS-024-06.R03** Execution is a saga with compensating transitions (IDM-6); no step assumes another party's physical action happened without that party's own attestation.
- **PS-024-06.R04** Conflicting evidence, such as giver says handed over and receiver says not received, is never merged; both are kept and the case is escalated or resolved by signed agreement.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; attestations are unique per cid; (legId, kind) uniqueness for handed_over and received makes a retry harmless.
- **concurrency:** Web Locks mutex per cycleId; expectedRevision on recovery commands; completion and partial-execution verdicts are computed inside the transaction that stores the evidence.
- **retries:** Outbox retries with IDM-4 backoff (base 500 ms, cap 30 s, max 6 attempts per destination); the same signed envelope is re-sent, attestations are never re-signed.
- **offline:** Hand-over attestations work offline and queue as prepared; the physical meeting often has no network, and the other party's vault learns of them on delivery; the UI shows delivery states truthfully.
- **partial failure:** If an attestation is delivered but the compensation settlement is not yet acknowledged, the cycle stays executing and the UI says which condition is missing; if the dispute service is unreachable, escalate returns DEPENDENCY_UNAVAILABLE and the case stays open.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T06 | integration | PS-024-03.R02, PS-024-06.R04 | receiver reports not_received after giver handed_over | issue recorded, partially_executed, both statements kept unmerged, options offered |
| TEST-PS-024-09.T12 | integration | PS-024-06.R01, PS-024-06.R02, PS-024-06.R03 | replay attest; duplicate received from second device; crash mid-transaction | single attestation; no partial state |
| TEST-PS-024-09.T13 | integration | PS-024-06.R04, PS-024-04.R03 | compensation acknowledged after items received | completion occurs at acknowledgement, not before; offline attestations delivered later |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
