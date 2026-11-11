# PS-054-02 — Validation rules: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-02.R01** A challenge is valid only if unexpired, unused, issued for the claimed DID and relay, and signed over the exact domain-separated message.
- **PS-054-02.R02** The signing key must be listed active in the DID's current signed identity document, verified per F07.S02.M01, re-fetched from the document's listed relays when the cached copy is older than 1 hour, or supplied inline on first login.
- **PS-054-02.R03** Every challenge or signature failure on the start path returns the same UNAUTHENTICATED outward response, with the specific reason only in relay diagnostics; EXPIRED is used only for a token past its absolute expiry.
- **PS-054-02.R04** Challenges are issued for every well-formed did:key, with caps per (DID, IP prefix) and oldest-first eviction, so an attacker can neither probe which DIDs a relay knows through the login endpoints nor lock a victim out by filling challenge slots.
- **PS-054-02.R05** Vault unlock enforces the idle timeout range and the local backoff schedule, and a passphrase change requires the current passphrase and a new one that passes the strength rule.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | challenge exists, status issued, expiresAt not passed, nonceHash matches the SHA-256 of the presented nonce | UNAUTHENTICATED |
| V02 | Ed25519 signature verifies over classrup-login:v1:<relayId>:<nonce> with the presented device public key | UNAUTHENTICATED |
| V03 | device public key is listed active in the DID's identity document verified per F07.S02.M01 (signed by the DID root key, highest seq seen), using an inline identityDocument stored first when the relay holds none | UNAUTHENTICATED |
| V04 | failed starts for the same (IP /24, DID) are fewer than 10 in 15 minutes and for the IP /24 fewer than 100 in 15 minutes | RATE_LIMITED |
| V05 | vault unlock idle timeout is between 1 minute and 8 hours | VALIDATION_FAILED |
| V06 | passphrase unlock attempts respect the local backoff schedule 1 s, 2 s, 4 s, up to 900 s after 5 failures | RATE_LIMITED |
| V07 | the session to revoke belongs to the caller's DID | NOT_FOUND |
| V08 | the document used for V03 was verified within the last hour, or was refreshed from its listed relays; when it is older than 24 hours and no listed relay answers, start fails without consuming the challenge | DEPENDENCY_UNAVAILABLE |
| V09 | did is a well-formed did:key with multicodec 0xed01; challenges are issued for every such DID regardless of whether the relay holds its document | VALIDATION_FAILED |
| V10 | change_passphrase - the current passphrase unlocks the keystore and the new passphrase has at least 12 characters or 4 words and differs from the current one | VALIDATION_FAILED |
| V11 | a token is used before its absoluteExpiresAt, and a rotating session's old token only until graceUntil | EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T01 | unit | PS-054-01.R01, PS-054-01.R02, PS-054-02.R01 | issue challenge then start with a valid signature | challenge consumed, session active, token returned once, only its hash stored |
| TEST-PS-054-09.T02 | unit | PS-054-02.R01, PS-054-02.R03, PS-054-09.R02 | signature over wrong relay, wrong nonce, wrong domain prefix, reused nonce, expired nonce (121 s), unknown challenge id, revoked device A2 | UNAUTHENTICATED with identical outward bodies for every case; reason class only in diagnostics; no token issued |
| TEST-PS-054-09.T05 | unit | PS-054-02.R05, PS-054-03.R02 | vault unlock with wrong passphrase 6 times then correct; idle timeout 0 and 9 h; idle 15 min | backoff schedule applied; VALIDATION_FAILED for out-of-range timeouts; unlock succeeds; auto-lock after 15 minutes measured with monotonic clock |
| TEST-PS-054-09.T11 | abuse | PS-054-02.R03, PS-054-02.R04 | unknown DID N and known DID A request challenges and start with bad signatures | both receive real challenges; start returns the same UNAUTHENTICATED body for both, timing within 10 percent |
| TEST-PS-054-09.T16 | abuse | PS-054-02.R04, PS-054-01.R01 | attacker network floods 60 challenges for A's DID; A requests from the victim network | A gets a real challenge; only the attacker's (DID, prefix) slots were evicted; per-DID cap of 50 evicts oldest first |
| TEST-PS-054-09.T17 | integration | PS-054-02.R02, PS-054-06.R03 | first login of N with an inline document; A's cached document 2 h old; cached document 30 h old with every listed relay down | N's document verified and stored, session started; A's document refreshed before V03; DEPENDENCY_UNAVAILABLE without consuming the challenge |
| TEST-PS-054-09.T19 | integration | PS-054-04.R01, PS-054-02.R05, PS-054-05.R01 | change_passphrase with a crash midway; then a full change; weak new passphrase | after the crash the old passphrase unlocks and the new does not; after success the old fails with UNAUTHENTICATED and other tabs are locked; weak passphrase VALIDATION_FAILED |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
