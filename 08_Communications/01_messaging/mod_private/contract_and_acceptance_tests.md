# PS-060-09 — Contract and acceptance tests: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-060-09.R02** Contract tests verify that vault and relay command inputs, outputs, statements and event payloads validate against schema registry entries.
- **PS-060-09.R03** Cryptographic round trips use fixed known-answer vectors plus property tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults A (devices A1, A2) and B (device B1), one in-memory relay R with mailboxes for A and B, active thread TH between A and B, fixed clock 2026-11-04T10:00:00Z, deterministic noble RNG seeded for vectors.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T01 | unit | PS-060-01.R01, PS-060-01.R02, PS-060-01.R04, PS-060-02.R01 | encrypt 8 192-byte plaintext on A1, wrap for A2 and B1, sign, decrypt on B1 | plaintext recovered; envelope fields have exact lengths; relay row contains no plaintext; createdAtClaim stored as claim |
| TEST-PS-060-09.T02 | property | PS-060-01.R02, PS-060-09.R03 | random plaintexts 1..8 192 bytes and random single-bit corruption of ciphertext, nonce or additional data | decryption succeeds unmodified and always fails when corrupted |
| TEST-PS-060-09.T03 | unit | PS-060-01.R03, PS-060-03.R02 | inbound envelope accepted, then author delete statement applied | body erased, tombstone kept, seq not reused |
| TEST-PS-060-09.T04 | unit | PS-060-02.R02, PS-060-02.R03 | each rule V02 to V10 violated in turn | documented error code returned and nothing stored |
| TEST-PS-060-09.T05 | property | PS-060-03.R01, PS-060-03.R03 | random sequences of send, relay outcomes, receipts and delete | syncState only moves forward as declared; deleted never returns; UI state equals highest reached state |
| TEST-PS-060-09.T06 | contract | PS-060-04.R01, PS-060-04.R02, PS-060-09.R02 | each vault command, relay command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-060-09.T07 | integration | PS-060-04.R03 | device key revoked and added events delivered, then send | revoked device excluded and new device wrapped for later sends only |
| TEST-PS-060-09.T08 | abuse | PS-060-05.R01, PS-060-05.R02, PS-060-05.R03 | fetch with unregistered key; put to unknown mailbox; statement signed by non-participant; relay operator tries to read blobs | UNAUTHENTICATED, NOT_FOUND or quarantine; operator sees only ciphertext |
| TEST-PS-060-09.T09 | integration | PS-060-06.R01, PS-060-06.R02 | 50 concurrent sends plus 10 replays of mailbox put and duplicate fetches | one envelope per messageId, contiguous seq, duplicates deduplicated |
| TEST-PS-060-09.T10 | e2e | PS-060-06.R03, PS-060-03.R01 | relay down for 4 days, then restored | messages stay prepared, then become transport acknowledged; recipient receives 30 messages in sender order; UI never shows delivered early |
| TEST-PS-060-09.T11 | abuse | PS-060-07.R01, PS-060-07.R03 | inspect relay database, logs and metrics after 1 000 messages; report a message | no plaintext or keys present; report contains plaintext only after confirmation |
| TEST-PS-060-09.T12 | abuse | PS-060-07.R02 | 61st send in a minute; 121st put in an hour; blocked recipient | RATE_LIMITED; blocker's vault drops silently and sender sees no error |
| TEST-PS-060-09.T13 | chaos | PS-060-06.R03 | one of two recipient mailboxes rejects with 503 while the other accepts | message stays prepared, accepted copy not re-sent, retry completes the other |
| TEST-PS-060-09.T14 | load | PS-060-08.R01, PS-060-08.R02, PS-060-08.R03 | 100 puts per second for 5 minutes then fetch of 100 envelopes then sweep of 50 000 | p95 within budgets, metrics exported |
| TEST-PS-060-09.T15 | unit | PS-060-09.R01 | traceability tool run | every PS-060 requirement maps to a passing test |
| TEST-PS-060-09.T16 | integration | PS-060-10.R01, PS-060-10.R02, PS-060-10.R03 | export, re-import into fresh vault, restore from backup | messages round trip identical; import quarantines envelopes with invalid signatures |
| TEST-PS-060-09.T17 | a11y | PS-060-04.R01 | conversation screen on mobile with screen reader | new message announced in polite region, sync state has text, zero serious axe issues |

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- A relay database and log dump after test traffic contains no plaintext, message keys or private keys.
- The sender UI never shows delivered or accepted before the matching relay receipt or signed peer acknowledgement exists.
- Documentation shown in the encryption info sheet states no forward secrecy, relay-visible metadata and that deletion cannot recall copies.

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
