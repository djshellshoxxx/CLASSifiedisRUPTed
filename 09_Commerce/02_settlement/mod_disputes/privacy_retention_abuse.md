# PS-070-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R07, R12; RET-EVD; RET-PRIV), CTR-CAP-001 (R06, R08), CTR-FED-001 (R03). **Decisions:** D07 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-07.R01 | Dispute record retained RET-EVD: 24 months after `RESOLVED` or `WITHDRAWN`; `statement` and personal fields redacted at 12 months, hashes kept (CTR-PRV-001). | MVP |
| PS-070-07.R02 | `statement` and evidence content are PRIVATE_PERSONAL; never federated, never in analytics or push previews. | MVP |
| PS-070-07.R03 | Legal hold on a `cas_` suspends redaction and deletion for its disputes only (CTR-PRV-001 R07). | MVP |
| PS-070-07.R04 | Max 3 open disputes per `acc_` at once and 5 raised per 30 days (ASSUMPTION) to limit frivolous or retaliatory disputes. | MVP |
| PS-070-07.R05 | Deletion of an account does not delete a dispute held as evidence; personal fields are redacted and a completion record is written (CTR-PRV-001 R12). | MVP |

## Data / schema
Retention classes referenced by name (RET-EVD, RET-PRIV, RET-LEGAL). No new class.

## Commands / queries / events
Redaction is a `sys_` job emitting `dispute.redacted` with IDs and counts only.

## States & transitions
Redaction does not change `status`.

## Validation & errors
Rate-limit breach returns `SYS.RATE_LIMITED` (retryable true, retry-after header). Limit breach on open disputes returns `DISPUTE.OPEN_LIMIT` (not retryable until one closes).

## Authorization
Redaction job has no read access to content beyond what it deletes.

## Failure, idempotency, concurrency, offline
Redaction is idempotent on `dispute_id` and redaction stage; restore from backup replays redactions (CTR-PRV-001 R06).

## Privacy, retention, abuse
| Threat | Control |
|---|---|
| Retaliatory or frivolous disputes | Limits R04; pattern alert on reciprocal raises within 24 h |
| Evidence fabrication | Digests and attestation (PS-071); moderator sees provenance |
| Harassment in `statement` | Length limit; moderation case escalation; no public display |
| Leak through logs | Canary scan in CI (PS-070-08) |
| Deanonymization from reason and timing | Dispute details visible only to parties and case moderator |

## Observability & budgets
Count of redactions per day; limit-hit rate per 1000 raises (alert > 10).

## Tests
- TEST-PS-070-07-01 (integration): redaction at 12 months leaves hashes and removes `statement`.
- TEST-PS-070-07-02 (integration): legal hold blocks redaction for its case only.
- TEST-PS-070-07-03 (abuse): 4th concurrent open dispute refused with `DISPUTE.OPEN_LIMIT`.
- TEST-PS-070-07-04 (negative): federation export of dispute is refused (`FED.DATA_CLASS_NOT_ALLOWED`).

## Acceptance criteria
1. Retention and redaction jobs match the table in 100% of fixtures.
2. No `statement` text in logs, events, analytics (canary scan).
3. Legal-hold scope tested with two overlapping cases.

## Assumptions & open decisions
- ASSUMPTION: open-dispute limit 3, raise limit 5 per 30 days.
- D07 (PROVISIONAL default, unapproved). Legal retention periods require R07 jurisdiction review (OPEN).
