# PS-148-09 — Contract and acceptance tests: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-09.R01** Every requirement is covered by at least one automated test.
- **PS-148-09.R02** Contract tests validate the report statement, commands and events against the registry and verify signatures.
- **PS-148-09.R03** Suppression is covered by property tests with at least 200 runs, 10 000 nightly, including differencing attacks.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay stub R with key KR, tenant_config listing operator keys O1 (compiler) and O2 (reviewer), non-operator key X, F12 event fixtures for the 2026-Q3 quarter with cells of 3, 7, 12, 45 and total 67, 5 duplicate events and vault-origin copies, decided events from R's operator and from another publisher, reader vault V, injected relay and vault clocks starting 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T01 | unit | PS-148-01.R01, PS-148-01.R02, PS-148-02.R01 | import the 2026-Q3 snapshot and compute | report immutable with contentCid and snapshotCid; counters hold closed-vocabulary dimensions only |
| TEST-PS-148-09.T02 | unit | PS-148-02.R02, PS-148-02.R03 | violate each rule V01-V15 | documented error code returned; nothing published |
| TEST-PS-148-09.T03 | property | PS-148-07.R03, PS-148-02.R05 | random counter tables, month and quarter series and v1/v2 correction pairs | no published cell between 1 and 9; complementary suppression and withheld totals prevent recovery; differencing across granularities is impossible because V10 rejects the second granularity; v1/v2 differences never reveal a value 1..9 |
| TEST-PS-148-09.T04 | property | PS-148-03.R01, PS-148-03.R03 | random lifecycle commands | only declared transitions; one published version per period; corrections supersede; terminal states never leave |
| TEST-PS-148-09.T05 | integration | PS-148-03.R02, PS-148-02.R04 | O1 publishes its own draft; O2 publishes; X countersigns; V receives each | GOVERNANCE_TRANSPARENCY_SELF_REVIEW for O1 and for X's report in V; O2's report verified with both signatures against the operator list |
| TEST-PS-148-09.T06 | contract | PS-148-04.R01, PS-148-04.R04, PS-148-09.R02 | import_snapshot, compute, request_review, publish, receive | statements validate against classrup.governance.transparency_counts/v1, transparency_draft/v1 and transparency_report/v1 and their F11.S01.M01 registry rows; signatures verify; published event valid |
| TEST-PS-148-09.T07 | integration | PS-148-04.R02, PS-148-06.R01 | deliver the same relay events twice and out of order, plus vault-origin copies, vault_filter spam events and decided events from another publisher | counts equal unique relay events; ignored events not counted; each operator decision counted once |
| TEST-PS-148-09.T08 | abuse | PS-148-05.R01, PS-148-05.R03, PS-148-01.R03 | member reads counters; non-operator computes; X requests a snapshot; inspect the sealed snapshot in transit | FORBIDDEN or NOT_FOUND; snapshot refused to X; counters only on the relay and the snapshot readable only by the requesting operator key |
| TEST-PS-148-09.T09 | chaos | PS-148-06.R03 | relay consumers stopped for 12 hours in the 92-day quarter; upload fails after signing | coverage computed as 99 percent from checkpoints and stated in the report; published locally with pending delivery and not shown publicly |
| TEST-PS-148-09.T10 | integration | PS-148-06.R01, PS-148-06.R02 | replay compute and publish with same key; recompute from the same snapshot in O2's vault | same contentCid; one published report |
| TEST-PS-148-09.T11 | abuse | PS-148-07.R01, PS-148-07.R02 | scan report, counters and logs for identifiers; advance the relay clock through a quarter, publication and 90 days | no identifiers or free text; counters survive until compile time and are purged exactly 90 days after publication |
| TEST-PS-148-09.T12 | abuse | PS-148-02.R01, PS-148-07.R01 | legal request with free text; 101 increments in a day | rejected by schema; RATE_LIMITED; scope key present in body |
| TEST-PS-148-09.T13 | load | PS-148-08.R01, PS-148-08.R02 | 1 000 000 counted events; relay 50 req/s | compute p95 <= 2 s, publish p95 <= 300 ms, download p95 <= 150 ms |
| TEST-PS-148-09.T14 | unit | PS-148-09.R01, PS-148-09.R03 | traceability tool run, nightly seeds | every PS-148 requirement maps to a passing test |
| TEST-PS-148-09.T15 | integration | PS-148-10.R01, PS-148-10.R02, PS-148-10.R03 | export operator vault, import to fresh vault, import tampered report and a self-reviewed report | reports and snapshots round-trip; tampered statement quarantined; self-reviewed report quarantined with GOVERNANCE_TRANSPARENCY_SELF_REVIEW; cell between 1 and 9 rejected |
| TEST-PS-148-09.T16 | a11y | PS-148-01.R01 | axe run on public report page | zero serious or critical issues; suppressed cells read as fewer than ten or withheld |
| TEST-PS-148-09.T17 | integration | PS-148-08.R03 | injected clock reaches periodEnd + 30 days without publication, then + 37 days | overdue alert raised at 30 days and repeated after 7 more days |
| TEST-PS-148-09.T18 | integration | PS-148-05.R02, PS-148-04.R03 | anonymous get_published on the relay; relay_upload by O2 with a two-key report, with a single-signature report and by X | anonymous read served; two-key upload stored with receipt; single-signature and X uploads refused |
| TEST-PS-148-09.T19 | integration | PS-148-04.R02, PS-148-01.R04, PS-148-03.R04 | F12 fixtures emit relay-local events through the quarter; relay freezes at periodEnd + 24 h; O1 and O2 each fetch the snapshot; O1 computes and requests review; O2 recomputes and publishes | both snapshots have the same snapshotCid; O2's recomputed contentCid equals O1's; the published report matches the event fixture after suppression |
| TEST-PS-148-09.T20 | abuse | PS-148-07.R04, PS-148-02.R05 | publish quarterly 2026-Q3 then compute 2026-08; publish a correction where one cell changes from 15 to 12 | monthly compute rejected with GOVERNANCE_TRANSPARENCY_PERIOD_INVALID; the changed cell is suppressed in v2 |
| TEST-PS-148-09.T21 | integration | PS-148-03.R02, PS-148-04.R03 | two different verified version-1 reports for 2026-Q3 reach V in either order | both marked conflicted; get_published returns conflicted true and neither is current |
| TEST-PS-148-09.T22 | contract | PS-148-01.R04, PS-148-04.R02 | compare the dimension vocabularies with the F12.S01.M01, F12.S02.M01, F12.S01.M03 and F12.S02.M02 event schemas | every enum value maps to one dimension and no dimension lacks a producer value |

## Acceptance criteria

- All tests T01-T22 pass in CI.
- No published cell reveals a count between 1 and 9 directly, through totals or by differencing across periods or versions, and totals under 10 hide all breakdowns.
- Every published report is computed from a relay-signed snapshot, signed by one operator key and countersigned by a different operator key of the same relay, verified by receivers, states its hosting scope and measured coverage, and corrections never overwrite earlier versions.

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
