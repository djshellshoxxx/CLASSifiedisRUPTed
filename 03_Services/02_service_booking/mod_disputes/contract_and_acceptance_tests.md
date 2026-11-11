# PS-030-09 — Contract and acceptance tests: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-030-09.R02** Contract tests validate the notice and withdrawal statements, events and the F09 case port calls against the schema registry.
- **PS-030-09.R03** Two-vault tests with a hostile relay cover duplicate, dropped and simultaneous notices.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults - client C and provider P - with confirmed booking B, milestone M submitted but empty of files; real F09.S02.M02 in each vault behind the case port with fault injection; fixed clock 2027-04-10T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T01 | unit | PS-030-01.R01, PS-030-01.R03, PS-030-02.R01, PS-030-02.R03 | rules V01–V10 each violated | documented code returned and nothing stored; notices with bad signature quarantined |
| TEST-PS-030-09.T02 | integration | PS-030-01.R02, PS-030-04.R01 | open dispute with 5 extra evidence references | evidence pack holds cids and hashes only; notice signed; case requested once through the port with contextRef booking, serviceScope and the link id |
| TEST-PS-030-09.T03 | property | PS-030-03.R01 | random event orders for case opened, resolved, withdrawn, retry and timeout | only declared transitions succeed; terminal states never change |
| TEST-PS-030-09.T04 | integration | PS-030-03.R02, PS-030-04.R03 | each F09 outcome - no_fault_close accepted by both and mediator-only, refund_claimed, return_agreed, enforcement_referral, lapsed - and commerce.dispute.withdrawn, each delivered twice | link resolved or withdrawn once; resolution stored; services.dispute.closed carries the mapped effect; booking and milestone back in their pre-dispute status; no obligation changed |
| TEST-PS-030-09.T05 | integration | PS-030-03.R03, PS-030-04.R02 | services.dispute.opened, then the matching commerce.dispute.resolved, consumed by the quotes and milestones modules while services.dispute.closed is emitted here | booking disputed and milestones frozen exactly once, then unfrozen exactly once; exactly one opened and one closed event per link |
| TEST-PS-030-09.T06 | integration | PS-030-06.R01, PS-030-06.R02 | case port fails 3 times; then a run where it succeeds on retry 2; then a new open after link_failed | link_failed after 3 failures with no case; success path creates exactly one case; the new open is accepted |
| TEST-PS-030-09.T07 | integration | PS-030-06.R03, PS-030-09.R03 | crash between notice and link commit; both parties open simultaneously in two vaults | neither or both persisted; exactly one non-withdrawn case remains, the one with the smaller noticeCid, and the other opener withdrew its case |
| TEST-PS-030-09.T08 | contract | PS-030-04.R01, PS-030-09.R02 | each command, statement, event and F09 port call | payloads and signatures validate against registry and F09 schemas |
| TEST-PS-030-09.T09 | abuse | PS-030-05.R01, PS-030-05.R02, PS-030-05.R03 | third party opens; notice signed by wrong key | FORBIDDEN or quarantine; no link created |
| TEST-PS-030-09.T10 | abuse | PS-030-07.R02 | 11 inbound notices from one sender; retaliatory second dispute on the same scope | 11th dropped and counted; duplicate refused |
| TEST-PS-030-09.T11 | integration | PS-030-07.R01 | inspect logs, notifications and relay payloads during open | no statement text, no evidence names, ciphertext only at relay |
| TEST-PS-030-09.T12 | load | PS-030-08.R01, PS-030-08.R02, PS-030-08.R03 | 25 evidence items on throttled mobile profile | open p95 ≤ 200 ms, no telemetry request, UI slices ≤ 50 ms |
| TEST-PS-030-09.T13 | unit | PS-030-09.R01 | traceability tool run | every PS-030 requirement maps to a passing test |
| TEST-PS-030-09.T14 | integration | PS-030-10.R01, PS-030-10.R02, PS-030-10.R03 | export, import into fresh vault, restore | links and notices round-trip; in-flight pending_link re-enters retry with the same link id |
| TEST-PS-030-09.T15 | e2e | PS-030-01.R01, PS-030-02.R01 | mobile client opens dispute, provider receives notice in second browser | both show linked with case reference; axe zero serious issues |
| TEST-PS-030-09.T16 | integration | PS-030-07.R03 | open a dispute and inspect outbound traffic and local events | no relay-public projection, no tombstone and no F07 event is produced |
| TEST-PS-030-09.T17 | abuse | PS-030-02.R02 | inbound notice 60 days after booking end, one over the per-booking limit, and a duplicate scope | each quarantined in the receiving vault; no link, no services.dispute.opened, no freeze |
| TEST-PS-030-09.T18 | integration | PS-030-03.R01, PS-030-03.R03 | two vaults - open then withdraw while pending_link, and open then withdraw while linked | both vaults unfrozen; the linked withdrawal called commerce.dispute.withdraw; one services.dispute.closed per vault |
| TEST-PS-030-09.T19 | integration | PS-030-02.R02, PS-030-03.R03 | counterparty receives a valid notice but no case statement for 7 days | link_failed, nothing frozen, services.dispute.closed with reason link_failed |
| TEST-PS-030-09.T20 | unit | PS-030-02.R01 | payment_not_received on a cancelled booking with an approved unsettled milestone; no_show with a milestoneId; quality without one | first allowed; the other two VALIDATION_FAILED |
| TEST-PS-030-09.T21 | abuse | PS-030-05.R02 | notice from a locally blocked party of an existing booking | quarantined for review with no notification, not dropped |
| TEST-PS-030-09.T22 | integration | PS-030-07.R04 | privacy.deletion.completed for the counterparty; export | counterparty pseudonymized; export section services.disputes present |

## Acceptance criteria

- All tests T01–T22 pass in CI.
- No dispute outcome is ever decided by this module; only F09 resolution and withdrawal events close a linked link, and no effect changes an obligation.
- Every opened dispute freezes approvals and fee claims exactly once, produces exactly one non-withdrawn case and is unfrozen exactly once when the case closes.

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
