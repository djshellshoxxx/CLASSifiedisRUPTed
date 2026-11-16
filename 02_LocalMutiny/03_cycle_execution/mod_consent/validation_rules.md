# PS-021-02 — Validation rules: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-02.R01** Proposing a cycle requires a verified suggestion, a fresh feasibility report, no infeasible check, reachable participants and the coordinator's own reservation.
- **PS-021-02.R02** A consent is valid only if the statement verifies against a non-revoked registered device key of the signer, names this cycle and the exact head hash, and arrives before the deadline on the local clock.
- **PS-021-02.R03** Commit requires every condition simultaneously and is re-checked inside the same transaction that records the last piece of evidence.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | suggestion exists, status suggested, verifiedLocally true, not expired, and the coordinator is a participant | MUTINY_CYCLE_SUGGESTION_UNUSABLE |
| V02 | feasibility report for the head hash is ≤ 10 min old and overall is not infeasible | MUTINY_CYCLE_INFEASIBLE |
| V03 | length 2..8 and participants unique with mailbox hints and no local block among them | MUTINY_CYCLE_INFEASIBLE |
| V04 | consentDeadlineMs between 3600000 and 604800000 (default 259200000) and executionWindowMs between 86400000 and 2592000000 | MUTINY_CYCLE_DEADLINE_INVALID |
| V05 | principal has ≤ 5 non-terminal cycles and proposals combined and is within the F12.S03.M04 local limit | MUTINY_CYCLE_LIMIT |
| V06 | consent revisionHash equals headRevisionHash | MUTINY_CONSENT_STALE_REVISION |
| V07 | consent statement signature verifies, signer is a participant, key not revoked, subject equals the cycle, statement key is mutiny.cycle.consent.v1 | MUTINY_CONSENT_STATEMENT_INVALID |
| V08 | signedAtClaim, receivedAtLocal and any relayReceiptAt are all ≤ consentDeadline and the local clock is ≤ consentDeadline | MUTINY_CONSENT_LATE |
| V09 | the principal's own items were reserved for this head hash before the consent was signed | MUTINY_CYCLE_RESERVATION_FAILED |
| V10 | acceptedImbalance, if present, is a Money in the settlement currency and ≥ 0 and ≤ the participant's gap | VALIDATION_FAILED |
| V11 | acting on a terminal or frozen cycle | MUTINY_CYCLE_FROZEN |
| V12 | a decline is signed by a participant of the cycle | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T03 | unit | PS-021-02.R01, PS-021-02.R03 | each rule V01..V12 violated in turn | documented error code returned, nothing signed |
| TEST-PS-021-09.T07 | integration | PS-021-02.R02, PS-021-05.R02 | consent signed by revoked key, wrong subject, wrong hash, wrong signer | quarantined with MUTINY_CONSENT_STATEMENT_INVALID or STALE; not counted |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
