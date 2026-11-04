# PS-054-02 — Validation rules: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-02.R01** A challenge is valid only if unexpired, unused, issued for the claimed DID and relay, and signed over the exact domain-separated message.
- **PS-054-02.R02** The signing key must be listed active in the DID's current signed identity document held by the relay.
- **PS-054-02.R03** Every failure on the start path returns the same UNAUTHENTICATED outward response, with the specific reason only in relay diagnostics.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | challenge exists, status issued, expiresAt not passed, nonceHash matches the SHA-256 of the presented nonce | EXPIRED |
| V02 | Ed25519 signature verifies over classrup-login:v1:<relayId>:<nonce> with the presented device public key | UNAUTHENTICATED |
| V03 | device public key is listed active in the DID's identity document (valid signature by the account key, highest seq seen) | UNAUTHENTICATED |
| V04 | failed starts for the same (IP /24, DID) are fewer than 10 in 15 minutes and for the IP /24 fewer than 100 in 15 minutes | RATE_LIMITED |
| V05 | vault unlock idle timeout is between 1 minute and 8 hours | VALIDATION_FAILED |
| V06 | passphrase unlock attempts respect the local backoff schedule 1 s, 2 s, 4 s, up to 900 s after 5 failures | RATE_LIMITED |
| V07 | the session to revoke belongs to the caller's DID | NOT_FOUND |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T01 | unit | PS-054-01.R01, PS-054-01.R02, PS-054-02.R01 | issue challenge then start with a valid signature | challenge consumed, session active, token returned once, only its hash stored |
| TEST-PS-054-09.T02 | unit | PS-054-02.R01, PS-054-02.R02, PS-054-02.R03 | signature over wrong relay, wrong nonce, reused nonce, expired nonce (121 s), revoked device A2 | UNAUTHENTICATED or EXPIRED with identical outward bodies for key failures; no token issued |
| TEST-PS-054-09.T05 | unit | PS-054-02.R02, PS-054-04.R01 | vault unlock with wrong passphrase 6 times then correct; idle timeout 15 min | backoff schedule applied; unlock succeeds; auto-lock after 15 minutes measured with monotonic clock |
| TEST-PS-054-09.T07 | integration | PS-054-04.R03, PS-054-02.R03 | device key revoked, recovery completed, role assigned, erase events delivered | affected sessions end with documented reasons |
| TEST-PS-054-09.T11 | abuse | PS-054-07.R03, PS-054-02.R03 | unknown DID requests challenge and starts | decoy challenge returned; start returns the same UNAUTHENTICATED as a bad signature; timing within 10 percent |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
