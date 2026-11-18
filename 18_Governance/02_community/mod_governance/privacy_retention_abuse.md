# PS-147-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-147-07. **Owner:** [18_Governance/02_community/mod_governance](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_governance. **Consumers:** F13 notifications, [mod_transparency](../mod_transparency/SPEC.md), F12 moderation (proposed; see [dependency matrix](../../../DEPENDENCY_MATRIX.md)).

## Requirements
- PS-147-07.R01: Business outcome, actors and exclusions. Governance data is minimized to pseudonymous IDs and enumerated values. The module must not reveal how an individual voted, and must not make membership or identity claims beyond pseudonyms. Exclusions: moderation evidence (F12), identity proofs (F07), and any guarantee against network metadata or legal process. Pseudonyms do not guarantee anonymity.
- PS-147-07.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases for privacy and abuse are enumerated in the threat table below. Expired cases follow the retention schedule.
- PS-147-07.R03: Location: no precise location is stored or accepted. `region_code` is coarse (D05). Data classes are declared per field below.
- PS-147-07.R04: Retention periods per class are defined here (D07, A-governance-10). Legal hold may suspend deletion, and the hold itself is an audited event.
- PS-147-07.R05: Erasure request from F10 is applied within 30 days, per the procedure below (A-governance-24).
- PS-147-07.R06: Abuse controls cover proposal spam, vote manipulation, role capture, coercion and harassment through proposal text.

## Data classes (provisional, A-governance-18)
Labels are provisional until CTR-PRV-001 (owner F10) names the canonical classes.
- `PUB`: visible to visitors. Allowed: community slug, display name, region_code, active charter body.
- `MEM`: visible to members. Proposals, decisions, role assignments, tallies after close.
- `STW`: visible to stewards only. Audit entries, export requests, eligibility lists.
- `SELF`: visible only to the voter. Own vote choice.
- `SYS`: internal only. HMAC keys, idempotency records, outbox.

## Field classification
| Field | Class | Personal data | Notes |
|---|---|---|---|
| community.slug, display_name | PUB | no | Chosen by operator; must not contain personal data (validated as free text, reviewed in moderation) |
| community.region_code | PUB | no | Coarse only |
| charter_version.body_text | PUB when active, MEM when draft | no | Free text; may contain personal data entered by stewards; subject to moderation |
| governance_proposal.title, rationale_text | MEM | possible | Free text; same handling as above |
| role_assignment.participant_id | MEM | pseudonymous | Sentinel after erasure |
| proposal_eligibility.participant_id | STW | pseudonymous | Membership exposure minimized |
| vote.choice | SELF | pseudonymous link | Never in events or logs |
| vote.voter_participant_id | STW | pseudonymous | Visible to stewards only in aggregate, never with choice |
| governance_decision tallies | MEM | no | Aggregated |
| audit_entry.actor_ref | STW | pseudonymous HMAC | Key destroyed on erasure |
| idempotency_record.principal_ref | SYS | pseudonymous HMAC | 7-day retention |

## Retention (A-governance-10)
| Class or record | Retention | At expiry |
|---|---|---|
| vote rows (choice and voter link) | 24 months after decision | Deleted; tally in decision row remains |
| proposal_eligibility rows | 24 months after decision | Deleted |
| governance_decision, charter_version, governance_proposal | 5 years after community archive, or indefinitely while active | Deleted with community after 5 years post-archive |
| role_assignment | Same as community | Sentinel on erasure only |
| audit_entry | 5 years after write | Deleted at expiry; chain re-anchored at the earliest retained entry with a checkpoint hash |
| idempotency_record | 7 days | Deleted |
| outbox_event | Until relayed, max 30 days | Deleted |
| export file | 7 days after creation | Deleted; export link expires after 24 hours |
| unreferenced charter draft | 90 days with no update | Deleted |

