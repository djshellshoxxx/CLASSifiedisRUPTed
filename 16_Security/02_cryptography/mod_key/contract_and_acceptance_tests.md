# PS-128-09 — Contract and acceptance tests: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-128-09.R02** Cryptographic primitives are covered by known-answer tests from the standards and by round-trip property tests.
- **PS-128-09.R03** Tamper and downgrade attempts are covered by abuse tests.

## Specification

See the module test table below (all processes).

**Fixtures:** RFC 8032 Ed25519 vectors, RFC 7748 x25519 vectors, RFC 7914 scrypt vectors (reduced N for speed plus one full N=131072 run), XChaCha20-Poly1305 specification vectors, fixed random source for deterministic tests, Moto G CPU throttling profile.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T01 | unit | PS-128-01.R01, PS-128-01.R03, PS-128-02.R01, PS-128-04.R01 | create vault and derive principal and thumbprint for a known seed | did:key and key ID match independent vectors |
| TEST-PS-128-09.T02 | unit | PS-128-01.R01, PS-128-01.R02, PS-128-09.R02 | known-answer tests for Ed25519, x25519, scrypt and XChaCha20-Poly1305 | all standard vectors pass |
| TEST-PS-128-09.T03 | property | PS-128-01.R02, PS-128-06.R01 | random keys and passphrases wrapped and unwrapped; random bit flips in blob | round trip exact; any flip fails with SECURITY_UNLOCK_FAILED |
| TEST-PS-128-09.T04 | unit | PS-128-02.R02, PS-128-02.R03 | blob with N=1024; wrong version; missing salt | SECURITY_WRAPPED_KEY_INVALID before any derivation |
| TEST-PS-128-09.T05 | unit | PS-128-02.R01 | passphrases of 11 code points, a common entry, and a 12-code-point unique phrase | first two rejected with SECURITY_PASSPHRASE_WEAK; third accepted |
| TEST-PS-128-09.T06 | integration | PS-128-03.R01, PS-128-03.R03 | idle timer, tab hidden, 3 wrong unlocks | auto-lock at 15 min, hidden lock at 5 min, delays 1 s then 2 s then 4 s capped at 60 s, no wipe |
| TEST-PS-128-09.T07 | integration | PS-128-03.R02, PS-128-04.R03, PS-128-06.R03 | rotate key, interrupt after generation, resume | both keys valid, rotation pending shown, statement delivered later, old key revoked after overlap |
| TEST-PS-128-09.T08 | unit | PS-128-04.R03 | rotation statement signed only by the new key | SECURITY_ROTATION_INVALID |
| TEST-PS-128-09.T09 | abuse | PS-128-04.R02, PS-128-05.R01, PS-128-05.R02, PS-128-07.R01 | application code requests key bytes; sign while locked; call from other origin | no API returns key bytes; SECURITY_VAULT_LOCKED; unreachable cross-origin |
| TEST-PS-128-09.T10 | integration | PS-128-05.R03, PS-128-06.R02 | two tabs unlock concurrently; lock in one tab | one unlock proceeds at a time; other tab locks via BroadcastChannel |
| TEST-PS-128-09.T11 | chaos | PS-128-06.R01, PS-128-06.R03 | IndexedDB write fails during createVault; storage cleared after creation | nothing half-written; clear message about backup and recovery kit |
| TEST-PS-128-09.T12 | abuse | PS-128-07.R02, PS-128-07.R03 | nonce uniqueness over 1 000 000 wraps; export without passphrase re-entry; 6 exports in an hour | no duplicate nonce; export refused; 6th rate limited locally |
| TEST-PS-128-09.T13 | load | PS-128-08.R02, PS-128-08.R03 | unlock under Moto G throttling; 1 000 signs | unlock p95 ≤ 8 s with main-thread tasks ≤ 50 ms; sign p95 ≤ 25 ms |
| TEST-PS-128-09.T14 | unit | PS-128-08.R01, PS-128-09.R01, PS-128-09.R03 | traceability tool run; telemetry scan of network calls | every PS-128 requirement maps to a passing test; zero network calls from the library |
| TEST-PS-128-09.T15 | integration | PS-128-10.R01, PS-128-10.R02, PS-128-10.R03 | export backup, import on a fresh browser profile, downgrade attempt | same principal and fingerprint; wrong passphrase fails generically; older client rejects unknown version |

## Acceptance criteria

- All tests T01–T15 pass in CI with the pinned noble versions and standard known-answer vectors.
- Private key bytes are never returned by any API, logged or sent over the network (abuse and network tests).
- Unlock meets 8 s p95 on the Moto G profile without blocking the main thread beyond 50 ms per task.

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
