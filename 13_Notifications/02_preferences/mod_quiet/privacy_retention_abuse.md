# PS-108-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_quiet. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-108-07.R01 | Pause state is PRIVATE_PERSONAL and never leaves the owner's view, the gating path and the audit path. | MVP |
| PS-108-07.R02 | Senders are not informed when recipients are paused (no read receipts, no "unavailable" status). | MVP |
| PS-108-07.R03 | Held notification records hold IDs and category only. | MVP |
| PS-108-07.R04 | Purged 30 days after end (PS-108-01.R05). | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| qpd_ period rows | PRIVATE_PERSONAL | 30 days after end |
| held records | PSEUDONYMOUS | until release or 24 h |
| decision records | PSEUDONYMOUS | RET-AUD 12 months (outcome only) |

## Commands / queries / events
Events carry no zone or content.

## States & transitions
Account deletion ends the period and drops held items.

## Validation & errors
No period detail in error bodies.

## Authorization
Owner-only; see authorization_capabilities.

## Failure, idempotency, concurrency, offline
Purge job idempotent.

## Privacy, retention, abuse
- Abuse: starting and resuming periods repeatedly to churn gating (limit 20 starts per hour, ASSUMPTION).
- Abuse: long pauses used to hide a stalled deadline from a counterparty; deadlines are visible in the workflow record, not by notifications, so this is accepted residual risk.
- Privacy: pauses reveal sleep or focus times; mitigated by R01 and R02.

## Observability & budgets
Counts only.

## Tests
- TEST-PS-108-07-01 (integration): sender API calls reveal no pause state.
- TEST-PS-108-07-02 (contract): log scan finds no zone or period bounds.
- TEST-PS-108-07-03 (unit): 21st start in an hour rejected with QUIET.RATE_LIMITED.
- TEST-PS-108-07-04 (integration): deletion ends period and purges held rows.

## Acceptance criteria
1. Sender-visible surface audited for leakage (no signal).
2. Scans pass.
3. Privacy Lead review pending.

## Assumptions & open decisions
- ASSUMPTION: 20 starts per hour.
- D07 PROVISIONAL (D07 default, unapproved).
