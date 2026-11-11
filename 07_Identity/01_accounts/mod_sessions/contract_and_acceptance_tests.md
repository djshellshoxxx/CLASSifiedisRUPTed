# PS-054-09 — Contract and acceptance tests: Sessions

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M02 Sessions](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/sessions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-054-09.R01** Every requirement is covered by at least one automated test with injected clock and fixed key pairs.
- **PS-054-09.R02** Signature tests include RFC 8032 vectors and negative cases for wrong domain, relay and nonce.
- **PS-054-09.R03** Privacy tests prove tokens and keys never appear in logs, events, URLs or exports.
- **PS-054-09.R04** Accessibility and UI copy tests check the unlock, passphrase and sessions screens, including the offline-guessing warning.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixed Ed25519 keys for DID A (devices A1 active, A2 revoked), DID N unknown to relay R, relay R with identity document cache and listed-relay fetch stub, attacker network 203.0.113.0/24 and victim network 198.51.100.0/24, fixed clock 2026-11-04T10:00:00Z, vault with passphrase fixture.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-054-09.T01 | unit | PS-054-01.R01, PS-054-01.R02, PS-054-02.R01 | issue challenge then start with a valid signature | challenge consumed, session active, token returned once, only its hash stored |
| TEST-PS-054-09.T02 | unit | PS-054-02.R01, PS-054-02.R03, PS-054-09.R02 | signature over wrong relay, wrong nonce, wrong domain prefix, reused nonce, expired nonce (121 s), unknown challenge id, revoked device A2 | UNAUTHENTICATED with identical outward bodies for every case; reason class only in diagnostics; no token issued |
| TEST-PS-054-09.T03 | property | PS-054-03.R01, PS-054-03.R02 | random sequences of issue, start, rotate, revoke, expire and eviction | only declared transitions succeed; ended sessions never revive; a challenge is consumed at most once |
| TEST-PS-054-09.T04 | integration | PS-054-03.R03, PS-054-04.R02, PS-054-06.R01 | rotate a token with an injected clock | old session rotating and accepted for 30 s, then revoked with reason rotated and identity.session.revoked emitted at grace end, not at the rotate call; new token works; one transaction |
| TEST-PS-054-09.T05 | unit | PS-054-02.R05, PS-054-03.R02 | vault unlock with wrong passphrase 6 times then correct; idle timeout 0 and 9 h; idle 15 min | backoff schedule applied; VALIDATION_FAILED for out-of-range timeouts; unlock succeeds; auto-lock after 15 minutes measured with monotonic clock |
| TEST-PS-054-09.T06 | contract | PS-054-04.R01, PS-054-04.R02 | each command and the query run | outputs and events validate against registry schemas; revoked reason values include rotated and passphrase_changed |
| TEST-PS-054-09.T07 | integration | PS-054-04.R03 | identity.device_key.revoked, identity.recovery.completed, security.role.assigned and erase cleanup delivered | vault queues revokes per relay and locks; relay ends role-affected sessions; documented reasons set |
| TEST-PS-054-09.T08 | abuse | PS-054-05.R01, PS-054-05.R02, PS-054-05.R03 | non-owner revokes another DID's session; unauthenticated rotate; role change on relay | NOT_FOUND or UNAUTHENTICATED; role change ends sessions on the next request |
| TEST-PS-054-09.T09 | chaos | PS-054-06.R01, PS-054-06.R02, PS-054-06.R03 | crash between consume and insert; revoke delivered twice; relay offline during local unlock | no consumed-without-session state; second revoke is a no-op; unlock works offline and the relay call fails closed |
| TEST-PS-054-09.T10 | abuse | PS-054-01.R03, PS-054-07.R01, PS-054-07.R02, PS-054-09.R03 | scan logs, events, URLs and exports for tokens, nonces, passphrases; 11 failed starts from one IP /24 for one DID | none found; relay sees only DID, key, prefix and UA label; 11th returns RATE_LIMITED |
| TEST-PS-054-09.T11 | abuse | PS-054-02.R03, PS-054-02.R04 | unknown DID N and known DID A request challenges and start with bad signatures | both receive real challenges; start returns the same UNAUTHENTICATED body for both, timing within 10 percent |
| TEST-PS-054-09.T12 | load | PS-054-08.R01, PS-054-08.R02, PS-054-08.R03 | 50 starts per second for 5 minutes; unlock on emulated Moto G | p95 <= 300 ms, verification <= 2 ms, unlock <= 1.5 s; metrics carry no DID labels |
| TEST-PS-054-09.T13 | a11y | PS-054-09.R04 | unlock, change passphrase and sessions screens with axe-core and keyboard only | zero serious or critical issues; backoff text announced politely |
| TEST-PS-054-09.T14 | unit | PS-054-09.R01 | traceability run over PS-054 | every requirement maps to a passing test |
| TEST-PS-054-09.T15 | integration | PS-054-10.R01, PS-054-10.R02, PS-054-10.R03 | vault export, relay backup restore and an additive v1 field read by the previous release | no tokens or vault key in exports; restored relay has hashes only and sessions expire naturally; older reader ignores the new field |
| TEST-PS-054-09.T16 | abuse | PS-054-02.R04, PS-054-01.R01 | attacker network floods 60 challenges for A's DID; A requests from the victim network | A gets a real challenge; only the attacker's (DID, prefix) slots were evicted; per-DID cap of 50 evicts oldest first |
| TEST-PS-054-09.T17 | integration | PS-054-02.R02, PS-054-06.R03 | first login of N with an inline document; A's cached document 2 h old; cached document 30 h old with every listed relay down | N's document verified and stored, session started; A's document refreshed before V03; DEPENDENCY_UNAVAILABLE without consuming the challenge |
| TEST-PS-054-09.T18 | integration | PS-054-04.R03, PS-054-05.R03 | injected clock - A1 revoked in the vault while sessions exist on relays R and S | vault publishes the new document to R and S and queues revokes; each relay ends A1's tokens within 60 s of storing the document with endReason device_revoked |
| TEST-PS-054-09.T19 | integration | PS-054-04.R01, PS-054-02.R05, PS-054-05.R01 | change_passphrase with a crash midway; then a full change; weak new passphrase | after the crash the old passphrase unlocks and the new does not; after success the old fails with UNAUTHENTICATED and other tabs are locked; weak passphrase VALIDATION_FAILED |
| TEST-PS-054-09.T20 | e2e | PS-054-07.R03, PS-054-09.R04 | UI copy check of unlock and change passphrase screens in every locale bundle | the offline-guessing warning and 'backoff is a convenience' text are present |
| TEST-PS-054-09.T21 | integration | PS-054-07.R04 | F10 export section, deletion plan and retention sweep with stub registries | section identity.sessions holds only the lock timeout; deletion ends sessions on known relays before keys are destroyed; ended sessions purged after 30 days |

## Acceptance criteria

- All tests T01-T21 pass in CI.
- Tokens, nonces, passphrases and vault keys never appear in storage as plaintext, logs, events or URLs (privacy suite).
- Idle and absolute expiry, rotation grace and device-revocation effects on every known relay are verified with an injected clock.
- Login endpoints answer identically for known and unknown DIDs, and a challenge flood from one network cannot lock a victim out.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
