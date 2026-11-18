# PS-023-07 — Privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-07.R01 | Lock rows hold item IDs and pseudonymous owner IDs only; no location, no free text. | MVP |
| PS-023-07.R02 | Non-participants cannot infer which items are reserved (ITEM_UNAVAILABLE response is uniform). | MVP |
| PS-023-07.R03 | Retention: rows removed 30 days after cycle end (D07 default, PROVISIONAL). | MVP |
| PS-023-07.R04 | Lock contention is never used as a public "item popularity" signal. | MVP |

## Data / schema
PSEUDONYMOUS for `owner_party_id`; PUBLIC for `item_id` (listing visibility).

## Commands / queries / events
Events visible to participants and F01 availability consumer only.

## States & transitions
Retention removal is background, not a lock state.

## Validation & errors
No privacy-specific codes; uniform `ITEM_UNAVAILABLE` covers hold-by-others and unknown items.

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Removal job idempotent.

## Privacy, retention, abuse
Threats: (1) reservation spam — an attacker creates many cycles to lock everyone's items; mitigated by consent requirement (every party must accept, PS-021) and by a 24 h TTL; (2) inventory probing via ITEM_UNAVAILABLE — uniform error and rate limit of 30 acquire attempts per principal per hour (ASSUMPTION); (3) contention timing as a popularity signal — metrics aggregated per class; (4) lock-based deanonymization across cycles — no cross-cycle lock query exposed.

## Observability & budgets
Logs: IDs and codes only.

## Tests
- TEST-PS-023-07-01 (privacy): response for item held elsewhere identical to unknown item.
- TEST-PS-023-07-02 (abuse): 31st acquire attempt in one hour → rate limited.
- TEST-PS-023-07-03 (retention): rows removed at T+30 days.

## Acceptance criteria
1. Uniform error verified byte-for-byte.
2. Rate limit enforced.
3. No public lock-count endpoint.

## Assumptions & open decisions
- ASSUMPTION: 30 acquire attempts per hour limit.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 30 days after cycle end.
- [DECISIONS.md](../../../DECISIONS.md) D05 — PROVISIONAL (D05 default, unapproved): no location in lock data.
