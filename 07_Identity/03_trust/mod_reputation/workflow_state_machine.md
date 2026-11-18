# PS-058-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-03.R01 | `status` is `insufficient_data` until thresholds are met, then `ready`; `ready` may revert to `insufficient_data` only through decay or withdrawal of inputs. | MVP |
| PS-058-03.R02 | Thresholds for `ready`: ≥ 5 distinct counterparties in 365 days AND ≥ 10 weighted points (ASSUMPTION). | MVP |
| PS-058-03.R03 | `band` changes emit `reputation.band_changed` only when the band differs; no event for counter-only changes. | MVP |
| PS-058-03.R04 | Freeze on retirement: scores stop updating; public band remains visible for 30 days then is hidden. | MVP |
| PS-058-03.R05 | An appeal or quarantine from F12 sets `status` to `under_review` and freezes `band` at its last value. | MVP |
| PS-058-03.R06 | Public band is a live value, not an endorsement; no automatic ranking boost in MVP. | MVP |

## Data / schema
`status` enum closed: `insufficient_data`, `ready`, `under_review`, `frozen`.

## Commands / queries / events
Transitions driven by input events (PS-058-02), recompute jobs, `pseudonym.retired`, and F12 `reputation.review_opened` / `reputation.review_closed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| `insufficient_data` | recompute | thresholds met | `ready` | event `reputation.band_changed` if band > 0 |
| `ready` | recompute | thresholds not met (decay) | `insufficient_data` | band hidden |
| `ready` / `insufficient_data` | F12 review opened | — | `under_review` | band frozen |
| `under_review` | F12 review closed | — | previous status recomputed | event `reputation.review_closed` |
| any | `pseudonym.retired` | — | `frozen` | recompute stops; band hidden after 30 days |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `REPUTE.NOT_ENOUGH_DATA` | false | `err.repute.not_enough_data` |
| `REPUTE.UNDER_REVIEW` | true (after review) | `err.repute.under_review` |
| `REPUTE.SUBJECT_FROZEN` | false | `err.repute.frozen` |

## Authorization
Transitions by `sys_` principals only; F12 review events from `mod_` with case grant.

## Failure, idempotency, concurrency, offline
Recompute idempotent per (`prf_`, input watermark). Concurrent recomputes: compare-and-set on revision; loser retries.

## Privacy, retention, abuse
Band-change events carry `prf_id`, old band and new band only.

## Observability & budgets
`repute_transition_total{from,to}`; recompute lag p95 ≤ 60 s.

## Tests
- TEST-PS-058-03-01 (unit): transition table complete.
- TEST-PS-058-03-02 (integration): band hidden 30 days after retirement.
- TEST-PS-058-03-03 (integration): F12 review freezes band; closing restores computed status.
- TEST-PS-058-03-04 (property): no band change without a status change or input change.

## Acceptance criteria
1. Only listed transitions occur.
2. Under-review subjects show no changed band.
3. Retired pseudonym band hidden after 30 days.
4. Band-change event emitted only on real change.

## Assumptions & open decisions
- ASSUMPTION: thresholds 5 counterparties and 10 points.
- PROVISIONAL (D07 default, unapproved): hide after retirement + 30 days.
