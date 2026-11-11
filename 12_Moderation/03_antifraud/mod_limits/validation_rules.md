# PS-098-02 — Validation rules: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-02.R01** Override input is validated strictly with bounded value, reason and expiry.
- **PS-098-02.R02** Limit checks validate the limit key and treat unknown keys as denied.
- **PS-098-02.R03** Every violation maps to one stable error code.
- **PS-098-02.R04** A check never accepts a caller-supplied count; usage comes only from F12.S03.M03 buckets the relay itself consumed for the subject key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | limitKey is in the enum and overrideValue is an integer 0..10000 | VALIDATION_FAILED |
| V02 | overrideReason 10..500 code points and expiry between 1 hour and 90 days | VALIDATION_FAILED |
| V03 | the overriding moderator's principal (F07.S02.M01 key set) is not the subject's principal | FORBIDDEN |
| V04 | expectedRevision matches the AccountLimit revision | CONFLICT_REVISION |
| V05 | check input has no currentCount or other usage field; usage is read only from the relay's own F12.S03.M03 buckets | VALIDATION_FAILED |
| V06 | usage after the check would not exceed the effective value | MODERATION_ACCOUNT_LIMIT_REACHED |
| V07 | submit_completion carries a classrup.commerce.deal_completion/v1 body with outcome completed and a valid signature from at least two distinct party keys, and the submitter is one of them | FORBIDDEN |
| V08 | a counted completion needs a counterparty whose principal differs from the submitter's, first seen on this relay at least 7 days ago, and no other counted completion for the same pair in 30 days | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T01 | unit | PS-098-01.R01, PS-098-01.R04, PS-098-02.R01 | tier table for A, B, C on the three limit keys; override for limitKey open_offers | A new (5, 20, 20), B established (20, 60, 100), C trusted (100, 200, 500); open_offers refused with VALIDATION_FAILED |
| TEST-PS-098-09.T03 | unit | PS-098-02.R01, PS-098-02.R03 | override with value 10001, short reason, expiry 91 days, M2 overriding its own second key | VALIDATION_FAILED, VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |
| TEST-PS-098-09.T07 | integration | PS-098-02.R02, PS-098-02.R04, PS-098-06.R02 | 6th index write in a day for tier new; check with an unknown limit key; check called with currentCount 0 for a key at its limit | MODERATION_ACCOUNT_LIMIT_REACHED with resetsAt; unknown key denied; VALIDATION_FAILED and no state change |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
