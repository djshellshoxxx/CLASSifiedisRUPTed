# PS-054-06 — Failure recovery and idempotency: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-06.R01** Token issuance and challenge consumption occur in one relay transaction so a crash never leaves a consumed challenge without a session or a session without consumption.
- **PS-054-06.R02** Revocation is idempotent and takes effect on the next request.
- **PS-054-06.R03** Vault unlock is local and works offline; relay sessions fail closed, and the client re-authenticates with the device key transparently.

## Specification

- **idempotency:** Revoke and lock are idempotent; start is single-use by challenge id (a replay returns UNAUTHENTICATED, not a second token); rotate returns a new token each call and invalidates the old one after 30 s.
- **concurrency:** Challenge consumption uses UPDATE status issued to consumed with row count check inside BEGIN IMMEDIATE; session limit enforcement is in the same transaction; two tabs coordinate unlock via Web Locks.
- **retries:** Clients retry challenge and start only on network errors and RATE_LIMITED with base 500 ms, cap 30 s, full jitter, max 6 attempts; a failed signature is never retried.
- **offline:** Vault unlock and lock work fully offline; relay token requests queue nothing and the UI shows 'relay unavailable' while local work continues.
- **partial failure:** If the relay cannot fetch the identity document it returns DEPENDENCY_UNAVAILABLE and consumes no challenge; if token storage fails the transaction rolls back and the challenge remains valid until expiry.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T04 | integration | PS-054-03.R03, PS-054-06.R01 | rotate a token | old token valid for 30 s then rejected; new token works; one transaction |
| TEST-PS-054-09.T09 | chaos | PS-054-06.R01, PS-054-06.R02, PS-054-06.R03 | crash between consume and insert; identity document fetch fails; storage failure | no consumed-without-session state; DEPENDENCY_UNAVAILABLE leaves the challenge valid |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
