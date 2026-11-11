# PS-024-02 — Validation rules: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-02.R01** Attestations are accepted only from the right party for the leg, in a cycle state that allows them, with a verified signature and a plausible claimed time.
- **PS-024-02.R02** Recovery options are accepted only inside an open case and only from participants of the cycle; acceptance requires the counterparty named in the option.
- **PS-024-02.R03** Completion is derived from verified evidence and never from a message that says completed.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | cycle status is committed or executing for handed_over, received and issue_reported; returned and return_confirmed require an open RecoveryCase with an accepted return_item option | MUTINY_ATTESTATION_NOT_ALLOWED |
| V02 | attestorId has the role required for the kind on the leg (giver for handed_over and returned, receiver for received and issue_reported, original giver for return_confirmed) | MUTINY_ATTESTATION_ROLE_INVALID |
| V03 | signature verifies Ed25519 against a registered, non-revoked device key of attestorId and the envelope names this cycle and leg | MUTINY_ATTESTATION_STATEMENT_INVALID |
| V04 | claimedAt is not more than 5 minutes after the local clock | MUTINY_ATTESTATION_STATEMENT_INVALID |
| V05 | items equal the leg lines in id and quantity, except issue_reported which may name a non-empty subset | MUTINY_ATTESTATION_ITEMS_MISMATCH |
| V06 | no valid attestation of the same kind exists for the leg (handed_over, received) | MUTINY_ATTESTATION_DUPLICATE |
| V07 | issue_reported requires issueCode and either the giver's handed_over for the leg or at least 48 h since the local commit time | MUTINY_ISSUE_NOT_ALLOWED |
| V08 | evidenceRefs ≤ 3 attachments, each with stripped metadata and ≤ 5 MiB, and note ≤ 280 code points | VALIDATION_FAILED |
| V09 | recovery option proposer is a participant, option kind is one of return_item, compensation, waive, dispute, case has fewer than 12 options | MUTINY_RECOVERY_OPTION_INVALID |
| V10 | option response is made by the counterparty named in the option and the option is proposed | MUTINY_RECOVERY_ROLE_INVALID |
| V11 | acting on a resolved or closed case | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T03 | unit | PS-024-02.R01, PS-024-02.R02, PS-024-02.R03 | each rule V01..V11 violated in turn | documented error code and nothing stored |
| TEST-PS-024-09.T19 | e2e | PS-024-01.R03, PS-024-02.R02 | two mobile browsers perform hand-over attestations | statement of what a signature means shown; payment labels as text; axe zero serious issues |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
