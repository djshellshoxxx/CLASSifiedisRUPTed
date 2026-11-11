# PS-053-09 — Contract and acceptance tests: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-09.R01** Every requirement is covered by at least one automated test with injected clock, fixed salts and fixed key pairs.
- **PS-053-09.R02** Cryptographic tests use known-answer vectors for scrypt, XChaCha20-Poly1305 and Ed25519 and fail on any parameter change.
- **PS-053-09.R03** Privacy tests prove that words and derived keys never reach storage, logs, events, exports or the network.
- **PS-053-09.R04** Abuse tests cover a modified client, concurrent recoveries in isolated vaults, repeated disputes by a stolen device and disputes arriving after completion.
- **PS-053-09.R05** Accessibility and UI copy tests check the kit and recovery screens, including the honest texts about kit possession, superseded kits and the notice window.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixed 24-word phrase (valid checksum), fixed salt and nonce, account A with root device D1 and device D2, new devices N1 and N2, peer vault P, fixed clock 2026-11-04T10:00:00Z, scrypt known-answer vector, relay harness that can delay delivery.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T01 | unit | PS-053-01.R01, PS-053-01.R02, PS-053-02.R01, PS-053-09.R02 | create kit with fixed salt and nonce | blob decrypts with the derived key (known-answer vectors); record stores no words or keys; kdf equals scrypt N=131072 r=8 p=1; docHint embedded |
| TEST-PS-053-09.T02 | unit | PS-053-01.R02, PS-053-02.R01 | create kit with N=16384 or a 12-byte nonce | IDENTITY_KIT_PARAMS_INVALID; nothing stored |
| TEST-PS-053-09.T03 | unit | PS-053-02.R03 | words with wrong checksum, 23 words, unknown word, wrong file checksum, bit-flipped blob | IDENTITY_KIT_WORDS_INVALID or IDENTITY_KIT_CORRUPT without revealing which word |
| TEST-PS-053-09.T04 | property | PS-053-01.R03, PS-053-03.R01, PS-053-03.R02 | random sequences of create, begin, complete, cancel, dispute and expiry | only declared transitions succeed; one active, pending or contested kit per vault; used and superseded are final |
| TEST-PS-053-09.T05 | integration | PS-053-03.R03, PS-053-02.R02 | honest client - begin with revokeOthers, complete at 71 h and at 72 h; peer P first saw the notice 10 h after begin | IDENTITY_RECOVERY_WINDOW_OPEN at 71 h; success at 72 h; P shows recovery pending and applies the revocation only at 82 h after begin |
| TEST-PS-053-09.T06 | integration | PS-053-03.R02, PS-053-05.R02 | begin, then a verified dispute from D2 arrives in the recovering vault | kit contested; complete refused with IDENTITY_RECOVERY_WINDOW_OPEN before 7 days and allowed at 7 days with contested true; the new key is not revoked |
| TEST-PS-053-09.T07 | contract | PS-053-04.R01, PS-053-09.R02 | every command, query and event run | outputs, statements and payloads validate against registry schemas; notice signed by the root key and dispute by a device key verify |
| TEST-PS-053-09.T08 | integration | PS-053-04.R03, PS-053-06.R02 | begin registers the new key through registerRecoveredKey; then begin with 10 active keys | identity.device_key.added emitted once by F07.S01.M01; revocations emitted on complete; IDENTITY_DEVICE_LIMIT with nothing stored; outbox states shown honestly |
| TEST-PS-053-09.T09 | abuse | PS-053-05.R01, PS-053-05.R03 | locked vault creates a kit; relay tries to call begin or dispute | FORBIDDEN or rejected; relay has no capability |
| TEST-PS-053-09.T10 | chaos | PS-053-06.R01, PS-053-06.R03 | crash during begin, queue failure, replay of begin | no partial state; old kit intact; one pending record; no key revoked |
| TEST-PS-053-09.T11 | abuse | PS-053-04.R02, PS-053-07.R01, PS-053-07.R02, PS-053-09.R03 | inspect storage, events, logs, exports and network traces during create and begin | words and derived keys appear nowhere; no kit upload without the user's choice; relays receive only signed public or encrypted items |
| TEST-PS-053-09.T12 | load | PS-053-08.R01, PS-053-08.R02, PS-053-08.R03 | scrypt derivation on emulated Moto G and laptop | <= 1.5 s and <= 600 ms; create_kit <= 3 s; counters hold no secrets |
| TEST-PS-053-09.T13 | a11y | PS-053-09.R05 | create and recover screens and the notice banner with axe-core and keyboard only | zero serious or critical issues; paste of the full phrase fills all 24 fields; no field sets autocomplete off or blocks paste; file chooser and QR scan are labelled and keyboard reachable |
| TEST-PS-053-09.T14 | unit | PS-053-09.R01 | traceability run over PS-053 | every requirement maps to a passing test |
| TEST-PS-053-09.T15 | integration | PS-053-10.R01, PS-053-10.R02, PS-053-10.R03 | export, import to a fresh vault, vault erase, and a stronger-KDF kit version next to a v1 kit | kit metadata and blob round-trip; words never in export; erase leaves the printed kit valid; v1 kit still recovers |
| TEST-PS-053-09.T16 | abuse | PS-053-09.R04, PS-053-03.R03 | modified client completes at t+0 and publishes a revoking document whose issuedAt is before the notice's notBefore claim | peers mark the DID contested and keep D1 and D2 active |
| TEST-PS-053-09.T17 | integration | PS-053-09.R04, PS-053-02.R02, PS-053-05.R02 | two isolated vaults begin offline from the same kit with N1 and N2; a second begin inside one vault | both succeed locally; after sync receivers see two notices for one DID and freeze it as contested; the second begin in one vault returns CONFLICT_STATE |
| TEST-PS-053-09.T18 | integration | PS-053-04.R04 | offline begin in an empty vault without a latest document and revokeOthers true, then with device_list_unknown, then reconnect | DEPENDENCY_UNAVAILABLE first; unknown mode adds the key and plans no revocation; after reconnect the fetched document is verified and a seq collision is reported as a fork |
| TEST-PS-053-09.T19 | abuse | PS-053-09.R04, PS-053-02.R04 | stolen D2 sends 5 disputes within 24 h | one processed, four quarantined with RATE_LIMITED; recovery contested and completed after 7 days with D2 revoked and contested visible to peers |
| TEST-PS-053-09.T20 | integration | PS-053-03.R04, PS-053-02.R04 | existing device D2 without a kit record receives the notice, disputes it; a second notice for the same DID within 24 h; a dispute signed by revoked key D3 | observed record received then disputed and dispute queued; second notice quarantined and the DID contested; D3 dispute IDENTITY_RECOVERY_STATEMENT_INVALID |
| TEST-PS-053-09.T21 | integration | PS-053-09.R04 | a dispute from D2 arrives after the recovering vault completed | recovering vault stays used and stores the dispute as evidence; peers mark the DID contested |
| TEST-PS-053-09.T22 | integration | PS-053-03.R02 | pending recovery not completed for 7 days | kit back to active; new key kept and announced; planned revocations dropped; identity.recovery.cancelled with reason expired |
| TEST-PS-053-09.T23 | unit | PS-053-01.R03, PS-053-07.R03 | create kit 2 after kit 1, then decrypt kit 1 | kit 1 superseded locally but still decrypts the root seed; the UI copy states that superseding does not revoke the old kit |
| TEST-PS-053-09.T24 | integration | PS-053-07.R04 | F10 export section, deletion plan and retention sweep with stub registries; notice to a relay without federation_publish consent | section identity.recovery_kit exported; observed notices and disputes pseudonymized, not deleted; notice delivered only to own mailboxes or as a file |
| TEST-PS-053-09.T25 | e2e | PS-053-09.R05, PS-053-07.R03 | UI copy check of create kit, recover and banner screens in every locale bundle | texts about kit possession, separate storage, superseded kits, receivers' 72 h wait and contested recoveries are present |
| TEST-PS-053-09.T26 | integration | PS-053-04.R05 | create_kit on root device D1; device D2 receives the notice; a forged notice signed by revoked key D3; the same notice twice | D2 records kit_observed and emits identity.recovery.kit_created with actor.kind federated, provenance { signerKey, statementCid } and origin other_device; D1's event has origin this_device; D3's notice IDENTITY_RECOVERY_STATEMENT_INVALID; the duplicate is a no-op; no notice contains words, blob or verifier |
| TEST-PS-053-09.T27 | e2e | PS-053-04.R06, PS-053-02.R03 | begin with the kit QR scanned from the printed sheet, with the kit file, with the whole phrase pasted into the first field, and with a QR core that has one changed byte | QR and file give the same kit core and recover; the pasted phrase fills all 24 fields; the changed core IDENTITY_KIT_CORRUPT |

## Acceptance criteria

- All tests T01-T27 pass in CI.
- The 24 words and derived keys never appear in storage, logs, events, exports or network traffic (privacy suite).
- Honest clients and verifying vaults that saw the notice do not apply a recovery revocation before 72 hours after their own first sight of it, a dispute makes the recovery contested for every receiver without cancelling it, and the documentation states that an attacker with the words and file can sign as the account.
- The UI and these criteria state that creating a new kit does not revoke an older kit.

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
