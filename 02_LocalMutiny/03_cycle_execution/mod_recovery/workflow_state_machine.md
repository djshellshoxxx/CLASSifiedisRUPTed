# PS-024-03 — Workflow state machine: Cycle execution and recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M04 Cycle execution and recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-024-03.R01** A cycle is completed in a vault only when every leg has a valid receiver attestation and every compensation leg is settled, as verified in that vault, and the verdict is re-evaluated whenever evidence arrives.
- **PS-024-03.R02** Issue reports, dropouts after handover and execution deadlines with partial evidence move the cycle to partially_executed and open exactly one RecoveryCase; nothing is cancelled or rerouted.
- **PS-024-03.R03** A RecoveryCase resolves only through signed agreement on options, a dispute outcome from F09.S02.M02, or by closing as unresolved after 30 days without activity.
- **PS-024-03.R04** No relay, moderator or counterparty can mark a leg received or a case resolved for someone else; only that party's signature counts.

## Specification

### RecoveryCase lifecycle

Initial **open**; terminal **resolved**, **closed_unresolved**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| open -> open | option proposed, accepted, rejected or completed by signed statements | lastActivityAt updated; no state change |
| open -> escalated | mutiny.recovery.escalate by a participant | dispute opened in F09.S02.M02 with the evidence bundle; disputeCaseId stored |
| open -> resolved | all accepted options completed or waived and every leg has a disposition | emits mutiny.recovery.resolved with outcome agreed |
| escalated -> resolved | commerce.dispute.resolved consumed for disputeCaseId | emits mutiny.recovery.resolved with outcome dispute_outcome |
| open -> closed_unresolved | no activity for 30 days on the local clock | emits mutiny.recovery.resolved with outcome unresolved |
| escalated -> closed_unresolved | no dispute activity for 60 days on the local clock | emits mutiny.recovery.resolved with outcome unresolved |

```mermaid
stateDiagram-v2
  [*] --> open
  open --> open: option proposed, accepted, rejected or completed by signed statements
  open --> escalated: mutiny.recovery.escalate by a participant
  open --> resolved: all accepted options completed or waived and every leg has a disposition
  escalated --> resolved: commerce.dispute.resolved consumed for disputeCaseId
  open --> closed_unresolved: no activity for 30 days on the local clock
  escalated --> closed_unresolved: no dispute activity for 60 days on the local clock
  resolved --> [*]
  closed_unresolved --> [*]
```

### Timeouts and scheduled transitions

- Recovery deadlineAt is 14 days after opening; unresolved closure after 30 days without activity (60 days when escalated), evaluated on vault open and every 60 s while open.
- Giver and receiver actions have no deadline of their own; the execution deadline (consentDeadline + executionWindowMs) is enforced by F02.S03.M03.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-024-09.T01 | integration | PS-024-01.R01, PS-024-03.R01, PS-024-04.R03 | 3-party cycle with all handed_over and received attestations delivered | each vault emits leg.received per leg and completed after the third receipt |
| TEST-PS-024-09.T02 | integration | PS-024-01.R04, PS-024-03.R01 | 2-party cycle; receiver attests without giver attestation | leg received and cycle completes; giver evidence not required |
| TEST-PS-024-09.T04 | property | PS-024-03.R01, PS-024-03.R04, PS-024-09.R03 | random interleavings of attestations, issues, drops and duplicates | completed only with all receiver attestations and settled compensation; cancelled and terminal states never reopen |
| TEST-PS-024-09.T05 | integration | PS-024-03.R02, PS-024-04.R03 | Dan drops in 4-party cycle after Alice's handed_over | cycle partially_executed, one RecoveryCase opened, no cancellation, no reroute |
| TEST-PS-024-09.T06 | integration | PS-024-03.R02, PS-024-06.R04 | receiver reports not_received after giver handed_over | issue recorded, partially_executed, both statements kept unmerged, options offered |
| TEST-PS-024-09.T07 | integration | PS-024-03.R03, PS-024-01.R02 | return_item proposed by Alice, accepted by Bob, returned and return_confirmed attested | case resolved with dispositions released for returned legs |
| TEST-PS-024-09.T08 | integration | PS-024-03.R03, PS-024-04.R01 | escalate case to dispute and resolve via commerce.dispute.resolved | outcome dispute_outcome and recovery.resolved emitted once |
| TEST-PS-024-09.T09 | integration | PS-024-03.R03 | no activity for 30 days with injected clock | closed_unresolved with outcome unresolved and UI statement that no remedy exists |
| TEST-PS-024-09.T16 | integration | PS-024-07.R03, PS-024-03.R04 | late handed_over arrives after cycle cancelled | cycle stays cancelled and standalone recovery case opens |

## Dependencies

Module depends on: F02.S03.M01, F02.S04.M01, F02.S01.M03, F09.S02.M02, F08.S01.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
