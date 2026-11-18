# PS-101-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R08 immutability, R09 correlation), CTR-CAP-001 (R09 revocation), CTR-PRV-001 (R06 deletion).

**Decision labels:** 30-day expiry is PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-03.R01 | Record states: `ACTIVE`, `SUPPRESSED`, `EXPIRED`, `REDACTED`. `ACTIVE` is the only state that feeds scoring. | MVP |
| PS-101-03.R02 | Transitions are events. Stored records are never mutated (CTR-EVT-001 R08). | MVP |
| PS-101-03.R03 | `EXPIRED` happens at `expires_at`, applied by a job within 1 hour after expiry. | MVP |
| PS-101-03.R04 | `SUPPRESSED` is terminal for scoring and reversible only by a new correcting signal, never by edit. | MVP |
| PS-101-03.R05 | `REDACTED` applies on subject deletion and is terminal. | MVP |
| PS-101-03.R06 | Each transition emits one event with the same `correlation_id` as its triggering command. | MVP |

## Data / schema
Projection table `sgn_state` (one row per `sgn_`): `signal_id`, `state`, `revision`, `last_event_ref`, `updated_at`. Types: `state` is a closed enum. `revision` integer ≥ 1.

## Commands / queries / events
Transitions are produced by `sgn.create` (→ ACTIVE), `sgn.update` (→ SUPPRESSED), the expiry job (→ EXPIRED) and the deletion handler (→ REDACTED). See PS-101-04.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `sgn.create` accepted | PS-101-02 passes; not duplicate | ACTIVE | emit `signal.recorded`; enter scoring queue |
| ACTIVE | expiry job | `now ≥ expires_at` | EXPIRED | emit `signal.expired`; drop from scoring |
| ACTIVE | `sgn.update` (suppress) | mod with case grant; `expected_revision` matches; reason valid | SUPPRESSED | emit `signal.suppressed`; remove from scoring; keep record for audit |
| ACTIVE, SUPPRESSED, EXPIRED | subject deletion (F10) | subject is `acc_` being deleted | REDACTED | replace `subject_ref` with keyed digest; emit `signal.redacted` |
| SUPPRESSED | `sgn.update` | any | — | rejected: `EVT.REVISION_CONFLICT` or `CAP.GRANT_NOT_ACTIVE` as applicable |

Terminal states: EXPIRED and REDACTED. A REDACTED record cannot be suppressed.

## Validation & errors
Invalid transitions return `EVT.REVISION_CONFLICT` (409) when the revision is stale, otherwise `SYS.CONFLICT` (409).

## Authorization
Who may trigger each row is defined in PS-101-05.

## Failure, idempotency, concurrency, offline
Transitions run under the aggregate revision lock. Retry rules: PS-101-06. Offline: not applicable; server-side only.

## Privacy, retention, abuse
REDACTED removes subject linkage within 24 hours of deletion (CTR-PRV-001 R06). Retention detail: PS-101-07.

## Observability and budgets
Transition counts per state; expiry lag metric (PS-101-08).

## Tests
- TEST-PS-101-05 (integration): suppress with stale revision returns `EVT.REVISION_CONFLICT`; record unchanged.
- TEST-PS-101-07 (integration): record expires at 30 days ± 1 hour.
- TEST-PS-101-11 (integration): deletion of subject moves all its records to REDACTED; no record retains `acc_` in clear.

## Acceptance criteria
1. Every row of the transition table has a test.
2. No path from REDACTED or EXPIRED back to ACTIVE exists.
3. Each transition emits exactly one event.

## Assumptions & open decisions
- ASSUMPTION: a deletion job runs at least every hour.
- D07 expiry default (PROVISIONAL, unapproved).