Legal hold: a hold on a community or proposal suspends deletion for its records. The hold is an audit entry (`governance.hold.placed.v1`, not in the event list, flagged as internal). Holds must name a reason code and an expiry, reviewed monthly.

## Erasure procedure (A-governance-24)
1. F10 sends an erasure request for `participant_id`. Module acknowledges within 24 hours.
2. Delete the per-subject HMAC key. `actor_ref` values for that participant become unlinkable. Entries and hash chain remain intact.
3. Replace `participant_id` in `role_assignment` and `proposal_eligibility` with sentinel `00000000000000000000000000`. Delete the participant's `vote` rows. Tallies are not recomputed.
4. Replace `proposer_participant_id` on the participant's proposals with the sentinel. Title and rationale text are left in place unless moderation flags them (F12).
5. Role changes caused by erasure are recorded with `revocation_reason_code = participant_erased`. Steward cap and last-steward rules still apply: an erasure that removes the last steward is recorded and an operator alert is raised, but the removal is not blocked (privacy wins).
6. Completion is reported to F10 within 30 days of the request.

## Threats and controls
| Threat | Control | Residual risk |
|---|---|---|
| Sybil accounts inflate eligibility | Standing age of 14 days from membership source (A-governance-03); quorum uses eligible count, not account count | No proof-of-personhood in MVP (A-governance-09) |
| Vote buying or coercion | Secret ballot; no event or export reveals choices; no third-party receipts (D06) | A voter can still prove their own choice to others |
| Graph deanonymization from vote timing | Votes timestamped to minute only in events; no per-vote ordering published | Timing of a unique vote may still correlate with activity |
| Tally deanonymization in small communities | Tallies shown only after close; quorum requirement; accepted for eligible_count below 10 (A-governance-21) | Small communities can infer votes from tallies |
| Proposal spam | Draft and open limits; writes rate limit (A-governance-22) | Determined actor can churn drafts within limits |
| Role capture | Quorum, supermajority for revoke, steward cap 9, last-steward rule | Coordinated majority can still adopt a grant |
| Harassment through proposal text | Length caps; F12 can hide `title` and `rationale_text`, which keeps the record and marks it hidden | Hidden text remains in audit store under legal hold |
| Replay of vote or grant | Idempotency keys; revision checks; unique vote row | None known |
| Forged governance records | All writes via authenticated commands; hash-chained audit (A-governance-11) | Chain verifies integrity, not truth of the underlying claim |
| Metadata leakage in logs | Logs limited to opaque IDs and codes (see [observability](observability_performance.md)) | Network-level metadata is out of scope |
| Stale federated records | Not applicable: no federation in MVP | Revisit when D01 is decided |

## Abuse handling
- F12 moderation can mark a proposal `hidden`. Hidden proposals keep state, tally and decision, and display a neutral placeholder to members.
- Operator can freeze a community during abuse review (`status_reason_code` required). Frozen blocks writes only.
- Reports against proposals are routed to F12, not handled here.

## Test IDs
- TEST-PS-147-07-T01: Scan all `PUB` and `MEM` responses and events for any `choice` value or any `voter_participant_id`. Any hit fails.
- TEST-PS-147-07-T02: Run erasure for a participant with votes and a steward role. Pass: no vote rows remain, role row carries sentinel, `actor_ref` values are unlinkable, audit chain verifies.
- TEST-PS-147-07-T03: Create a draft and let it age past 30 days. Pass: state `withdrawn` with `draft_expired`, and no event payload includes title text.

## Open decisions
- A-governance-09: no proof-of-personhood. Sybil resistance limited to membership standing age. Accepted residual risk for MVP.
- A-governance-10: retention periods above. Default adopted; D07 remains OPEN until approved.
- A-governance-18: provisional data class labels pending CTR-PRV-001.
- A-governance-21: tally disclosure accepted in communities below 10 eligible voters.
- A-governance-24: erasure by key destruction and sentinel replacement. Default adopted; confirm with F10.
