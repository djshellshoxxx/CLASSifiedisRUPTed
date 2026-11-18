# PS-032-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-04. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Versioned command, query and domain-event contracts for quotes, bound to REST paths for v1. Business outcome: provider and requester clients and downstream consumers act on quote state through stable, idempotent, typed interfaces.

Exclusions: no payment, escrow or delivery commands; no bulk import; no federation envelopes (CTR-FED-001); no direct database access by other modules. Event envelope fields follow CTR-EVT-001 (owner F15). Error shape follows CTR-ERR-001.

## Requirements
- PS-032-04.R01: Each command has a signature, actor, request example, response example, idempotency rule and schema version (Section 1).
- PS-032-04.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial cases are listed in Section 5 and tested in TEST-PS-032-04-T01 to T05.
- PS-032-04.R03: Responses contain no free text from other parties beyond the requester's own `counter_note` and the provider's `notes`. Latency budgets are in observability_performance.md.
- PS-032-04.R04: Every state-changing command requires an `Idempotency-Key`. Replay semantics are in failure_recovery_idempotency.md.
- PS-032-04.R05: Schema versions follow CTR-SCH-001 semver. Minor changes are additive. Major changes require new event type suffix `.v2` (A-quotes-21).
- PS-032-04.R06: List queries are cursor-paginated. Maximum `limit` is 50.

## 1. Commands
Common headers: `Idempotency-Key` (required on all POST/PUT), `Content-Type: application/json`, body field `schema_version`.

| # | Signature | REST binding | Actor | Idempotent |
|---|---|---|---|---|
| C1 | `quotes.quote.create(request_ref, service_ref, requester_participant_id, currency_code, notes?, line_items[]) → QuoteView` | POST /v1/quotes | Provider | key |
| C2 | `quotes.quote.revise(quote_id, expected_version, notes?, line_items[], valid_until?) → QuoteView` | PUT /v1/quotes/{quote_id}/revision | Provider | key |
| C3 | `quotes.quote.issue(quote_id, expected_version, valid_until?) → QuoteView` | POST /v1/quotes/{quote_id}:issue | Provider | key |
| C4 | `quotes.quote.respond(quote_id, expected_version, revision_no, decision, acknowledged_content_hash?, counter_total_minor?, counter_note?) → QuoteView` | POST /v1/quotes/{quote_id}:respond | Requester | key |
| C5 | `quotes.quote.withdraw(quote_id, expected_version, reason_code) → QuoteView` | POST /v1/quotes/{quote_id}:withdraw | Provider | key |
| C6 | `quotes.quote.set_hold(quote_id, hold, reason_code, case_ref) → QuoteView` | POST /v1/quotes/{quote_id}:hold | Operator | key |

`reason_code` for C5: NO_LONGER_AVAILABLE, PRICE_ERROR, OTHER. For C6: MODERATION_CASE, FRAUD_SIGNAL, RELEASED_AFTER_REVIEW. `case_ref` is an opaque moderation case identifier (`^[A-Za-z0-9_-]{8,64}$`).

## 2. Queries
| # | Signature | REST binding | Actor | Notes |
|---|---|---|---|---|
| Q1 | `quotes.quote.get(quote_id) → QuoteView` | GET /v1/quotes/{quote_id} | Party or Operator (audited) | Non-party receives QUOTES_NOT_FOUND |
| Q2 | `quotes.quote.get_revision(quote_id, revision_no) → RevisionView` | GET /v1/quotes/{quote_id}/revisions/{revision_no} | Party or Operator | Issued revisions only, plus caller's own composing revision |
| Q3 | `quotes.quote.list(role, status?, cursor?, limit?) → Page<QuoteSummary>` | GET /v1/quotes | Authenticated participant | `role` is provider or requester; returns caller's own quotes only; `limit` 1..50, default 25 |

