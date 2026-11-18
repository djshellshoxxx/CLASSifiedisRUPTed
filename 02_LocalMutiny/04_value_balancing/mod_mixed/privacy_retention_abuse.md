# PS-026-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_mixed. **Parent:** [mod_mixed SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-026-07.R01 | Leg amounts, currencies and due dates are class FINANCIAL_EVIDENCE. Descriptions are PRIVATE_PERSONAL. Party refs are PSEUDONYMOUS. | MVP |
| PS-026-07.R02 | No payment handle, bank reference, wallet address or contact detail is stored in a leg. External references live only on the `clm_` claim (CTR-COM-001 `external_ref`). | MVP |
| PS-026-07.R03 | Legs of a cycle that did not reach `CONSENTED` are deleted 30 days after the cycle's terminal state (ASSUMPTION). | MVP |
| PS-026-07.R04 | Consented or submitted legs are retained as append-only evidence for the dispute window (14 days) plus 365 days (PROVISIONAL, D07 default), then party refs are pseudonymized. Legal hold overrides. | MVP |
| PS-026-07.R05 | Per actor: ≤ 20 declare calls per cycle per hour; excess → `SYS.RATE_LIMITED`. | MVP |

## Data / schema
Retention fields on the leg: `retain_until` (computed), `legal_hold` (boolean, set by F10 only). Pseudonymization replaces `from_par`/`to_par` linkage with a tombstone token; amounts remain.

## Commands / queries / events
Deletion and pseudonymization run as `sys_` jobs and emit `mixed.leg.purged` (no amounts in payload).

## States & transitions
Retention states: ACTIVE → ARCHIVED (after terminal state + 14 days) → PSEUDONYMIZED (+365 days) → PURGED (drafts only at +30 days).

## Validation & errors
Export or purge requests for legs under legal hold return `SYS.CONFLICT` with reason `legal_hold`.

## Authorization
Export of own legs is allowed to each participant (`cyc.export`). Purge is `sys` only.

## Failure, idempotency, concurrency, offline
Purge jobs are idempotent per leg. A purge racing an active dispute is blocked by the DISPUTED guard (PS-026-03).

## Privacy, retention, abuse
Abuse controls: rate limit (R05); value-inflation signal from mod_valuation is forwarded to F12 as advisory only. Compensation legs cannot be used to transfer value outside a cycle: a leg without a cycle revision is rejected. Pseudonyms do not guarantee anonymity against counterparties who already know each other.

## Observability & budgets
Metrics: `mixed_legs_purged_total`, `mixed_rate_limited_total`. No amounts in logs. Purge job completes within 24 h of due date.

## Tests
- TEST-PS-026-07-01 (unit): every field has one data class (lint).
- TEST-PS-026-07-02 (integration): legal hold blocks purge and pseudonymization.
- TEST-PS-026-07-03 (abuse): 21st declare in one hour rejected with `SYS.RATE_LIMITED`.
- TEST-PS-026-07-04 (negative): leg payload with a URL or phone number in description rejected.

## Acceptance criteria
1. Retention schedule matches R03 and R04 in the scheduler config.
2. Purge leaves no linkage between a pseudonymized leg and a party `acc_`.
3. Legal-hold tests pass before any purge job is enabled.

## Assumptions & open decisions
- ASSUMPTION: 30-day draft retention; 14-day dispute window per CTR-COM-001 R16.
- PROVISIONAL: retention defaults follow D07 default (unapproved). Legal retention periods require jurisdiction review (OPEN). See [DECISIONS.md](../../../DECISIONS.md).
