# PS-094-02 — Validation rules: Content flags

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M01 Content flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/flags` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-094-02.R01** Report input is validated strictly against the schema in the vault and again by the receiving relay; unknown fields are rejected with VALIDATION_FAILED.
- **PS-094-02.R02** The target must be a record the vault holds with a verifiable author signature, or an unsigned end-to-end message filed as a labelled reporter claim, and must not belong to the reporter.
- **PS-094-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-094-02.R04** The receiving relay accepts a report only when the signed relayId is its own DID and the body is sealed to its current moderation key, so a report forwarded to another relay is refused and never multiplied.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | reasonCode is in the 12-code taxonomy and details is at most 1000 code points of plain text | VALIDATION_FAILED |
| V02 | the vault holds the target with a verifiable author signature for targetCid, or reporterClaim is true and targetType is message (stored and shown as 'reporter claim') | MODERATION_TARGET_UNAVAILABLE |
| V03 | reporterKey differs from the author key of the target | MODERATION_REPORT_SELF |
| V04 | no open report by the same reporter key for the same relay, target and reason | MODERATION_REPORT_DUPLICATE |
| V05 | relay policy through RateLimitPort (F12.S03.M03): class report.receive allows 20 per 24 h per key and 60 per 24 h per /24 prefix; F12.S03.M03 itself switches a key to class report.receive.reduced (3 per 24 h) while this relay's F12.S03.M02 store holds a report_dismissed_bad_faith signal for it observed in the last 30 days; reasonCode minor_safety is passed as exempt and always uses report.receive | RATE_LIMITED |
| V06 | relayId is a relay the vault knows with a published, unexpired moderation key | MODERATION_RELAY_UNKNOWN |
| V07 | a received receipt, link or outcome statement carries a valid signature of the addressed relay and references an existing report and its statementDigest | FORBIDDEN |
| V08 | the report statement (header, sealed details and snapshot body) is at most 512 KiB; media travel as content-addressed references or separate sealed evidence attachments (F12.S01.M02) | PAYLOAD_TOO_LARGE |
| V09 | receive side: the signed relayId equals the receiving relay DID and the body is sealed to its current moderation key | FORBIDDEN |
| V10 | receive side: a reportId already held with a different statementDigest is refused; the same digest returns the stored receipt | IDEMPOTENCY_KEY_REUSED |
| V11 | a target of type message, offer or cycle_proposal is sent metadata_only unless the reporter approved a participant disclosure preview that reached export prepared (F12.S01.M02) | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-094-09.T02 | unit | PS-094-02.R01, PS-094-02.R02, PS-094-02.R03 | a report with an unknown field in the vault and at the relay; each rule V02–V11 violated in turn on vault and relay | unknown field returns VALIDATION_FAILED in both stores; the documented error code is returned and nothing is stored; unknown relay returns MODERATION_RELAY_UNKNOWN and a 513 KiB statement PAYLOAD_TOO_LARGE |
| TEST-PS-094-09.T17 | abuse | PS-094-02.R04 | relay X forwards a received report statement to relay Y; X receives a replay inside a new outer request | Y refuses with FORBIDDEN; X returns the stored receipt; no second case anywhere |
| TEST-PS-094-09.T23 | unit | PS-094-02.R02 | reporterClaim on an unsigned message; reporterClaim on a listing | message filed with disclosure reporter_claim and labelled; listing refused with MODERATION_TARGET_UNAVAILABLE |

## Dependencies

Module depends on: F12.S01.M02, F12.S02.M03, F12.S03.M03, F07.S02.M02, F08.S01.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
