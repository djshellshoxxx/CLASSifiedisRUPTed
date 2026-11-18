# PS-052-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PSEUDONYMOUS; RET-ACC, RET-OPS, RET-AUD, RET-EPH, RET-LEGAL), CTR-CAP-001, CTR-FED-001 (no federation in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-07.R01 | All `prf_` fields are PSEUDONYMOUS; zero LOCATION_PRECISE, PRIVATE_PERSONAL or SECRET fields. Verified by schema lint. | MVP |
| PS-052-07.R02 | `account_id` is never written to logs, analytics, push payloads, federation batches or error bodies. | MVP |
| PS-052-07.R03 | Retirement purges `label` and `handle` content after 30 days (ASSUMPTION); keeps tombstone (`prf_id`, `state`, `retired_at`) for RET-ACC. | MVP |
| PS-052-07.R04 | Handle reservation for 90 days after release, then removed. | MVP |
| PS-052-07.R05 | Creation rate ≤ 5 per account per 24 h; ≤ 20 per IP-derived bucket per 24 h (ASSUMPTION; IP not stored). | MVP |
| PS-052-07.R06 | Legal hold (RET-LEGAL) suspends purge for held records only. | MVP |
| PS-052-07.R07 | Verified-identity badges linked to `prf_`. | Future (owned by mod_reputation / mod_evidence) |

## Data / schema
Data classes per field in [domain_schema.md](domain_schema.md). Retention table:

| Record | Class | Retention |
|---|---|---|
| `prf_` active row | PSEUDONYMOUS | RET-ACC (account lifetime + 30 days) |
| `prf_` retired content | PSEUDONYMOUS | purged at 30 days; tombstone RET-ACC |
| `handle_reservations` | PSEUDONYMOUS | 90 days after release |
| idempotency records | internal | 7 days (RET-OPS) |
| audit (`aud_`) | internal | 12 months (RET-AUD) |

## Commands / queries / events
Event payloads exclude `account_id` (PS-052-04 R04). Only `actor_ref` in audit stream.

## States & transitions
Retention clocks start at transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Privacy failures: `PSEUD.LABEL_CONTAINS_CONTACT` (no echo). Diagnostics never include matched text.

## Authorization
Owner is the only principal that sees `account_id` (PS-052-05). Export by owner only.

## Failure, idempotency, concurrency, offline
Purge jobs are idempotent and resumable. Local caches cleared at logout (CTR-PRV-001).

## Privacy, retention, abuse
- **Linkability:** pseudonyms share no identifiers; the module does not give cross-pseudonym signals. Residual linkage through trade counterparties, timing and label reuse is not prevented here and is stated as a limit.
- **Sybil:** rate limits (R05) and account-level cap (PS-052-01 R04). Sybil resistance beyond that belongs to mod_reputation and mod_signals.
- **Impersonation and squatting:** reserved list (PS-052-02 R02); operator review of appeals owned by F12.
- **Contact leakage:** label contact-pattern checks (heuristic, not a guarantee).
- **Enumeration:** identical not-found responses (PS-052-05).

## Observability & budgets
Logs use `prf_id` only. No handle or label in logs. Abuse dashboards count events by code, not by value.

## Tests
- TEST-PS-052-07-01 (privacy scan): fixtures with account IDs produce no occurrence in public responses, events, logs or push.
- TEST-PS-052-07-02 (retention): content purged at 30 days; tombstone remains; reservation removed at 90 days.
- TEST-PS-052-07-03 (abuse): sixth creation in 24 h rejected; rate limit resets.
- TEST-PS-052-07-04 (legal hold): held record not purged; others purged.

## Acceptance criteria
1. Zero `account_id` occurrences outside owner-scoped responses and audit (fixture scan).
2. Retention timers verified against RET-ACC, RET-OPS, RET-AUD.
3. Rate limits enforced without storing IP addresses in this module.
4. Pseudonyms documented as not anonymous in user-facing copy (F14 review).

## Assumptions & open decisions
- ASSUMPTION: purge after 30 days; reservation 90 days.
- ASSUMPTION: rate limits 5 per account and 20 per bucket per 24 h.
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- PROVISIONAL (D10 default, unapproved): no federation of pseudonym linkage in MVP.
