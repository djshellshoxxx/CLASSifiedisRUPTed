# PS-008-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [01_LocalBazaar/03_inventory/mod_availability](SPEC.md) (F01.S03.M01; accountable role: Marketplace Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision and append rules), CTR-CAP-001 (actor rules).

**Decisions:** Hold TTL and SOLD_OUT derivation are ASSUMPTION (unapproved). Execution is seller and counterparty self-attested (D04 default, PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-008-03.R01 | Two machines: availability status (4 states) and hold state (4 states). Each transition appends one event with a new `revision`. | MVP |
| PS-008-03.R02 | Transition guards evaluate on committed state under the aggregate lock. | MVP |
| PS-008-03.R03 | `ARCHIVED` and hold states EXECUTED, WITHDRAWN, EXPIRED are terminal. No transition leaves them. | MVP |
| PS-008-03.R04 | `SOLD_OUT` is set when available = 0 and status = ACTIVE, and cleared when available > 0. | MVP |

## Availability status
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `availability.create` | listing kind sell or giveaway | ACTIVE | emit `availability.created` |
| ACTIVE | hold placed or commit leaves available = 0 | available = 0 | SOLD_OUT | emit `availability.status_changed` |
| SOLD_OUT | configure, hold withdrawn or expired | available > 0 | ACTIVE | emit `availability.status_changed` |
| ACTIVE or SOLD_OUT | `availability.pause` (owner or moderation case) | none | PAUSED | no new holds; open holds keep TTL |
| PAUSED | `availability.resume` | available > 0 | ACTIVE | emit status_changed |
| PAUSED | `availability.resume` | available = 0 | SOLD_OUT | emit status_changed |
| any non-terminal | listing archived (sys) | none | ARCHIVED | all PLACED holds → WITHDRAWN (`listing_archived`) |

## Hold state
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `hold.place` (sys, F01.S04.M01) | V03–V07 pass | PLACED | held_units += units; emit `hold.placed` |
| PLACED | `hold.withdraw` (holder, owner, or sys on offer cancel) | none | WITHDRAWN | held_units −= units; emit `hold.withdrawn` |
| PLACED | `hold.execute` (sys, offer accepted by all parties) | now < expires_at | EXECUTED | held_units −= units; committed_units += units; emit `hold.executed` |
| PLACED | `hold.expire` (scheduled job) | now ≥ expires_at | EXPIRED | held_units −= units; emit `hold.expired` |

## Edge cases
- Execute and expire race: the first committed transition wins; the second receives AVAIL.HOLD_NOT_ACTIVE or AVAIL.HOLD_EXPIRED.
- Configure lowering total below held + committed is rejected (V05); it never cancels holds.
- Pause does not withdraw holds. Owner may withdraw them explicitly.

## Tests
- TEST-PS-008-03-01 (unit): each row of both tables produces the stated `to` state and side effect.
- TEST-PS-008-03-02 (property): no sequence reaches a terminal state's successor.
- TEST-PS-008-03-03 (concurrency): execute and expire racing on one hold: exactly one commits.
- TEST-PS-008-03-04 (integration): archive listing with 3 PLACED holds → 3 WITHDRAWN, status ARCHIVED.

## Acceptance criteria
1. Transition tables match implementation exactly (TEST-01).
2. Race test (TEST-03) passes 1,000 iterations.
3. SOLD_OUT and ACTIVE flip correctly on every guard change (TEST-01).

## Assumptions & open decisions
- ASSUMPTION: hold TTL 72 h default; `hold.expire` runs every 60 s.
- PROVISIONAL (D04 default, unapproved): `hold.execute` is a per-party attestation outcome, not an atomic exchange.
