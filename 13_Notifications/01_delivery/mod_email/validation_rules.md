# PS-102-02 — Validation rules: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-02.R01** Address input is validated for syntax, length and domain before storage and before any verification mail.
- **PS-102-02.R02** Sends are validated for consent, address status, template and rate before the transport port is called.
- **PS-102-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | address is at most 254 characters, has one @, a local part of at most 64 characters, a domain with at least one dot, no control characters and no display name | NOTIFY_EMAIL_ADDRESS_INVALID |
| V02 | the domain is not on the relay's disposable-domain blocklist and is not a local or reserved domain | NOTIFY_EMAIL_ADDRESS_INVALID |
| V03 | the user has a granted unexpired ChannelConsent for email at this relay | PRECONDITION_FAILED |
| V04 | verification token hash matches and verifyExpiresAt is in the future | EXPIRED |
| V05 | at most 5 verification emails per address per day and 1 per address per 60 seconds | RATE_LIMITED |
| V06 | templateKey is in the registry and the payload contains no free text | VALIDATION_FAILED |
| V07 | address status is verified for category mail and the daily cap of 20 emails per address is not exceeded | NOTIFY_EMAIL_NOT_DELIVERABLE |
| V08 | the relay has an EmailTransportPort configured | FEATURE_DISABLED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T01 | unit | PS-102-01.R01, PS-102-01.R02, PS-102-02.R01, PS-102-02.R02 | add valid, invalid and disposable-domain addresses | valid stored encrypted with masked output; invalid refused NOTIFY_EMAIL_ADDRESS_INVALID |
| TEST-PS-102-09.T02 | unit | PS-102-02.R03, PS-102-01.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing sent |
| TEST-PS-102-09.T10 | integration | PS-102-07.R03, PS-102-02.R03 | hard bounce, 3 soft bounces, complaint | address bouncing and sends stop; complaint withdraws email consent |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
