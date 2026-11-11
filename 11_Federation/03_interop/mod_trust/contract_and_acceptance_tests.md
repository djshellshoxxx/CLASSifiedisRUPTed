# PS-091-09 — Contract and acceptance tests: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-091-09.R02** Security tests cover SSRF, key substitution, health-based suspension, unsolicited offers and opt-in on both sides.
- **PS-091-09.R03** Contract tests validate commands, statements, events and the Peer record against registry schemas.

## Specification

See the module test table below (all processes).

**Fixtures:** Relays A and B with fixed key seeds, vault V with selected relay A, author X forking through A and B, fake clock 2026-11-04T10:00:00Z, DNS stub returning public and private addresses.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T01 | integration | PS-091-03.R04, PS-091-01.R01, PS-091-04.R02 | A proposes to B; B's receive_offer stores an inbound proposed Peer; B's operator accepts with fingerprint confirmed; A's receive_accept verifies it | both Peer rows active with both opt-in flags and fingerprintConfirmedAt; federation.peer.added emitted on both sides |
| TEST-PS-091-09.T02 | unit | PS-091-02.R01, PS-091-02.R03 | each rule V01–V11 violated | documented error code and no Peer created or changed |
| TEST-PS-091-09.T03 | abuse | PS-091-02.R01, PS-091-07.R03 | base URL with private IP, http scheme, redirect and DNS rebinding after creation | FEDERATION_PEER_URL_INVALID on each request |
| TEST-PS-091-09.T04 | abuse | PS-091-02.R02, PS-091-09.R02 | peer presents different key with and without rotation statement | mismatch refused and suspended; valid rotation accepted for the 7-day overlap |
| TEST-PS-091-09.T05 | property | PS-091-03.R01, PS-091-03.R02, PS-091-03.R03 | random command sequences on one Peer | only declared transitions succeed; removed and expired never change; active requires both opt-ins |
| TEST-PS-091-09.T06 | integration | PS-091-03.R03 | outbound proposal and inbound offer not accepted for 14 days | both expired by the sweep; a new proposal creates a new Peer |
| TEST-PS-091-09.T07 | integration | PS-091-04.R03, PS-091-07.R01, PS-091-09.R02 | peer P forwards 6 envelopes with invalid signatures, then two conflicts among statements signed by P's relay key within 24 h | health drops by 25 (cap) then 20; suspension with reason equivocation and federation.peer.suspended emitted |
| TEST-PS-091-09.T08 | contract | PS-091-04.R01, PS-091-04.R05, PS-091-09.R03 | each command, query and event; peer_offer, peer_accept, key_rotation and relay_identity statements | validate against registry schemas and signer roles of F11.S01.M01 |
| TEST-PS-091-09.T09 | abuse | PS-091-05.R01, PS-091-05.R02, PS-091-05.R03 | non-operator manages peers on relay; external call to resolve_key; other vault reads relay list | FORBIDDEN or FEDERATION_PEER_NOT_ALLOWED or NOT_FOUND; operator change logged |
| TEST-PS-091-09.T10 | integration | PS-091-06.R01, PS-091-06.R03 | replay propose and accept with same Idempotency-Key; identity fetch ok but offer delivery fails | original responses replayed; Peer remains proposed |
| TEST-PS-091-09.T11 | chaos | PS-091-06.R03 | peer store unavailable during inbox handling | DEPENDENCY_UNAVAILABLE fail closed; nothing accepted |
| TEST-PS-091-09.T12 | abuse | PS-091-07.R01, PS-091-07.R02, PS-091-01.R02 | inspect peer rows, logs, federation payloads and the relay chooser; toggle 'List in my identity document' on for one relay and off for another | no user data in peer rows; chooser states IP and did:key visibility and exactly which relays the identity document publishes; only the listed relay appears in the next portable document |
| TEST-PS-091-09.T13 | abuse | PS-091-02.R04, PS-091-07.R03 | 11 outbound proposals in an hour; 6 inbound offers in a day from one /24; an 8193-byte offer; an offer self-signed by a different key; quota breach 10 times | rate limit on the 11th and the 6th, PAYLOAD_TOO_LARGE, FED_SIGNATURE_INVALID with nothing stored; health reduced by 2 per 10 breaches |
| TEST-PS-091-09.T14 | load | PS-091-08.R01, PS-091-08.R02, PS-091-08.R03 | 500 health events per second and 10 000 resolve_key calls | resolve_key p95 ≤ 2 ms, gauges exported, alert on automatic suspension |
| TEST-PS-091-09.T15 | a11y | PS-091-03.R02 | operate relay chooser, inbound offer queue and reinstate dialog by keyboard and screen reader | fingerprint read in groups, targets ≥ 44 px, status announced, reinstate requires a fresh fingerprint check |
| TEST-PS-091-09.T16 | unit | PS-091-09.R01 | traceability tool run | every PS-091 requirement maps to a passing test |
| TEST-PS-091-09.T17 | integration | PS-091-10.R01, PS-091-10.R02, PS-091-10.R03 | export peers, import into fresh relay, restore backup | peers import as proposed or suspended and require re-confirmation; no active peer is created by import |
| TEST-PS-091-09.T18 | unit | PS-091-01.R03 | rotate peer key, then sign with the previous key 6 days 23 h later and 7 days 1 min later | first accepted; second FEDERATION_KEY_MISMATCH |
| TEST-PS-091-09.T19 | abuse | PS-091-04.R04 | malicious author forks twice via honest relays A and B; throwaway did:keys trigger FEDERATION_SIGNER_ROLE_INVALID, FEDERATION_NOT_ACCEPTED and gap codes through peer A | no health change and no suspension for A or B |
| TEST-PS-091-09.T20 | integration | PS-091-02.R02, PS-091-03.R04 | vault selects relay R: fetch and verify its relay_identity statement, user confirms fingerprint; then a tampered identity statement | active without any per-user accept; the tampered one FEDERATION_KEY_MISMATCH |
| TEST-PS-091-09.T21 | integration | PS-091-06.R02 | crash injected after an envelope acceptance but before commit, and after commit | neither counter nor acceptance persisted in the first case, both in the second; counted envelopes equal accepted envelopes |
| TEST-PS-091-09.T22 | unit | PS-091-07.R04 | export, deletion and retention ports called by F10; privacy.deletion.completed in a vault | selected-relay section exported without secrets; list deleted; relay peers untouched |
| TEST-PS-091-09.T23 | integration | PS-091-04.R03 | flag F11 off then on | peer_relay health frozen and peers dormant; selected relays keep working; scores resume |
| TEST-PS-091-09.T24 | contract | PS-091-04.R06 | activate a peer; apply a verified key_rotation; apply a rotation signed by a non-pinned key | federation.peer.added carries relayKey; federation.peer.key_rotated carries oldRelayKey, newRelayKey, effectiveAt and previousKeyUntil in the same transaction as the update; the invalid rotation FEDERATION_KEY_MISMATCH and no event |

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No peer becomes active without both sides' signed opt-in (or a selected relay's signed identity statement) and a recorded fingerprint confirmation.
- SSRF, key substitution and unsolicited-offer tests pass, and no honest relay is penalized for an author's fork.

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
