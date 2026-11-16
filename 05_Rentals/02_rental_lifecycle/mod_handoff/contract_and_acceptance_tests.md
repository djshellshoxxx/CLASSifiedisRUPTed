# PS-042-09 — Contract and acceptance tests: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-042-09.R02** Signature and cid binding is covered by unit and property tests including revision clearing.
- **PS-042-09.R03** Two-vault tests with a hostile in-memory relay cover duplicate, dropped, reordered and contradictory statements.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - owner O and renter R - with confirmed reservation B starting 2026-12-05T09:00:00Z; hostile in-memory relay; photo fixtures with and without GPS EXIF; fixed clock 2026-12-05T08:30:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T01 | unit | PS-042-01.R01, PS-042-01.R02, PS-042-01.R03, PS-042-02.R03 | build a report with 20 photos, strip EXIF, sign it | hashes computed after stripping; no GPS in stored bytes; cid stable |
| TEST-PS-042-09.T02 | unit | PS-042-02.R01, PS-042-02.R02 | each rule V01–V07 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-042-09.T03 | property | PS-042-03.R01 | random statement and event sequences | only declared transitions succeed; terminal states never change |
| TEST-PS-042-09.T04 | integration | PS-042-03.R02, PS-042-01.R03 | attest revision 2 after revision 3 exists; request changes then re-attest | RENTALS_REPORT_STALE; new revision clears attestations; attested only on the exact cid |
| TEST-PS-042-09.T05 | integration | PS-042-03.R03, PS-042-04.R03 | both parties sign offline at the meeting and sync later | attested when both signatures held; reservation endsAt unchanged; event emitted once per vault |
| TEST-PS-042-09.T06 | integration | PS-042-04.R01, PS-042-04.R02, PS-042-06.R01, PS-042-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested with identical cids; duplicates skipped |
| TEST-PS-042-09.T07 | contract | PS-042-04.R01, PS-042-04.R03, PS-042-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-042-09.T08 | abuse | PS-042-05.R01, PS-042-05.R02, PS-042-05.R03 | attestation by a non-party key; author attests own report; photo with GPS to relay | quarantined or FORBIDDEN; relay rejects GPS photo; no state change |
| TEST-PS-042-09.T09 | integration | PS-042-06.R02, PS-042-06.R03 | two authors submit revision 1 on forked devices; photo re-encode fails | handoff frozen for renegotiation; report not signed on failure |
| TEST-PS-042-09.T10 | abuse | PS-042-07.R01, PS-042-07.R02, PS-042-07.R03 | inspect logs, notifications, relay payloads; 101 inbound statements in a day | no item text or photos outside encrypted envelopes; 101st dropped and counted |
| TEST-PS-042-09.T11 | integration | PS-042-03.R01, PS-042-04.R03 | reservation cancelled mid-report; 24 h after start without attestation | handoff cancelled with drafts kept; handoff expired and reservation cancelled no_handoff |
| TEST-PS-042-09.T12 | load | PS-042-08.R01, PS-042-08.R02, PS-042-08.R03 | 2 000 handoffs; 20-photo report; throttled mobile profile | sign/verify p95 ≤ 120 ms, 5 MB photo ≤ 800 ms in worker, no telemetry request |
| TEST-PS-042-09.T13 | unit | PS-042-09.R01 | traceability tool run | every PS-042 requirement maps to a passing test |
| TEST-PS-042-09.T14 | integration | PS-042-10.R01, PS-042-10.R02, PS-042-10.R03 | export, import into fresh vault, restore | reports, attestations and photo references round-trip; missing attachments shown as missing |
| TEST-PS-042-09.T15 | e2e | PS-042-01.R01, PS-042-02.R01 | mobile owner and renter complete a handoff in two browsers | both show attested with the same fingerprint; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- A handoff is attested only when both signatures cover the same report cid, and any edit clears attestations.
- No stored or sent photo contains GPS or other metadata and the UI states that the attestation is not proof of condition.

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
