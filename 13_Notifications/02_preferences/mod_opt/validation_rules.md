# PS-107-02 — Validation rules: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-02.R01** Opt-in statements are validated for signer, channel, relay and expiry before the relay registers them.
- **PS-107-02.R02** Unsubscribe tokens are validated by constant-time hash comparison and scope.
- **PS-107-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | channel is push or email and the relay advertises that channel in its capability list | NOTIFY_CHANNEL_UNSUPPORTED |
| V02 | statement signature verifies against a registered device key of userDid and relayId equals the receiving relay | VALIDATION_FAILED |
| V03 | for push, a F13.S01.M01 subscription flow is initiated by the same user; for email the consent is recorded before any address is accepted | FORBIDDEN |
| V04 | privacyConsentId, when present, refers to a granted F10 consent for the notifications purpose | PRECONDITION_FAILED |
| V05 | unsubscribe token hash matches a granted consent for the scoped channel | NOTIFY_UNSUBSCRIBE_TOKEN_INVALID |
| V06 | a user changes consent at most 20 times per day per relay | RATE_LIMITED |
| V07 | a relay accepts at most 10 unsubscribe calls per minute per IP | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T01 | unit | PS-107-01.R01, PS-107-01.R02, PS-107-02.R01 | opt in to push on R and withdraw then re-grant | first record withdrawn terminal; re-grant creates a new record; statement signed |
| TEST-PS-107-09.T02 | unit | PS-107-01.R03, PS-107-02.R02, PS-107-02.R03 | each rule V01 to V07 violated in turn including email on R2 and token reuse | documented error code returned and state unchanged |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
