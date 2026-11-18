# PS-087-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R06, Privacy section), CTR-PRV-001 (R06), CTR-EVT-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-07.R01 | Dedupe rows retained for the event horizon plus 24 h, then purged (ASSUMPTION). | MVP |
| PS-087-07.R02 | Equivocation evidence retained as RET-EVD while the peer is quarantined, then RET-AUD. | MVP |
| PS-087-07.R03 | Rows hold no payload and no actor references (CTR-EVT-001 R06 applies to events, rows mirror it). | MVP |
| PS-087-07.R04 | Abuse: flood of distinct event IDs from one peer raises alert at 10,000 new rows per hour per peer (ASSUMPTION). | MVP |

## Data / schema
Digests are SHA-256 of JCS payload; no reversible content.

## Commands / queries / events
None beyond [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Purge is the `expired` transition in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Abuse triggers rate limit with `FED.RATE_LIMITED` upstream.

## Authorization
Per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Purge idempotent per row.

## Privacy, retention, abuse
Retention above; abuse threshold above.

## Observability & budgets
Alert on R04 and on equivocation count.

## Tests
- TEST-PS-087-07-01 (retention): row purged after horizon plus 24 h.
- TEST-PS-087-07-02 (evidence): equivocation evidence kept while quarantined.
- TEST-PS-087-07-03 (abuse): flood alert fires.

## Acceptance criteria
1. Purge tested.
2. Evidence kept.
3. Flood alert tested.

## Assumptions & open decisions
- ASSUMPTION: 24 h grace; flood threshold.
- PROVISIONAL (D07 default, unapproved).
