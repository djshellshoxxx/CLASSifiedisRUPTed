# PS-027-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001, CTR-COM-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-07.R01 | Item values, currencies and net amounts are FINANCIAL_EVIDENCE. Free-text `item_ref` descriptions are PRIVATE_PERSONAL. | MVP |
| PS-027-07.R02 | Values never appear in public listing, search, federation payloads or push previews. | MVP |
| PS-027-07.R03 | A `self_declared` value deviating from the listing reference price by more than 50% (ASSUMPTION) raises an advisory signal to F12 with `cyc_` and `par_id` only. | MVP |
| PS-027-07.R04 | Snapshots are retained with the cycle for the dispute window (14 days) plus 365 days (PROVISIONAL, D07 default), then party refs are pseudonymized. Legal hold overrides. | MVP |
| PS-027-07.R05 | Per actor ≤ 60 valuation declarations per cycle per hour; excess → `SYS.RATE_LIMITED`. | MVP |

## Data / schema
Retention fields: `retain_until`, `legal_hold` (F10 only). Pseudonymization removes `par_id` linkage and keeps aggregate values.

## Commands / queries / events
Purge runs as `sys` and emits `valuation.snapshot_purged` with counts only.

## States & transitions
ACTIVE → ARCHIVED (terminal state + 14 days) → PSEUDONYMIZED (+365 days) → PURGED (STALE rows of never-consented cycles at +30 days).

## Validation & errors
Export or purge under legal hold → `SYS.CONFLICT` (reason `legal_hold`).

## Authorization
Participants may export own-side values (`cyc.export`). Purge is `sys` only.

## Failure, idempotency, concurrency, offline
Purge is idempotent per snapshot. Purge cannot race an open dispute (guard from PS-027-03).

## Privacy, retention, abuse
Abuse patterns: inflated declarations to shift compensation; repeated re-computation to probe quotes. Controls: R03 advisory signal, R05 rate limit, and the rule that declared values never override listing reference in the displayed gap without a disclosure line. Pseudonyms do not hide values from counterparties in the same cycle.

## Observability & budgets
Metrics: `valuation_advisory_signals_total`, `valuation_rate_limited_total`, `valuation_snapshots_purged_total`. No values in logs.

## Tests
- TEST-PS-027-07-01 (lint): every field has one data class.
- TEST-PS-027-07-02 (integration): 60% deviation raises advisory signal; 40% does not.
- TEST-PS-027-07-03 (negative): snapshot values absent from listing and search responses.
- TEST-PS-027-07-04 (integration): legal hold blocks purge.

## Acceptance criteria
1. Retention schedule matches R04 in scheduler configuration.
2. Advisory signals contain no monetary values.
3. No public endpoint returns a valuation field (automated scan).

## Assumptions & open decisions
- ASSUMPTION: 50% deviation threshold; 60 declarations per hour.
- PROVISIONAL: retention per D07 default (unapproved). Legal periods OPEN pending jurisdiction review. See [DECISIONS.md](../../../DECISIONS.md).
