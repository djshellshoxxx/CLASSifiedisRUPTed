# PS-065-09 — Contract and acceptance tests: Meetup handoff check-in

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M02 Meetup handoff check-in](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/handoff` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-065-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-065-09.R02** Contract tests verify commands, signed statements and event payloads against the schema registry.
- **PS-065-09.R03** A privacy test asserts that no location data and no share key reach any server.
- **PS-065-09.R04** Screens meet CTR-UX-001 (WCAG 2.2 AA, 44 px targets, explicit async states, polite announcements) and the a11y items listed for this module.

## Specification

See the module test table below (all processes).

**Fixtures:** Vaults A and B with agreed meetup M (window 2026-11-07T14:00Z to 15:00Z), in-memory relay R, app origin served from a static fixture with subresource integrity, fixed clock set per test, share key generator seeded for vectors.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-065-09.T01 | unit | PS-065-01.R01, PS-065-01.R02, PS-065-02.R01, PS-065-02.R03 | A checks in at 13:50 and with coordinates in the request | first stored checked_in with signed statement; second refused VALIDATION_FAILED; no coordinates stored |
| TEST-PS-065-09.T02 | unit | PS-065-02.R02, PS-065-02.R03 | each rule V01 to V12 violated in turn | documented error code returned and nothing stored |
| TEST-PS-065-09.T03 | property | PS-065-03.R01, PS-065-03.R02, PS-065-03.R03 | random sequences of check-in, report, cancel, expiry and clock jumps | terminal states never change; contradicted only as a flag; no_show only after checked-in reporter; share states only active to expired or revoked |
| TEST-PS-065-09.T04 | contract | PS-065-04.R01, PS-065-04.R02, PS-065-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-065-09.T05 | integration | PS-065-04.R03, PS-065-03.R01 | agreed event, cancellation event and a return to proposed (reschedule) delivered | pending records created, then voided with shares revoked |
| TEST-PS-065-09.T06 | abuse | PS-065-05.R01, PS-065-05.R02, PS-065-05.R03 | check-in signed by non-party; comms.meetup_share.delete with another device key; view with random share ID | quarantine, FORBIDDEN, NOT_FOUND |
| TEST-PS-065-09.T07 | integration | PS-065-06.R01, PS-065-06.R03 | check-in offline then reconnect; relay down at share update | local check-in kept; sync states advance prepared to transport acknowledged to peer accepted; share shows unavailable then updates |
| TEST-PS-065-09.T08 | integration | PS-065-06.R02, PS-065-06.R03 | no-show report and the accused's check-in arrive in both orders | both stored, contradicted true, no overwrite, status unchanged |
| TEST-PS-065-09.T09 | abuse | PS-065-01.R03, PS-065-01.R05, PS-065-07.R01, PS-065-07.R02, PS-065-09.R03 | capture all traffic and storage during check-ins of A and B and A's share creation | no location, no share key outside the fragment, the relay stores an opaque blob ≤ 2 048 bytes and no P3 field, and the decrypted snapshot holds A's own state but not B's |
| TEST-PS-065-09.T10 | abuse | PS-065-07.R03, PS-065-02.R04 | 6th no-show report in a day; report before grace period ends; 4th report from one reporter at the receiver | RATE_LIMITED as UX guard and COMMS_NO_SHOW_NOT_ALLOWED; receiver drops the 4th silently; reports labelled as claims in UI |
| TEST-PS-065-09.T11 | load | PS-065-08.R01, PS-065-08.R02, PS-065-08.R03 | 50 share views per second for 2 minutes and sweep of 10 000 expired shares | budgets met |
| TEST-PS-065-09.T12 | unit | PS-065-09.R01 | traceability tool run | every PS-065 requirement maps to a passing test |
| TEST-PS-065-09.T13 | integration | PS-065-10.R01, PS-065-10.R02, PS-065-10.R03 | export, import into fresh vault, restore relay from backup | check-ins round trip; shares import as expired; expired relay share blobs are not restored |
| TEST-PS-065-09.T14 | a11y | PS-065-09.R04 | check-in and share flows with screen reader | statuses announced as text, buttons reachable, targets ≥ 44 px, zero serious axe issues |
| TEST-PS-065-09.T15 | abuse | PS-065-04.R05, PS-065-07.R02 | open a share link; request the viewer path and any HTML or script from the relay origin | the viewer loads from the app origin with integrity-pinned assets; the relay serves no viewer code and answers only the ciphertext query |
| TEST-PS-065-09.T16 | integration | PS-065-03.R04 | report stored first, then the accused's check-in arrives; second run with the check-in stored first, then the report | first: comms.meetup.no_show then comms.meetup.no_show_contradicted once; second: comms.meetup.no_show with contradicted true and no separate contradiction event; record status stays as first reached |
| TEST-PS-065-09.T17 | integration | PS-065-01.R04, PS-065-07.R04 | archive and purge the thread 30 days after the meetup, then re-verify | check-in and report statements and the agreement consents remain and verify |
| TEST-PS-065-09.T18 | integration | PS-065-04.R06, PS-065-07.R04 | account deletion of B with an active share and kept check-ins | the share blob is deleted while keys exist; B's own kept evidence carries the pseudonym after privacy.deletion.completed; A's copy unchanged |
| TEST-PS-065-09.T19 | contract | PS-065-04.R04, PS-065-03.R02 | registry entries for checkin and no_show_report; share expiry | signer roles listed; expiry deletes the relay blob and emits comms.meetup_share.revoked with reason expired |

## Acceptance criteria

- All tests T01 to T19 pass in CI.
- Network and storage captures show no location data and no share key reaching a server, and no relay response contains viewer code.
- No UI text states that someone was at the place; it states that they reported arriving.
- A no-show is always displayed as a claim of its reporter, and a contradicted claim is always shown with the contradicting check-in.

## Dependencies

Module depends on: F08.S03.M03, F08.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
