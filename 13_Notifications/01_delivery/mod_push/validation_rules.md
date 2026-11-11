# PS-104-02 — Validation rules: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-02.R01** Subscribe input is validated for endpoint, keys, consent and limits before storage.
- **PS-104-02.R02** Send input is validated for payload shape and size before encryption.
- **PS-104-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | endpoint is https, at most 2 048 characters and its host is not a private, loopback or link-local address | VALIDATION_FAILED |
| V02 | p256dh decodes to 65 bytes starting with 0x04 and auth decodes to 16 bytes | VALIDATION_FAILED |
| V03 | the user has a granted unexpired ChannelConsent for push at this relay | PRECONDITION_FAILED |
| V04 | the user has fewer than 10 active subscriptions at this relay | NOTIFY_PUSH_SUBSCRIPTION_LIMIT |
| V05 | payload JSON is at most 1 024 bytes and contains only the keys v, ref, tpl, ck, urg | PAYLOAD_TOO_LARGE |
| V06 | tpl matches notify.tpl.<category>.<name> and ck is at most 32 base64url characters for the Topic header | VALIDATION_FAILED |
| V07 | subscribe is signed by a registered device key of the user and the relay VAPID key id is current | UNAUTHENTICATED |
| V08 | a user subscribes at most 10 times per day per relay | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T01 | unit | PS-104-01.R01, PS-104-01.R02, PS-104-01.R03, PS-104-02.R01, PS-104-02.R02 | subscribe with valid and malformed endpoint and keys | valid stored encrypted; invalid refused VALIDATION_FAILED; secrets absent from queries |
| TEST-PS-104-09.T02 | unit | PS-104-02.R03, PS-104-02.R01 | each rule V01 to V08 violated in turn including private-IP endpoint and 11th subscription | documented error code returned and nothing stored |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
