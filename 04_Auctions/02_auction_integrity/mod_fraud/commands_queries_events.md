# PS-037-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-04.R01 | Every state-changing command takes an idempotency key and an `expected_version` where a case is involved. | MVP |
| PS-037-04.R02 | Events use the CTR-EVT-001 envelope. Event payloads carry `case_id`, `auction_id`, `rule_id`, `score_max` only. | MVP |
| PS-037-04.R03 | `device_key_hash` and account IDs never appear in any event payload visible outside F12. | MVP |
| PS-037-04.R04 | Commands return within 300 ms p95; long work (rule evaluation) runs asynchronously on the bid stream. | MVP |

## Data / schema
Command signatures (JSON bodies, `schema_version` 1):
- `fraud.signal.record { auction_id, bid_ids, account_ids, rule_id, rule_version, score, features, device_key_hash?, source_event_id }` key: `sha256(auction_id|rule_id|rule_version|sorted bid_ids)`
- `fraud.case.claim { case_id, expected_version }` key: `case_id|mod_id|request_id`
- `fraud.case.dismiss | uphold { case_id, expected_version, reason_code, decision_id }` key: `case_id|decision_id`
- `fraud.case.escalate { case_id, expected_version, severity }`
- Query `fraud.case.get { case_id }` (F12 only); `fraud.aggregate.get { window, rule_id? }` returns counts, no IDs.

## Commands / queries / events
| Name | Type | Event emitted | Idempotent |
|---|---|---|---|
| fraud.signal.record | command (sys) | fraud.signal_recorded | yes |
| fraud.case.claim | command (mod) | fraud.case_claimed | yes |
| fraud.case.dismiss | command (mod) | fraud.case_dismissed | yes |
| fraud.case.uphold | command (mod) | fraud.case_upheld | yes |
| fraud.case.escalate | command (mod) | fraud.case_escalated | yes |
Version: all `v1`. Breaking change = new version with 6-month overlap (CTR-SCH-001).

## States & transitions
Commands map to transitions in PS-037-03; no command bypasses the guards.

## Validation & errors
Validation per PS-037-02; error envelope per CTR-ERR-001 with codes `FRAUD.*`.

## Authorization
Capability per command in PS-037-05. Unknown command returns `CAP.UNKNOWN_CAPABILITY` or `SYS.NOT_FOUND`.

## Failure, idempotency, concurrency, offline
Duplicate command with same key returns the original result. Stale `expected_version` returns 409 `FRAUD.CASE_STATE_CONFLICT`. Commands are not queued offline.

## Privacy, retention, abuse
Event `max_data_class` computed per CTR-PRV-001 R02; expected PSEUDONYMOUS for case events, PRIVATE_PERSONAL for signal events.

## Observability & budgets
Per-command latency histogram and error counter by code. Event lag p95 <= 5 s.

## Tests
- TEST-PS-037-04-01 (contract): each event validates against CTR-EVT-001 envelope.
- TEST-PS-037-04-02 (negative): event payload fixture containing `device_key_hash` fails the schema lint.
- TEST-PS-037-04-03 (idempotency): same claim key submitted twice produces one event.

## Acceptance criteria
1. Every command in the table has key, capability, version and error list.
2. No event contains account IDs or device hashes outside F12.
3. Commands meet the p95 budget in fixtures.

## Assumptions & open decisions
- ASSUMPTION: `fraud.aggregate.get` minimum group size k >= 5 before returning counts.
- PROVISIONAL (no Dxx): `fraud.signal.record` is callable only by the bid-stream service principal.
