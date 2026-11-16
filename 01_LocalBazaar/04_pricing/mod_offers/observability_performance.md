# PS-011-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (error metrics), CTR-EVT-001 (commit latency, rejections), CTR-CAP-001 (authz metrics), CTR-PRV-001 (log redaction, zero tolerance), CTR-SCH-001 (unknown-version metric).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-08.R01 | Emit `offer_commands_total{command,outcome,code}` for every command. Counts only. | MVP |
| PS-011-08.R02 | Server p95 latency ≤ 300 ms for submit, accept, reject and withdraw (ASSUMPTION). | MVP |
| PS-011-08.R03 | Expiry lag: p95 ≤ 60 s past expires_at (ASSUMPTION). | MVP |
| PS-011-08.R04 | Logs carry offer_id, listing_id, command, code, revision and request_id. No amounts, currency or refs. | MVP |
| PS-011-08.R05 | Dashboards show aggregate counts only. No per-user or per-listing breakdown below 5 items (K_MIN, CTR-PRV-001). | MVP |
| PS-011-08.R06 | Offer list renders ≤ 100 ms for 50 items on a mid-range phone (ASSUMPTION). | MVP |
| PS-011-08.R07 | Status is conveyed by text, not colour alone. Screen readers announce status and expiry (WCAG 2.1 AA). | MVP |
| PS-011-08.R08 | Amounts formatted with registry exponent; no float conversion (CTR-COM-001 R02). | MVP |

## Data / schema
Metric labels are enumerations only (command, outcome, code, from, to). No offer ID or user ID is a metric label.

## Commands / queries / events
Not applicable beyond metrics on PS-011-04 commands.

## States & transitions
Metric `offer_transitions_total{from,to}` per PS-011-03 transition.

## Validation & errors
Count `OFFER.*` and `SYS.*` codes returned for offer routes.

## Authorization
Authorization decision metrics per PS-011-05 (`offer_authz_decisions_total`).

## Failure, idempotency, concurrency, offline
Metrics: `offer_idempotent_replays_total`, `offer_revision_conflicts_total`, `offer_draft_not_applied_total`, `offer_superseded_pending_total`.

## Privacy, retention, abuse
Alerts: DUPLICATE_ACTIVE or RATE_LIMITED above 5% of submits over 15 min (BT-01 style, ASSUMPTION); SELF_OFFER bursts from one principal; accept attempts after expires_at; expiry lag above 5 min. Log retention RET-OPS (30 days).

## Observability & budgets
| Budget | Target | Basis |
|---|---|---|
| submit / accept / reject / withdraw p95 | ≤ 300 ms | ASSUMPTION |
| expiry lag p95 | ≤ 60 s | ASSUMPTION |
| offer list render, 50 items | ≤ 100 ms | ASSUMPTION |
| pending drafts per device | ≤ 20 | ASSUMPTION |

## Tests
- TEST-PS-011-08-01 (metrics): every command emits one counter per outcome; labels contain no IDs.
- TEST-PS-011-08-02 (log redaction): fixture amounts and refs absent from captured logs.
- TEST-PS-011-08-03 (load): 200 req/s mixed commands, p95 within R02 budget.
- TEST-PS-011-08-04 (expiry): expiry lag within R03 under sweep outage and recovery.
- TEST-PS-011-08-05 (a11y): status text present and announced by screen reader test script (PS-011-09 harness).
- TEST-PS-011-08-06 (render): 50-item list meets R06 on reference device profile.

## Acceptance criteria
1. Budgets measured in CI or staging before GO; ASSUMPTION targets confirmed or revised.
2. No log line in fixture run contains an amount or ref.
3. TEST-PS-011-08-01 through -06 pass.

## Assumptions & open decisions
- ASSUMPTION: all latency and render budgets above; reference device profile owned by F14/F17.
- PROVISIONAL (D07 default, unapproved): log retention RET-OPS.
- OPEN: K_MIN dashboard threshold (CTR-PRV-001 K_MIN = 5 assumed).
