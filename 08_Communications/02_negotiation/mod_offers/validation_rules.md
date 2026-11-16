# PS-063-02 — Validation rules: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-02.R01** Posting validates the thread, the poster's party role and the referenced revision before the card statement is signed.
- **PS-063-02.R02** Inbound cards are validated for signature, role and hash match before display state posted is assigned.
- **PS-063-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kind is in the enum and refId resolves to a record the local vault holds with a verified owning-module statement | NOT_FOUND |
| V02 | poster is a party of the referenced record (buyer or seller of the offer, participant of the proposal) | FORBIDDEN |
| V03 | refRevisionHash equals SHA-256 of the JCS bytes of the held revision refRevision | COMMS_CARD_REVISION_MISMATCH |
| V04 | the referenced record is not in a terminal state at posting | CONFLICT_STATE |
| V05 | thread is active and the poster is a participant; all parties of the record are participants of the thread | VALIDATION_FAILED |
| V06 | snapshot is at most 280 code points of plain text | VALIDATION_FAILED |
| V07 | a vault posts at most 20 cards per thread per day | RATE_LIMITED |
| V08 | inbound card statement signature verifies against a device key of posterDid | COMMS_CARD_SIGNATURE_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T01 | unit | PS-063-01.R01, PS-063-01.R02, PS-063-01.R03, PS-063-02.R01 | B posts a card for offer O revision 1 | card stored posted with refRevisionHash equal to SHA-256 of JCS of O revision 1 and snapshot at most 280 characters |
| TEST-PS-063-09.T02 | unit | PS-063-02.R02, PS-063-02.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing stored |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
