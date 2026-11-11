# PS-065-02 — Validation rules: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-02.R01** Check-in, no-show and share inputs are validated against meetup state and time windows on the local clock before any statement is signed.
- **PS-065-02.R02** Inbound check-in and report statements are validated for signature, key status, party role and proposal hash.
- **PS-065-02.R03** Every violation maps to one stable error code.
- **PS-065-02.R04** Limits enforced only in the reporter's vault are UX guards; receiving vaults keep at most 3 no-show reports per meetup and reporter, and statements from DIDs the local principal blocked are dropped silently (N7).

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | meetup is agreed and proposalHash matches the current agreed proposal | CONFLICT_STATE |
| V02 | local clock is between windowStart minus 15 minutes and windowEnd plus 30 minutes for a check-in | COMMS_CHECKIN_OUTSIDE_WINDOW |
| V03 | actor is a party of the meetup and has status pending | FORBIDDEN |
| V04 | input contains no coordinates, accuracy, device identifiers or free text location fields | VALIDATION_FAILED |
| V05 | no-show report is made between windowEnd plus 30 minutes and windowEnd plus 24 hours by a party with status checked_in about a party who has no verified check-in in the reporter's vault | COMMS_NO_SHOW_NOT_ALLOWED |
| V06 | inbound statement signature verifies against a device key of the signer that F16.S02.M02 reports active at receipt, and the signer is a party | COMMS_CHECKIN_SIGNATURE_INVALID |
| V07 | share expiry is at most 24 hours ahead and not after windowEnd plus 6 hours; at most 3 active shares per meetup | COMMS_SHARE_LIMIT |
| V08 | UX guard in the reporter vault: at most 5 no-shows per day; receiving vaults keep at most 3 reports per meetup and reporter and drop the rest silently | RATE_LIMITED |
| V09 | share snapshot plaintext is at most 1 024 bytes before encryption and ciphertext at most 2 048 bytes | PAYLOAD_TOO_LARGE |
| V10 | share blob put, update and delete requests are signed by the creating device key (classrup/relay-request/v1, F16.S02.M03) | FORBIDDEN |
| V11 | inbound check-in and report statements from DIDs the local principal blocked (F07.S02.M02 isBlockedEither over local data) are dropped silently; a party blocked by someone else sees no difference | BLOCKED_PARTY |
| V12 | the share snapshot plaintext holds exactly placeLabel, windowStart, windowEnd, ownCheckinState and updatedAt | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T01 | unit | PS-065-01.R01, PS-065-01.R02, PS-065-02.R01, PS-065-02.R03 | A checks in at 13:50 and with coordinates in the request | first stored checked_in with signed statement; second refused VALIDATION_FAILED; no coordinates stored |
| TEST-PS-065-09.T02 | unit | PS-065-02.R02, PS-065-02.R03 | each rule V01 to V12 violated in turn | documented error code returned and nothing stored |
| TEST-PS-065-09.T10 | abuse | PS-065-07.R03, PS-065-02.R04 | 6th no-show report in a day; report before grace period ends; 4th report from one reporter at the receiver | RATE_LIMITED as UX guard and COMMS_NO_SHOW_NOT_ALLOWED; receiver drops the 4th silently; reports labelled as claims in UI |

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
