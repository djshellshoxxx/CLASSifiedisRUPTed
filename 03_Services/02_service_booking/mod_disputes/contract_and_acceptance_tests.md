# PS-030-09 — Contract and acceptance tests: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-030-09.R02** Contract tests validate the notice statement, events and the F09 case port call against the schema registry.
- **PS-030-09.R03** Two-vault tests with a hostile relay cover duplicate, dropped and simultaneous notices.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - client C and provider P - with confirmed booking B, milestone M submitted but empty of files; stub F09.S02.M02 case port; fixed clock 2027-04-10T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T01 | unit | PS-030-01.R01, PS-030-01.R03, PS-030-02.R01, PS-030-02.R02, PS-030-02.R03 | rules V01–V07 each violated | documented code returned and nothing stored; notices with bad signature quarantined |
| TEST-PS-030-09.T02 | integration | PS-030-01.R02, PS-030-04.R01 | open dispute with 5 extra evidence references | evidence pack holds cids and hashes only; notice signed; case requested once |
| TEST-PS-030-09.T03 | property | PS-030-03.R01 | random event orders for case opened, resolved, withdraw and retry | only declared transitions succeed; terminal states never change |
| TEST-PS-030-09.T04 | integration | PS-030-03.R02, PS-030-04.R03 | commerce.dispute.opened then commerce.dispute.resolved consumed twice | link linked then resolved once; outcome stored; duplicates skipped |
| TEST-PS-030-09.T05 | integration | PS-030-03.R03, PS-030-04.R02 | services.dispute.opened consumed by quotes and milestones modules | booking disputed and milestones frozen exactly once |
| TEST-PS-030-09.T06 | integration | PS-030-06.R01, PS-030-06.R02 | case port fails 3 times; port succeeds on retry 2 | link_failed after 3 failures with no case; success path creates exactly one case |
| TEST-PS-030-09.T07 | integration | PS-030-06.R03, PS-030-09.R03 | crash between notice and link commit; both parties open simultaneously | neither or both persisted; links merge on scopeKey keeping earlier case cid |
| TEST-PS-030-09.T08 | contract | PS-030-04.R01, PS-030-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-030-09.T09 | abuse | PS-030-05.R01, PS-030-05.R02, PS-030-05.R03 | third party opens; notice signed by wrong key | FORBIDDEN or quarantine; no link created |
| TEST-PS-030-09.T10 | abuse | PS-030-07.R02, PS-030-07.R03 | 11 inbound notices from one sender; retaliatory second dispute on same scope | 11th dropped and counted; duplicate refused |
| TEST-PS-030-09.T11 | integration | PS-030-07.R01 | inspect logs, notifications and relay payloads during open | no statement text, no evidence names, ciphertext only at relay |
| TEST-PS-030-09.T12 | load | PS-030-08.R01, PS-030-08.R02, PS-030-08.R03 | 25 evidence items on throttled mobile profile | open p95 ≤ 200 ms, no telemetry request, UI slices ≤ 50 ms |
| TEST-PS-030-09.T13 | unit | PS-030-09.R01 | traceability tool run | every PS-030 requirement maps to a passing test |
| TEST-PS-030-09.T14 | integration | PS-030-10.R01, PS-030-10.R02, PS-030-10.R03 | export, import into fresh vault, restore | links and notices round-trip; in-flight pending_link re-enters retry |
| TEST-PS-030-09.T15 | e2e | PS-030-01.R01, PS-030-02.R01 | mobile client opens dispute, provider receives notice in second browser | both show linked with case reference; axe zero serious issues |

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No dispute outcome is ever decided by this module; only F09 resolution events change a link to resolved.
- Every opened dispute freezes approvals and fee claims exactly once and produces exactly one case.

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
