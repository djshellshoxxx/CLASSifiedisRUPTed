# PS-054-09 — Contract and acceptance tests: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-09.R01** Every requirement is covered by at least one automated test with injected clock and fixed key pairs.
- **PS-054-09.R02** Signature tests include RFC 8032 vectors and negative cases for wrong domain, relay and nonce.
- **PS-054-09.R03** Privacy tests prove tokens and keys never appear in logs, events, URLs or exports.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixed Ed25519 keys for DID A (devices A1 active, A2 revoked), relay R with identity document cache, fixed clock 2026-11-04T10:00:00Z, vault with passphrase fixture.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T01 | unit | PS-054-01.R01, PS-054-01.R02, PS-054-02.R01 | issue challenge then start with a valid signature | challenge consumed, session active, token returned once, only its hash stored |
| TEST-PS-054-09.T02 | unit | PS-054-02.R01, PS-054-02.R02, PS-054-02.R03 | signature over wrong relay, wrong nonce, reused nonce, expired nonce (121 s), revoked device A2 | UNAUTHENTICATED or EXPIRED with identical outward bodies for key failures; no token issued |
| TEST-PS-054-09.T03 | property | PS-054-03.R01, PS-054-03.R02 | random sequences of start, rotate, revoke, expire on sessions and challenges | only declared transitions succeed; ended sessions never revive; a challenge is consumed at most once |
| TEST-PS-054-09.T04 | integration | PS-054-03.R03, PS-054-06.R01 | rotate a token | old token valid for 30 s then rejected; new token works; one transaction |
| TEST-PS-054-09.T05 | unit | PS-054-02.R02, PS-054-04.R01 | vault unlock with wrong passphrase 6 times then correct; idle timeout 15 min | backoff schedule applied; unlock succeeds; auto-lock after 15 minutes measured with monotonic clock |
| TEST-PS-054-09.T06 | contract | PS-054-04.R01, PS-054-04.R02, PS-054-09.R02 | each command and the query run | outputs and events validate against registry schemas |
| TEST-PS-054-09.T07 | integration | PS-054-04.R03, PS-054-02.R03 | device key revoked, recovery completed, role assigned, erase events delivered | affected sessions end with documented reasons |
| TEST-PS-054-09.T08 | abuse | PS-054-05.R01, PS-054-05.R02, PS-054-05.R03 | non-owner revokes another DID's session; unauthenticated rotate; role change on relay | NOT_FOUND or UNAUTHENTICATED; role change ends sessions |
| TEST-PS-054-09.T09 | chaos | PS-054-06.R01, PS-054-06.R02, PS-054-06.R03 | crash between consume and insert; identity document fetch fails; storage failure | no consumed-without-session state; DEPENDENCY_UNAVAILABLE leaves the challenge valid |
| TEST-PS-054-09.T10 | abuse | PS-054-01.R03, PS-054-07.R01, PS-054-07.R02, PS-054-07.R03 | scan logs, events, URLs and exports for tokens, nonces, passphrases; 11 failed starts from one IP /24 for one DID | none found; 11th returns RATE_LIMITED |
| TEST-PS-054-09.T11 | abuse | PS-054-07.R03, PS-054-02.R03 | unknown DID requests challenge and starts | decoy challenge returned; start returns the same UNAUTHENTICATED as a bad signature; timing within 10 percent |
| TEST-PS-054-09.T12 | load | PS-054-08.R01, PS-054-08.R02, PS-054-08.R03 | 50 starts per second for 5 minutes; unlock on emulated Moto G | p95 <= 300 ms, verification <= 2 ms, unlock <= 1.5 s |
| TEST-PS-054-09.T13 | a11y | PS-054-01.R01, PS-054-03.R01 | unlock screen and sessions list with axe-core and keyboard only | zero serious or critical issues; backoff text announced politely |
| TEST-PS-054-09.T14 | unit | PS-054-09.R01, PS-054-09.R03 | traceability run over PS-054 | every requirement maps to a passing test |
| TEST-PS-054-09.T15 | integration | PS-054-10.R01, PS-054-10.R02, PS-054-10.R03 | vault export and relay backup restore | no tokens or vault key in exports; restored relay has hashes only and sessions expire naturally |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Tokens, nonces, passphrases and vault keys never appear in storage as plaintext, logs, events or URLs (privacy suite).
- Idle and absolute expiry and device-revocation effects are verified with an injected clock.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
