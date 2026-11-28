# PS-064-09 — Contract and acceptance tests: Meetup coordination

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M03 Meetup coordination](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/coordination` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-064-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-064-09.R02** Contract tests check commands, signed statements and event payloads against the schema registry.
- **PS-064-09.R03** Fork and agreement logic is covered by deterministic multi-vault simulations.
- **PS-064-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults A, B and C with two-party thread TH (A, B) and cycle thread TC (A, B, C), safe spot S1 active and curator-verified, fixed clock 2026-11-04T10:00:00Z, proposal window 2026-11-07T14:00Z to 15:00Z in Europe/Berlin.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-064-09.T01 | unit | PS-064-01.R01, PS-064-01.R02, PS-064-01.R03, PS-064-02.R01 | A proposes a 1-hour window at spot S1 | Meetup stored proposed with proposalHash equal to the ID-3 cid of the JCS payload, spot snapshot and spotCid copied from the verified statement, and A's own agreement consent signed |
| TEST-PS-064-09.T02 | unit | PS-064-02.R02, PS-064-02.R03 | each rule V01 to V10 violated in turn including areaLabel 12 Main Street | documented error code returned and nothing stored |
| TEST-PS-064-09.T03 | property | PS-064-03.R01, PS-064-03.R02, PS-064-03.R03 | random sequences of propose, agree, revoke, reschedule, cancel, clock jumps | agreed only with all verified agreements for current hash; rescheduleCount never above 5; terminal states never change |
| TEST-PS-064-09.T04 | integration | PS-064-03.R01, PS-064-03.R02 | B agrees; A reschedules; B agrees to the new hash | agreed only after the second agreement, earlier agreement ignored for the new hash |
| TEST-PS-064-09.T05 | contract | PS-064-04.R01, PS-064-04.R02, PS-064-09.R02 | each command and the query execute | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-064-09.T06 | integration | PS-064-04.R03 | thread archived, block added by the local principal, cycle cancelled events | open meetups cancelled; blocker side silent |
| TEST-PS-064-09.T07 | abuse | PS-064-05.R01, PS-064-05.R02, PS-064-05.R03 | stranger-signed proposal; cancellation signed by non-party; relay operator inspects storage | quarantined; relay holds only ciphertext |
| TEST-PS-064-09.T08 | integration | PS-064-06.R01, PS-064-06.R02, PS-064-06.R03, PS-064-03.R05, PS-064-09.R03 | A and B reschedule concurrently while offline, then sync | two proposals with one revision from two proposers; meetup conflicted in both vaults, neither overwrites; agreeing a stale hash stored but ignored |
| TEST-PS-064-09.T09 | abuse | PS-064-07.R01 | area label with house number, coordinates in area label, 6th proposal from one party in a day at the receiver | COMMS_MEETUP_PLACE_INVALID and silent drop; no P3 stored |
| TEST-PS-064-09.T10 | integration | PS-064-07.R02, PS-064-06.R01 | sync states A to B with relay down then up | states prepared then transport acknowledged then peer accepted; UI text never ahead of state |
| TEST-PS-064-09.T11 | load | PS-064-08.R01, PS-064-08.R02, PS-064-08.R03 | 1 000 meetups sweep and 20-meetup thread render | budgets met |
| TEST-PS-064-09.T12 | unit | PS-064-09.R01 | traceability tool run | every PS-064 requirement maps to a passing test |
| TEST-PS-064-09.T13 | integration | PS-064-10.R01, PS-064-10.R02, PS-064-10.R03 | export, import into fresh vault, restore from backup | meetups, proposal statements and agreements round trip; invalid statements quarantined |
| TEST-PS-064-09.T14 | a11y | PS-064-09.R04 | propose and agree flow with screen reader and keyboard | statuses announced as text, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-064-09.T15 | integration | PS-064-03.R04, PS-064-01.R05, PS-064-09.R03 | two vaults: A proposes (A's consent included), B agrees; B revokes before windowStart; repeat with B trying to revoke after windowStart | agreed in both vaults; then proposed again in both (reason agreement_revoked); after windowStart the local revoke is refused because isCommitted is true |
| TEST-PS-064-09.T16 | integration | PS-064-03.R03, PS-064-09.R03 | conflicted meetup with two competing proposals; clock passes the first windowStart, then the second | still conflicted after the first, expired after the second |
| TEST-PS-064-09.T17 | integration | PS-064-02.R04 | propose at S1 with the verified snapshot; inbound proposal whose snapshot differs from the statement named by spotCid; area label with a house number | first accepted (a street-like accessNote in the verified statement is not checked by the house-number rule); second and third rejected with COMMS_MEETUP_PLACE_INVALID |
| TEST-PS-064-09.T18 | abuse | PS-064-02.R05 | A has blocked B; B proposes and later cancels | A's vault drops both silently; B's vault state and responses are identical to an unblocked control run |
| TEST-PS-064-09.T19 | unit | PS-064-07.R03 | open the propose and agree screens for the first time | the F08.S03.M01 checklist is shown before Send proposal and before the first Agree |
| TEST-PS-064-09.T20 | integration | PS-064-01.R04, PS-064-07.R04 | archive and purge thread TH after an agreed meetup, then re-verify; delete B's account | meetup, proposal statements and consents remain and re-verify; B's own vault pseudonymizes B's DID in its kept evidence while A's copy is unchanged |
| TEST-PS-064-09.T21 | contract | PS-064-04.R04, PS-064-04.R05 | registry entries for meetup and meetup_cancel; payloads of proposed, agreed and cancelled in TC | signer role party; every payload carries partyDids so notifications reach the other parties |
| TEST-PS-064-09.T22 | integration | PS-064-04.R06 | account deletion with open and elapsed meetups | DeletionPort plan pseudonymizes kept proposal statements and purges open meetups; export section comms.meetups present beforehand |

## Acceptance criteria

- All tests T01 to T22 pass in CI.
- A meetup is shown as agreed only when every party's consent, the proposer's included, verifies for the current proposal hash.
- No meetup field or event ever contains an exact address or live location.

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F08.S02.M02, F08.S03.M01, F06.S02.M01, F07.S02.M02, F16.S02.M02, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
