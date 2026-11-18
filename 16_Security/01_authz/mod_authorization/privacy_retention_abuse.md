# PS-126-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_authorization](SPEC.md) (Security Lead; privacy review by Privacy Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-126-07.R01 | Decision records contain no object content, no free-text purpose naming a person, and no precise location. | MVP |
| PS-126-07.R02 | Enumeration defence: a denied read of an unreadable object returns a body identical to a nonexistent object (CTR-ERR-001 R08). | MVP |
| PS-126-07.R03 | Repeated DENY from one principal above 50 per hour (ASSUMPTION) raises a CAP alert. | MVP |
| PS-126-07.R04 | Operator access to decision logs is written to a separate audit store readable only by the audit role (BT-02). | MVP |
| PS-126-07.R05 | Bulk endpoints count only visible items in list totals. | MVP |

## Data / schema
| Data | Class | Retention |
|---|---|---|
| Decision record | PSEUDONYMOUS | RET-AUD: 12 months |
| Grant record | PSEUDONYMOUS | RET-EVD while subject active, then RET-AUD |
| Policy version | PUBLIC | RET-AUD, plus permanent hash record |
| Cache entry | PSEUDONYMOUS | RET-EPH ≤ 60 s |

## Commands / queries / events
`authz.explain` returns reason codes only (PS-126-04 R04).

## States & transitions
Retention purge runs on expiry of the retention class; legal hold (RET-LEGAL) overrides.

## Validation & errors
Error responses never reveal the policy rule that denied (only the reason enum to the owner, never to the requester).

## Authorization
Audit store reads: `aud.read` with purpose. Reads are themselves logged (R04).

## Failure, idempotency, concurrency, offline
Purge is idempotent by decision ID range.

## Privacy, retention, abuse
- Enumeration by ID guessing: R02 plus rate limits on read endpoints (ASSUMPTION 300 req/min per principal).
- Abuse by collusion: co-approval pairs monitored (see PS-126-05).
- Grant purpose strings are checked against the purpose registry; free text is refused.

## Observability & budgets
`authz_deny_rate{principal_kind}`; logs carry decision IDs and reason codes only.

## Tests
- TEST-PS-126-07-01 (privacy): decision table fixtures contain no content fields (schema test).
- TEST-PS-126-07-02 (enumeration): responses for guessed and nonexistent IDs are byte-identical after normalizing request ID.
- TEST-PS-126-07-03 (abuse): 51st DENY in an hour raises the CAP alert.
- TEST-PS-126-07-04 (retention): decision records purged at 12 months; legal hold blocks purge.

## Acceptance criteria
1. Zero content fields in decision records across the test corpus.
2. Enumeration test shows no difference in status, body or timing class.
3. Audit-store access is logged in 100% of test reads.

## Assumptions & open decisions
- ASSUMPTION: DENY alert threshold and per-principal read rate limit.
- PROVISIONAL (D07 default, unapproved): 12-month decision retention, legal-hold exceptions.
- PROVISIONAL (D05 default, unapproved): no precise location in decision records.
