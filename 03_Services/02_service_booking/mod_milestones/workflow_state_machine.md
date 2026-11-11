# PS-031-03 — Workflow state machine: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-03.R01** Milestones follow pending, submitted, approved, settled with a change loop; cancelled and settled are terminal.
- **PS-031-03.R02** Approval requires the exact current submission cid; payment never changes approval and approval never implies payment.
- **PS-031-03.R03** Settlement requires payee acknowledgement or chain finality; a claim alone never completes a milestone or the booking.
- **PS-031-03.R04** Approval opens the milestone's Deal through commerce.deal.open in the same vault transaction; if the Deal cannot be opened, approval is not signed and the milestone stays submitted.
- **PS-031-03.R05** Disputes freeze submitted and approved milestones as disputed with their pre-dispute status stored and only set an overlay on other states; the matching commerce.dispute.resolved or commerce.dispute.withdrawn restores the pre-dispute status per the F03.S02.M03 mapping, and an obligation is released only by a mutually signed Deal cancellation.
- **PS-031-03.R06** A reorg or failure reported by F09.S01.M03 lowers the proof level shown and never leaves a milestone showing a stronger state than the claim reached (COM-4, FLOW-11).

## Specification

### Milestone lifecycle

Initial **pending**; terminal **settled**, **cancelled**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| pending -> submitted | services.milestone.submit by provider | statement verified; emits services.milestone.submitted |
| changes_requested -> submitted | services.milestone.submit by provider | new submission supersedes previous; emits services.milestone.submitted |
| submitted -> changes_requested | services.milestone.request_changes by client | changeRounds below 3; emits services.milestone.changes_requested |
| submitted -> approved | services.milestone.approve by client | approval names the latest submission cid; commerce.deal.open {contextRef {type: service_milestone, id: milestoneId}, contextCid: approvalCid, parties [client as payer, provider as payee], obligations [client pays provider amount, purpose service], expiresInDays 90} in the same transaction; dealId stored; emits services.milestone.approved |
| approved -> settled | commerce.payment.acknowledged or commerce.payment.finalized consumed for milestone.dealId | proof acknowledged or final; emits services.milestone.settled |
| approved -> cancelled | commerce.deal.cancelled consumed for milestone.dealId with reason mutual | obligation released only because both parties signed deal_cancel |
| submitted -> disputed | services.dispute.opened consumed with this milestone in scope | preDisputeStatus submitted and disputeCaseId stored; approval frozen |
| approved -> disputed | services.dispute.opened consumed with this milestone in scope | preDisputeStatus approved and disputeCaseId stored; payment proof kept and still updated |
| disputed -> submitted | commerce.dispute.resolved or commerce.dispute.withdrawn for disputeCaseId with preDisputeStatus submitted | freeze lifted per the F03.S02.M03 mapping |
| disputed -> approved | commerce.dispute.resolved or commerce.dispute.withdrawn for disputeCaseId with preDisputeStatus approved | freeze lifted; Deal unchanged; settles at once when proof is already acknowledged or final |
| disputed -> cancelled | services.booking.cancelled consumed with reason mutual and preDisputeStatus submitted | no obligation existed |
| pending -> cancelled | services.booking.cancelled consumed | no obligation |
| submitted -> cancelled | services.booking.cancelled consumed | no obligation unless already approved |
| changes_requested -> cancelled | services.booking.cancelled consumed | no obligation |

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> submitted: services.milestone.submit by provider
  changes_requested --> submitted: services.milestone.submit by provider
  submitted --> changes_requested: services.milestone.request_changes by client
  submitted --> approved: services.milestone.approve by client
  approved --> settled: commerce.payment.acknowledged or commerce.payment.finalized consumed for milestone.dealId
  approved --> cancelled: commerce.deal.cancelled consumed for milestone.dealId with reason mutual
  submitted --> disputed: services.dispute.opened consumed with this milestone in scope
  approved --> disputed: services.dispute.opened consumed with this milestone in scope
  disputed --> submitted: commerce.dispute.resolved or commerce.dispute.withdrawn for disputeCaseId with preDisputeStatus submitted
  disputed --> approved: commerce.dispute.resolved or commerce.dispute.withdrawn for disputeCaseId with preDisputeStatus approved
  disputed --> cancelled: services.booking.cancelled consumed with reason mutual and preDisputeStatus submitted
  pending --> cancelled: services.booking.cancelled consumed
  submitted --> cancelled: services.booking.cancelled consumed
  changes_requested --> cancelled: services.booking.cancelled consumed
  settled --> [*]
  cancelled --> [*]
```

### Timeouts and scheduled transitions

- A submitted milestone with no client action for 14 days raises a dispute prompt to the provider; nothing is auto-approved. A claim without progress for 14 days becomes expired through F09 (COM-3) and is shown as such.
- Milestone Deals are opened with expiresInDays 90; commerce.deal.cancelled with reason expired leaves the milestone approved with proof expired.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T03 | property | PS-031-03.R01 | random statement and event sequences on one milestone | only declared transitions succeed; settled and cancelled never change |
| TEST-PS-031-09.T04 | integration | PS-031-03.R02 | approval naming an older submission cid, then the latest | first SERVICES_SUBMISSION_STALE; second approved |
| TEST-PS-031-09.T05 | integration | PS-031-03.R03, PS-031-03.R06, PS-031-04.R03 | payment claimed, confirming, confirmed, reorged, confirming, finalized; then claimed, failed; then claimed, expired; then acknowledged | proof labels follow COM-4; after the reorg proof is reorged and the milestone stays approved; settled only at acknowledged or final; booking completes only after both completion statements |
| TEST-PS-031-09.T09 | integration | PS-031-06.R03, PS-031-03.R04 | commerce.deal.open fails during approval | approval not signed; milestone stays submitted; no dealId |
| TEST-PS-031-09.T17 | integration | PS-031-03.R05 | dispute opened for a submitted and an approved milestone, then each F09 resolution and a withdrawal; then commerce.deal.cancelled mutual | each milestone returns to its pre-dispute status; refund_claimed leaves the Deal unchanged; approved becomes cancelled only on the mutual Deal cancellation |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
