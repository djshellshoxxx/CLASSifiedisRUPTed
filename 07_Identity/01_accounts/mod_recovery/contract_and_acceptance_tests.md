# PS-053-09 — Contract and acceptance tests: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-09.R01** Every requirement is covered by at least one automated test with injected clock, fixed salts and fixed key pairs.
- **PS-053-09.R02** Cryptographic tests use known-answer vectors for scrypt, XChaCha20-Poly1305 and Ed25519 and fail on any parameter change.
- **PS-053-09.R03** Privacy tests prove that words and derived keys never reach storage, logs, events, exports or the network.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixed 24-word phrase (valid checksum), fixed salt and nonce, account A with devices D1 and D2, new device N, fixed clock 2026-11-04T10:00:00Z, scrypt known-answer vector.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T01 | unit | PS-053-01.R01, PS-053-01.R02, PS-053-02.R01 | create kit with fixed salt and nonce | blob decrypts with the derived key; record stores no words or keys; kdf equals scrypt N=131072 r=8 p=1 |
| TEST-PS-053-09.T02 | unit | PS-053-01.R02, PS-053-02.R01 | create kit with N=16384 or a 12-byte nonce | IDENTITY_KIT_PARAMS_INVALID; nothing stored |
| TEST-PS-053-09.T03 | unit | PS-053-02.R02, PS-053-02.R03 | words with wrong checksum, 23 words, unknown word, wrong file checksum, bit-flipped blob | IDENTITY_KIT_WORDS_INVALID or IDENTITY_KIT_CORRUPT without revealing which word |
| TEST-PS-053-09.T04 | property | PS-053-01.R03, PS-053-03.R01, PS-053-03.R02, PS-053-03.R03 | random sequences of create, begin, complete, cancel, expire | only declared transitions succeed; one active or pending kit; used and superseded are final |
| TEST-PS-053-09.T05 | integration | PS-053-03.R03, PS-053-02.R03 | begin with revokeOthers then complete at 71 h and at 72 h | IDENTITY_RECOVERY_WINDOW_OPEN at 71 h; success at 72 h with D1 and D2 revoked and statements queued |
| TEST-PS-053-09.T06 | integration | PS-053-03.R02, PS-053-04.R03 | begin then dispute statement from D2 | kit returns to active, contested identity flagged, cancelled event emitted |
| TEST-PS-053-09.T07 | contract | PS-053-04.R01, PS-053-04.R02, PS-053-09.R02 | every command, query and event run | outputs, statements and payloads validate against registry schemas; statement signatures verify |
| TEST-PS-053-09.T08 | integration | PS-053-04.R03, PS-053-06.R02 | begin registers a new device key through F07.S01.M01 | identity.device_key.added emitted by M01 once; revocations emitted on complete |
| TEST-PS-053-09.T09 | abuse | PS-053-05.R01, PS-053-05.R02, PS-053-05.R03 | locked vault creates a kit; dispute signed by a revoked key; relay tries to call begin | FORBIDDEN or rejected; relay has no capability |
| TEST-PS-053-09.T10 | chaos | PS-053-06.R01, PS-053-06.R02, PS-053-06.R03 | crash during begin, queue failure, replay of begin | no partial state; old kit intact; one pending record |
| TEST-PS-053-09.T11 | abuse | PS-053-07.R01, PS-053-07.R02, PS-053-07.R03 | inspect storage, events, logs, exports and network traces during create and begin | words and derived keys appear nowhere; no kit upload without the user's choice; 6th failed attempt triggers backoff |
| TEST-PS-053-09.T12 | load | PS-053-08.R01, PS-053-08.R02, PS-053-08.R03 | scrypt derivation on emulated Moto G and laptop | <= 1.5 s and <= 600 ms; create_kit <= 3 s |
| TEST-PS-053-09.T13 | a11y | PS-053-01.R01, PS-053-03.R01 | create and recover screens with axe-core and keyboard only | zero serious or critical issues; paste of full phrase works |
| TEST-PS-053-09.T14 | unit | PS-053-09.R01, PS-053-09.R03 | traceability run over PS-053 | every requirement maps to a passing test and crypto vectors are green |
| TEST-PS-053-09.T15 | integration | PS-053-10.R01, PS-053-10.R02, PS-053-10.R03 | export, import to a fresh vault, vault erase | kit metadata and blob round-trip; words never in export; erase leaves the printed kit valid |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- The 24 words and derived keys never appear in storage, logs, events, exports or network traffic (privacy suite).
- A recovery with revocation of other devices is impossible before 72 hours and a dispute from an existing device returns the kit to active.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