## 3. Request and response examples
C1 request:
```json
{
  "schema_version": "1.0.0",
  "request_ref": "req_example_0001",
  "service_ref": "svc_example_0007",
  "requester_participant_id": "p_requester_example_02",
  "currency_code": "EUR",
  "notes": "Two visits, parking not included.",
  "line_items": [
    {"description": "Initial site visit", "service_item_code": "visit_std", "quantity_milli": 2000, "unit_price_minor": 4500}
  ]
}
```
C1 response, 201:
```json
{
  "schema_version": "1.0.0",
  "quote_id": "01J9QTX7M3K2R8W5N4P6T0V1Z2",
  "status": "COMPOSING",
  "version": 1,
  "current_revision_no": 1,
  "issued_revision_no": null,
  "counter_count": 0,
  "valid_until": null,
  "revision": {"revision_no": 1, "currency_code": "EUR", "total_minor": 9000, "content_hash": null, "line_items": [{"position": 1, "description": "Initial site visit", "quantity_milli": 2000, "unit_price_minor": 4500, "line_total_minor": 9000}]}
}
```
C4 request (accept):
```json
{
  "schema_version": "1.0.0",
  "expected_version": 3,
  "revision_no": 1,
  "decision": "ACCEPT",
  "acknowledged_content_hash": "3f9a0c…"
}
```
Error response (version conflict):
```json
{"error": {"code": "QUOTES_VERSION_CONFLICT", "retryable": true, "message_key": "quotes.error.version_conflict", "diagnostic_id": "dx_01J9QTXM6R"}, "current_version": 4}
```

## 4. Domain events
Envelope fields per CTR-EVT-001: `event_id`, `event_type`, `aggregate_type` (`quotes.quote`), `aggregate_id` (quote_id), `revision` (equals `version` after the write), `occurred_at`, `actor`, `provenance` (module path and command_id), `correlation_id`, `schema_version`, `payload`. Events are server-internal and unsigned; transport is authenticated (A-quotes-20).

| Event type | Trigger | Payload fields |
|---|---|---|
| quotes.quote.created.v1 | C1 | quote_id, status, provider_participant_id, requester_participant_id, currency_code |
| quotes.quote.issued.v1 | C3 or issue after counter | quote_id, issued_revision_no, total_minor, currency_code, valid_until, content_hash |
| quotes.quote.countered.v1 | C4 COUNTER | quote_id, revision_no, counter_total_minor, counter_count |
| quotes.quote.accepted.v1 | C4 ACCEPT | quote_id, revision_no, content_hash, total_minor, currency_code |
| quotes.quote.declined.v1 | C4 DECLINE | quote_id, revision_no |
| quotes.quote.withdrawn.v1 | C5 or stale timeout | quote_id, closed_reason |
| quotes.quote.expired.v1 | Expiry job | quote_id, valid_until |
| quotes.quote.hold_changed.v1 | C6 | quote_id, hold, reason_code |

Payloads contain no `description`, `notes` or `counter_note` text (R03 and privacy_retention_abuse.md).

## 5. Normal, invalid, adversarial and offline cases
| Class | Case | Expected result | Test |
|---|---|---|---|
| normal | C1 then C3 then C4 ACCEPT | Events created, issued, accepted in order | T01 |
| invalid | C3 with zero lines | QUOTES_LINE_EMPTY; no event | T02 |
| duplicate | Same Idempotency-Key twice for C1 | Second call returns stored 201 with `Idempotent-Replayed: true`; one event | T03 |
| concurrent | C2 and C3 with same `expected_version` | One succeeds; other QUOTES_VERSION_CONFLICT | T05 |
| adversarial | Unknown `schema_version` 2.0.0 | QUOTES_SCHEMA_VERSION_UNSUPPORTED | T04 |
| offline | Client queues C4 offline, sends on reconnect with same key | Single transition; replay on retry | T03 |

## Assumptions and open decisions
- A-quotes-20: Events are server-internal and unsigned, transport-authenticated. Payloads carry no free text.
- A-quotes-21: Schema versions are semver under CTR-SCH-001. Minor is additive. Major creates `.v2` event types and a new REST path prefix.
- Idempotency-Key retention and replay rules are defined in failure_recovery_idempotency.md (A-quotes-14).
- Q2 returns issued revisions to parties. Composing content of the provider is never visible to the requester.
