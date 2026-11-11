# PS-024-02 — Validation rules: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-02.R01** Attestations are accepted only from the right party for the leg, in a cycle state that allows them, with a verified signature and a plausible claimed time.
- **PS-024-02.R02** Recovery options are accepted only inside an open case and only from participants of the cycle; acceptance requires a signed accept from every participant in the option's requiredSignerIds.
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
| V08 | evidenceRefs ≤ 3 MediaBlob refs (F15.S02.M03), each stripped through F10.S02.M03 and ≤ 5 MiB, and note ≤ 280 code points | VALIDATION_FAILED |
| V09 | recovery option proposer is a participant, option kind is one of return_item, compensation, waive, dispute, case has fewer than 12 options | MUTINY_RECOVERY_OPTION_INVALID |
| V10 | option response is made by a DID in the option's requiredSignerIds and the option is proposed; the option becomes accepted only when every requiredSignerId signed accept | MUTINY_RECOVERY_ROLE_INVALID |
| V11 | acting on a resolved or closed case | CONFLICT_STATE |
| V12 | a leg disposition is recorded only when backed by verified accept actions of that leg's giver and receiver, or by a dispute outcome both acknowledged (F09.S02.M02 acceptedBy), never by other participants alone | MUTINY_RECOVERY_DISPOSITION_UNSIGNED |
| V13 | requiredSignerIds equal the derivation for the kind (return_item: giver and receiver of legId; compensation: payer and payee; waive: the party bearing the loss; dispute: the opener) and are participants of the cycle | MUTINY_RECOVERY_OPTION_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T03 | unit | PS-024-02.R01, PS-024-02.R02, PS-024-02.R03 | each rule V01..V13 violated in turn | documented error code and nothing stored |
| TEST-PS-024-09.T23 | abuse | PS-024-02.R02, PS-024-03.R05 | 6-party recovery: four participants accept a waive option on leg L2 without Carol (giver) and Dan (receiver); later Carol and Dan accept | no disposition for L2 and MUTINY_RECOVERY_DISPOSITION_UNSIGNED until Carol and Dan signed; then disposition recorded with backedBy signed_acceptance |
| TEST-PS-024-09.T26 | integration | PS-024-02.R02, PS-024-03.R03 | compensation option payer Dan payee Alice 80.00 EUR accepted by Dan then Alice | option accepted only after both; mutiny.compensation.activate called once in the transaction of Alice's accept |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F15.S02.M03, F10.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
