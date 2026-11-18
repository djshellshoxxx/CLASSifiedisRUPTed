# PS-030-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-05. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines which actor may perform which action on which dispute resource, under which state guard, and which capability identifier gates it. Capability identifiers are provisional names pending CTR-CAP-001 (owner F16 with F07). No actor can set a dispute status directly. No override capability exists in v1.

Exclusions: identity proofing and credential issuance (F07); moderator onboarding and role assignment (F16); block list storage (F07, consumed here).

## Requirements
- **PS-030-05.R01**: Business outcome: each party can act only on disputes where it is claimant or respondent; moderators act only through assigned or queue-based capabilities; no actor sees another party's private data. Actors and exclusions as above.
- **PS-030-05.R02**: Cases covered: non-party read (returns `DISPUTES_NOT_FOUND`); respondent attempts decision (`DISPUTES_FORBIDDEN`); reviewer is a party or prior decider (`DISPUTES_REVIEWER_CONFLICT`); blocked counterparty opens a dispute; capability revoked mid-dispute; expired token replay; moderator reads reviewer notes of another reviewer.
- **PS-030-05.R03**: Authorization decision adds at most 20 ms p95 to a command. Decisions are made per request from current capability claims; no cached grant survives revocation beyond 60 seconds.

## Actors
- `claimant`: `pid_` equal to `claimant_ref`.
- `respondent`: `pid_` equal to `respondent_ref`.
- `moderator`: holds F16 role `dispute_reviewer`. Not a party to the dispute (enforced by reviewer-conflict rule).
- `system`: internal timer worker, no human session; may only fire timer transitions T03, T10 (expiry), T19.
- `other_participant`: any authenticated `pid_` that is not a party.
- `blocked_counterparty`: a party against whom the other party holds a block record (A-disputes-10).

## Capability identifiers
| Capability | Grants |
|---|---|
| disputes.open | OpenDispute for a booking the caller is party to |
| disputes.read.party | GetDispute, ListMyDisputes, GetDisputeTimeline for own disputes |
| disputes.respond | RespondToDispute |
| disputes.evidence.submit | SubmitEvidence |
| disputes.evidence.withdraw | WithdrawEvidence on own items |
| disputes.withdraw | WithdrawDispute |
| disputes.settlement.propose | ProposeSettlement |
| disputes.settlement.respond | RespondToSettlement |
| disputes.escalate | EscalateDispute |
| disputes.appeal.file | FileAppeal |
| disputes.review.queue | ListReviewQueue |
| disputes.review.assign | AssignReviewer, ReleaseReviewer |
| disputes.review.intake | RejectAtIntake |
| disputes.review.return | ReturnForMoreInfo |
| disputes.review.decide | RecordDecision |
| disputes.review.note | AddReviewerNote, read moderator-only statements |
| disputes.export.self | Export of own records ([import_export_backup_rollback.md](import_export_backup_rollback.md)) |

## Permission matrix
Key: Y = allowed when state guard passes; C = allowed under the stated condition; N = denied with the code shown.

| Action (capability) | Resource | Claimant | Respondent | Moderator | System | Other participant | Blocked counterparty |
|---|---|---|---|---|---|---|---|
| Open (disputes.open) | dispute | Y, not suspended, not blocked | N | N | N | N | N (DISPUTES_BLOCKED_COUNTERPARTY) |
| Read (disputes.read.party) | dispute, timeline | Y | Y | Y (moderator view) | N | N (DISPUTES_NOT_FOUND) | C, own dispute only |
| Respond (disputes.respond) | statement | N | Y in `open` | N | N | N | C, own dispute only |
| Submit evidence (disputes.evidence.submit) | evidence | Y in `open`, `responded`, `settlement_proposed`, `escalated`, `under_review` | Y in same states | N | N | N | Y in same states, own dispute |
| Withdraw evidence (disputes.evidence.withdraw) | evidence | C, own item, before `decided` | C, own item, before `decided` | N | N | N | C, own item |
| Withdraw dispute (disputes.withdraw) | dispute | Y in `open`, `responded`, `settlement_proposed`, `escalated` | N | N | N | N | N |
| Propose settlement (disputes.settlement.propose) | settlement | Y in `responded` | Y in `responded` | N | N | N | C, not while blocked by the other party |
| Respond to settlement (disputes.settlement.respond) | settlement | C, not proposer | C, not proposer | N | N | N | C, not proposer |
| Escalate (disputes.escalate) | dispute | C, guard T07 | C, guard T07 | N | N | N | N |
| File appeal (disputes.appeal.file) | dispute | C, adverse party only | C, adverse party only | N | N | N | N |
| Review queue (disputes.review.queue) | dispute summaries | N | N | Y | N | N | N |
| Assign reviewer (disputes.review.assign) | dispute | N | N | Y in `escalated` | N | N | N |
| Intake reject (disputes.review.intake) | dispute | N | N | Y in `open` | N | N | N |
| Return for info (disputes.review.return) | dispute | N | N | C, assigned, `reopen_count` = 0 | N | N | N |
| Record decision (disputes.review.decide) | dispute | N | N | C, assigned reviewer, not party | N | N | N |
| Reviewer note (disputes.review.note) | statement | N | N | C, assigned reviewer | N | N | N |
| Timer transitions | dispute | N | N | N | Y (T03, T10, T19) | N | N |

Reviewer independence (C conditions): reviewer's `pid_` must differ from `claimant_ref`, `respondent_ref` and the `decided_by_ref` of every prior resolution. Violation returns `DISPUTES_REVIEWER_CONFLICT`. Only the `current_reviewer_ref` may decide, otherwise `DISPUTES_REVIEWER_NOT_ASSIGNED`.

Visibility: statements with `visibility = moderator_only` (reviewer notes) are returned only to moderators holding `disputes.review.note`. Counterparty statements are returned to both parties. Evidence is visible to both parties and moderators, except `quarantined` items, which are visible to moderators only.

## Revocation
- Capability removal takes effect on the next request. In-flight commands are completed only if their authorization was evaluated before revocation and the write is already in the transaction.
- Moderator role removal releases the assigned reviewer through an automatic `ReleaseReviewer` with reason `reviewer_unavailable` (no state loss).
- A block added during a dispute stops new openings and new settlement proposals toward the blocker but does not remove evidence or response rights (A-disputes-10).

## Open decisions
- A-disputes-10: Block semantics as described above; depends on F07 block record contract not yet in [CONTRACTS.md](../../../planning/CONTRACTS.md).
- A-disputes-13: Reviewer role is F16 capability `disputes.review.decide` with independence rules fixed in this module.
- CTR-CAP-001 (F16) is OPEN; capability names are provisional until published.
