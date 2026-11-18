# PS-032-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-COM-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-04.R01 | Every state-changing command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-032-04.R02 | Quote response ≤ 32 KB. Quote list per provider paginated, 50 per page. | MVP |
| PS-032-04.R03 | Events use CTR-EVT-001 envelope with `aggregate_type` = `service_quote`, `max_data_class` = FINANCIAL_EVIDENCE after SENT. | MVP |
| PS-032-04.R04 | Accept response returns `trx_id` and `price_hash`; no payment instructions. | MVP |

## Data / schema
| Command | Signature | Idempotency key |
|---|---|---|
| `svcquote.create` | (`srv_`, fields) → `svq_` in DRAFT | (actor, command, key) |
| `svcquote.send` | (`svq_`, expected_revision) → SENT; places holds | (actor, command, key) |
| `svcquote.accept` | (`svq_`, expected_revision, price_hash) → ACCEPTED, `trx_` | (actor, command, key) |
| `svcquote.decline` | (`svq_`, expected_revision) | (actor, command, key) |
| `svcquote.withdraw` | (`svq_`, expected_revision) | (actor, command, key) |
| `svcquote.supersede` | (`svq_`, expected_revision, new fields) → new `svq_` | (actor, command, key) |

Queries: `svcquote.get(svq_)`, `svcquote.list(srv_ or customer scope, status, cursor)`.

## Commands / queries / events
| Event (`schema_id`) | Emitted by |
|---|---|
| `svcquote.created` | create |
| `svcquote.sent` | send |
| `svcquote.accepted` | accept (includes `trx_id`) |
| `svcquote.declined` | decline |
| `svcquote.withdrawn` | withdraw |
| `svcquote.expired` | timer |
| `svcquote.superseded` | supersede |

Errors: PS-032-02 codes, `SVCQUOTE.INVALID_TRANSITION`, `SVCQUOTE.EXPIRED`, `SVCQUOTE.HOLD_LOST`, `SYS.CONFLICT`.

## States & transitions
Command outcomes map to PS-032-03.

## Validation & errors
Schema validation first; unknown fields rejected (`SYS.REQUEST_MALFORMED`).

## Authorization
Provider and customer actions per PS-032-05; `sys` for expiry.

## Failure, idempotency, concurrency, offline
Duplicate command with same key and digest returns original; different digest → `SYS.CONFLICT`. Events at-least-once; dedupe on `event_id`. `svcquote.accepted` consumed by F09 and by F03.S01.M02 (booking link).

## Privacy, retention, abuse
`svcquote.created` and `svcquote.sent` payloads omit `scope_text` (fetched on read). Subscribers receive minimum fields.

## Observability & budgets
Command p95 ≤ 200 ms; accept p95 ≤ 300 ms (PS-032-03).

## Tests
- TEST-PS-032-04-01 (contract): all commands and events validate against CTR-SCH-001.
- TEST-PS-032-04-02 (integration): duplicate accept returns identical `trx_id`.
- TEST-PS-032-04-03 (contract): `svcquote.sent` payload has no `scope_text` or amount fields.
- TEST-PS-032-04-04 (integration): accept with stale `price_hash` returns `SYS.CONFLICT`.

## Acceptance criteria
1. All commands and events registered in CTR-SCH-001.
2. Duplicate-accept replay returns identical result.
3. Event payload audit shows no free-text fields.

## Assumptions & open decisions
- ASSUMPTION: 24-hour idempotency retention.
- Consumers reference `svq_` and `trx_` by full ID only. See [DECISIONS.md](../../../DECISIONS.md) D04.
