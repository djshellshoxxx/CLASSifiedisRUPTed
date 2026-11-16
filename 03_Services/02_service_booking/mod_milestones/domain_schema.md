# PS-031-01 — Domain schema: Service milestones

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M02 Service milestones](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/milestones` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-031-01.R01** A Milestone stores booking, sequence, title, amount, due date, status, the ordered list of submissions with their cids, the approval cid and the derived payment proof level, with revision per CTR-ID-001.
- **PS-031-01.R02** Milestones are P2, stored in both participants' vaults, kept under RET-EVIDENCE, and the amounts of one booking sum exactly to the booking total in one currency.
- **PS-031-01.R03** Submission and approval records are immutable once signed; a new submission supersedes the previous one and never edits it.

## Specification

### Milestone

Schema `classrup.services.milestone/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — milestoneId assigned by the provider in the signed booking confirmation |
| bookingId | uuidv7 — ref F03.S02.M01 Booking |
| seq | int — 1..10, unique per booking |
| title | string — 1..120 code points |
| amount | Money — CTR-MNY-001; > 0 |
| dueAt? | timestamp — claim by the provider, RFC 3339 UTC |
| status | enum — pending \| submitted \| changes_requested \| approved \| settled \| disputed \| cancelled |
| submissions | Submission[] — 0..4 items {cid, deliverables[] {attachmentId, sha256, name ≤ 120}, note ≤ 2000, claimedAt} |
| changeRounds | int — 0..3 |
| approvalCid? | string — cid of milestone_approval; refers to one submission cid |
| payment | object — {claimId?, proof: none \| claimed \| acknowledged \| confirming \| final \| disputed \| expired, confirmations?, finalityPolicy?} |
| syncState | map — per peer {state: prepared \| transport_acknowledged \| peer_accepted, at} |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- status settled implies payment.proof is acknowledged (cash or external) or final (chain) per CTR-COM-001 COM-4.
- approvalCid refers to the latest submission cid of this milestone.
- Sum of amounts over the non-cancelled milestones of a booking equals the booking total.

### Storage DDL

```sql
CREATE TABLE services_milestone (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, booking_id TEXT NOT NULL, seq INTEGER NOT NULL, amount_minor TEXT NOT NULL,
  currency TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX services_milestone_seq ON services_milestone(tenant_id, booking_id, seq);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-031-09.T01 | integration | PS-031-01.R01, PS-031-01.R02, PS-031-04.R03 | booking.confirmed event delivered twice with a 3-milestone plan | exactly 3 milestones per vault with identical ids; sum equals total |
| TEST-PS-031-09.T02 | unit | PS-031-01.R03, PS-031-02.R01, PS-031-02.R02, PS-031-02.R03 | each rule V01–V08 violated in turn | documented code returned and nothing stored, bad statements quarantined |
| TEST-PS-031-09.T14 | e2e | PS-031-01.R01, PS-031-02.R01 | mobile provider submits, client approves and records payment claim, provider acknowledges | milestone settled in both vaults; booking completed; axe zero serious issues |

## Dependencies

Module depends on: F03.S02.M01, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
