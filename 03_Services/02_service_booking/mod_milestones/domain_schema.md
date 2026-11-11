# PS-031-01 — Domain schema: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-01.R01** A Milestone stores booking, sequence, parallel flag, title, amount, due date, status, the ordered list of submissions with their cids, the approval cid, the dealId of its Deal and the derived payment proof level, with revision per CTR-ID-001.
- **PS-031-01.R02** Milestones are P2, stored in both participants' vaults, kept under RET-EVIDENCE, and the amounts of one booking sum exactly to the booking total in one currency.
- **PS-031-01.R03** Submission and approval records are immutable once signed; a new submission supersedes the previous one and never edits it.
- **PS-031-01.R04** Milestone ids, seq, titles, amounts and parallel flags come from the milestone plan in the quote the client signed (quoteCid); the provider cannot assign ids or change amounts after acceptance.

## Specification

### Milestone

Schema `classrup.services.milestone/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuid — uuid(sha256(bookingId + ':' + seq)), identical in both vaults; never assigned by the provider |
| bookingId | uuidv7 — ref F03.S02.M01 Booking |
| quoteCid | string — cid of the client-signed quote whose plan this milestone comes from |
| seq | int — 1..10, unique per booking; 1 for the implicit milestone of an empty plan |
| parallel | boolean — from the quote plan; parallel milestones may be submitted out of order |
| title | string — 1..120 code points |
| amount | Money — CTR-MNY-001; > 0 |
| dueAt? | timestamp — claim by the provider, RFC 3339 UTC |
| clientId | actorId — booking client, copied for routing |
| providerId | actorId — booking provider, copied for routing |
| status | enum — pending \| submitted \| changes_requested \| approved \| settled \| disputed \| cancelled |
| preDisputeStatus? | enum — submitted \| approved; restored when the case closes |
| disputeCaseId? | uuid — F09.S02.M02 case the freeze or overlay belongs to |
| openDisputeLinkId? | uuidv7 — overlay while a linked dispute names this milestone, also on pending, changes_requested and settled milestones |
| submissions | Submission[] — 0..4 items {cid, deliverables[] {kind: attachment \| external_hash, attachmentId? (F08.S01.M03 image ≤ 5 MiB), sha256, name ≤ 120, sizeBytes, mediaType}, note ≤ 2000, claimedAt} |
| changeRounds | int — 0..3 |
| approvalCid? | string — cid of milestone_approval; refers to one submission cid |
| dealId? | uuid — F09.S01.M01 Deal opened on approval with contextRef {type: service_milestone, id}; deterministic from that contextRef |
| payment | object — {claimIds[], proof: none \| claimed \| acknowledged \| confirming \| confirmed \| final \| reorged \| failed \| disputed \| expired, confirmations?, requiredConfirmations?, finalityPolicy?} |
| completion? | object — {completionCid, clientSignatureCid?, providerSignatureCid?}; identical on every milestone of the booking |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- status settled implies payment.proof is acknowledged (cash or external) or final (chain) per CTR-COM-001 COM-4.
- approvalCid refers to the latest submission cid of this milestone.
- Sum of amounts over the non-cancelled milestones of a booking equals the booking total.
- dealId is set if and only if the milestone was approved; payment events are matched only through dealId.
- Deliverables of kind attachment are F08.S01.M03 images of at most 5 MiB; external_hash deliverables carry no bytes.

### Storage DDL

```sql
CREATE TABLE services_milestone (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, booking_id TEXT NOT NULL, seq INTEGER NOT NULL, amount_minor TEXT NOT NULL,
  currency TEXT NOT NULL, status TEXT NOT NULL, deal_id TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX services_milestone_seq ON services_milestone(tenant_id, booking_id, seq);
CREATE UNIQUE INDEX services_milestone_deal ON services_milestone(tenant_id, deal_id) WHERE deal_id IS NOT NULL;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T01 | integration | PS-031-01.R01, PS-031-01.R02, PS-031-01.R04, PS-031-04.R03 | booking.confirmed event delivered twice with a 3-milestone plan | exactly 3 milestones per vault with ids uuid(sha256(bookingId:seq)), plan taken from the client-signed quote; sum equals total |
| TEST-PS-031-09.T02 | unit | PS-031-01.R03, PS-031-02.R02, PS-031-02.R03 | each rule V01–V10 violated in turn | documented code returned and nothing stored, bad statements quarantined |
| TEST-PS-031-09.T14 | e2e | PS-031-01.R01, PS-031-04.R01 | mobile provider submits, client approves and records payment claim, provider acknowledges, both sign completion | milestone settled in both vaults; booking completed; axe zero serious issues |
| TEST-PS-031-09.T20 | abuse | PS-031-01.R04 | booking.confirmed whose plan changes one amount relative to the client-signed quote | no milestone created from the altered plan; mismatch logged and the upstream confirmation quarantined |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F09.S01.M03, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
