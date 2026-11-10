# PS-032-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-01. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in Section 6; subscriber map pending F15 registry.

## Purpose and scope
Persisted model for quotes: a provider-issued, time-limited, priced offer for one requested service. Business outcome: a requester sees exactly what a provider offers (line items, integer minor-unit total, currency, validity window) and accepts, declines or counters one issued revision, with evidence of which revision and content hash were acknowledged.

Exclusions: no payment, invoice, escrow, custody or settlement (PROJECT_SPEC: no platform-held funds); no tax, fee or discount lines (A-quotes-05); no currency conversion or FX pinning (D03); no booking schedule or milestone state (mod_milestones); no dispute records (mod_disputes); no exact home address or precise geolocation (CTR-PRV-001); no federated quotes (CTR-FED-001 is out of scope for v1). Acceptance is a self-attested party assertion. It is not proof of delivery, payment or receipt.

## Requirements
- PS-032-01.R01: The model holds only quote, revision, line item, response, status history, outbox and idempotency records. Excluded data (Section scope above) has no field.
- PS-032-01.R02: Each normal, invalid, expired, duplicate, concurrent, offline and adversarial case in Section 7 maps to a test ID in contract_and_acceptance_tests.md.
- PS-032-01.R03: Read models carry `currency_code` beside every amount. The server stores no locale-formatted strings. Budgets are defined in observability_performance.md.
- PS-032-01.R04: Every monetary value is an integer count of minor units with a `currency_code`. Range 0 to 99999999999 inclusive. No floating-point type in storage, wire format or logs.
- PS-032-01.R05: An issued revision is immutable. `content_hash` is set at issue and never recomputed.
- PS-032-01.R06: `quote_status_history` and `outbox_event` rows are append-only. At most one non-terminal quote exists per (`request_ref`, `requester_participant_id`) (A-quotes-07).

## 1. quote
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| quote_id | string | no | ULID, 26 chars, primary key, immutable (A-quotes-01) | generated | 01J9QTX7M3K2R8W5N4P6T0V1Z2 |
| schema_version | string | no | semver `MAJOR.MINOR.PATCH` | `1.0.0` | 1.0.0 |
| request_ref | string | no | 8–64 chars `[A-Za-z0-9_-]`, opaque, immutable (A-quotes-03) | none | req_example_0001 |
| service_ref | string | no | 8–64 chars `[a-z0-9_]`, catalog identifier, immutable | none | svc_example_0007 |
| provider_participant_id | string | no | 8–64 chars `[a-z0-9_]`, pseudonymous, immutable | none | p_provider_example_01 |
| requester_participant_id | string | no | same format; must differ from provider | none | p_requester_example_02 |
| status | enum | no | COMPOSING, ISSUED, COUNTER_PROPOSED, ACCEPTED, DECLINED, WITHDRAWN, EXPIRED | COMPOSING | ISSUED |
| closed_reason | enum | yes | ACCEPTED, DECLINED, WITHDRAWN_BY_PROVIDER, STALE_COMPOSING, EXPIRED; set iff status is terminal | null | EXPIRED |
| current_revision_no | int | no | 1..20 | 1 | 2 |
| issued_revision_no | int | yes | 1..20, null until first issue, must be ≤ current_revision_no | null | 1 |
| counter_count | int | no | 0..3 | 0 | 1 |
| moderation_hold | bool | no | blocks issue and ACCEPT only | false | false |
| version | int | no | ≥1, optimistic lock, incremented on every write | 1 | 4 |
| valid_until | timestamp | yes | copy of issued revision's `valid_until` | null | 2026-11-24T09:00:00.000Z |
| created_at, updated_at | timestamp | no | RFC 3339 UTC, millisecond precision, server clock | now | 2026-11-10T09:00:00.000Z |
| issued_at | timestamp | yes | set on first issue | null | 2026-11-10T10:00:00.000Z |
| closed_at | timestamp | yes | set when status becomes terminal | null | null |

## 2. quote_revision
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| revision_id | string | no | ULID, primary key | generated | 01J9QTXB0Z5N7M2K4R8W3P6T1Y |
| quote_id | string | no | foreign key to quote | none | 01J9QTX7M3K2R8W5N4P6T0V1Z2 |
| revision_no | int | no | 1..20; unique (quote_id, revision_no) | none | 1 |
| currency_code | char(3) | no | ISO 4217 alpha-3, uppercase, in allowlist (A-quotes-02), immutable | none | EUR |
| total_minor | bigint | no | 0..99999999999; equals sum of `line_total_minor` | 0 | 9000 |
| notes | text | yes | 0..1000 chars, NFC, no control characters except LF | null | Two visits, parking not included. |
| valid_until | timestamp | yes | required at issue; bounds in validation_rules.md (A-quotes-04) | null | 2026-11-24T09:00:00.000Z |
| content_hash | char(64) | yes | lowercase hex SHA-256, set at issue, immutable (R05) | null | 3f9a…(64 hex chars) |
| created_by_participant_id | string | no | must equal quote provider | none | p_provider_example_01 |
| created_at | timestamp | no | server clock | now | 2026-11-10T09:00:00.000Z |
| issued_at | timestamp | yes | set when revision is issued | null | null |
| superseded_at | timestamp | yes | set when a later revision is issued | null | null |

A revision with `issued_at` null is editable. An issued revision is not. Editing an issued revision creates `revision_no + 1` as a new unissued revision (A-quotes-06 governs hashing).

## 3. quote_line_item
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| line_item_id | string | no | ULID, primary key | generated | 01J9QTXD8H3F6V1C9B2N5M4K7P |
| revision_id | string | no | foreign key to quote_revision | none | 01J9QTXB0Z5N7M2K4R8W3P6T1Y |
| position | int | no | 1..50; unique (revision_id, position) | none | 1 |
| description | text | no | 1..280 chars, NFC, no control characters | none | Initial site visit |
| service_item_code | string | yes | `^[a-z0-9_]{1,64}$` | null | visit_std |
| quantity_milli | bigint | no | 1..1000000000 (0.001 to 1,000,000 units) | 1000 | 2000 |
| unit_price_minor | bigint | no | 0..99999999999 | 0 | 4500 |
| line_total_minor | bigint | no | `quantity_milli × unit_price_minor / 1000` must be an exact integer; no rounding (R04) | 0 | 9000 |

## 4. quote_response (append-only)
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| response_id | string | no | ULID, primary key | 01J9QTXH2K6P9R4W7M1N8V3C5T |
| quote_id | string | no | foreign key | 01J9QTX7M3K2R8W5N4P6T0V1Z2 |
| revision_no | int | no | must equal `issued_revision_no` at receipt | 1 |
| responder_participant_id | string | no | must equal `requester_participant_id` | p_requester_example_02 |
| decision | enum | no | ACCEPT, DECLINE, COUNTER | ACCEPT |
| acknowledged_content_hash | char(64) | yes | required for ACCEPT; must equal revision `content_hash` | 3f9a… |
| counter_total_minor | bigint | yes | required for COUNTER; 1..99999999999; same `currency_code` as revision | 8000 |
| counter_note | text | yes | 0..500 chars, NFC | Could you do 8000? |
| created_at | timestamp | no | server clock | 2026-11-10T11:00:00.000Z |

## 5. quote_status_history and outbox_event (append-only)
- `quote_status_history`: history_id, quote_id, from_status (null on create), to_status, actor (participant_id or `system`), command_id, version_after, occurred_at.
- `outbox_event`: event_id (ULID), quote_id, event_type, schema_version, payload (JSON, no free text), occurred_at, published_at (null until delivered), attempts.

## 6. Relationships, indexes and candidate consumers
- quote 1..N quote_revision 1..N quote_line_item; quote 1..N quote_response; quote 1..N quote_status_history.
- Indexes: quote(provider_participant_id, status); quote(requester_participant_id, status); quote(status, valid_until) for the expiry job; unique partial index on quote(request_ref, requester_participant_id) where status not in terminal set (R06).
- Candidate consumers (subscriber map pending F15): notifications (issued, countered, accepted, declined, withdrawn, expired); mod_milestones (`quotes.quote.accepted.v1`, to confirm); moderation (`hold_changed`, reports).

## 7. Canonical content hash
`content_hash` = lowercase hex SHA-256 of the RFC 8785 JCS serialization (A-quotes-06) of this object: `{quote_id, revision_no, currency_code, total_minor, valid_until, notes, line_items:[{position, description, service_item_code, quantity_milli, unit_price_minor, line_total_minor}]}`. Line items sorted by `position`. Absent optional fields serialize as `null`, never omitted. Strings are NFC-normalized before hashing.

## 8. Example revision (persisted view, abbreviated)
```json
{
  "revision_id": "01J9QTXB0Z5N7M2K4R8W3P6T1Y",
  "quote_id": "01J9QTX7M3K2R8W5N4P6T0V1Z2",
  "revision_no": 1,
  "currency_code": "EUR",
  "total_minor": 9000,
  "valid_until": "2026-11-24T09:00:00.000Z",
  "content_hash": "3f9a0c…",
  "issued_at": "2026-11-10T10:00:00.000Z",
  "line_items": [
    {"position": 1, "description": "Initial site visit", "quantity_milli": 2000, "unit_price_minor": 4500, "line_total_minor": 9000}
  ]
}
```

## 9. Test references
Cases in Section 10 are covered by TEST-PS-032-01-T01 to T06 (defined in contract_and_acceptance_tests.md).

## 10. Normal, invalid and adversarial cases
| Class | Scenario | Expected model outcome | Test |
|---|---|---|---|
| normal | Provider issues revision 1, requester accepts | Quote ACCEPTED, response row written, revision immutable | T01 |
| invalid | Amount supplied as `9.00` (float) | Rejected before persistence; no row written | T02 |
| invalid | Revision edited after issue | Rejected; new revision created instead | T03 |
| duplicate | Second non-terminal quote for same pair | Unique partial index rejects insert | T04 |
| adversarial | Client-supplied `content_hash` on create | Field ignored and recomputed by server | T05 |
| normal | Zero-total giveaway revision | Accepted by model (total 0 permitted) | T06 |

Concurrency and offline cases are specified in failure_recovery_idempotency.md.

## Assumptions and open decisions
- A-quotes-01: Quote, revision, line and response IDs are ULIDs (26 chars). CTR-ID-001 owns the final choice.
- A-quotes-02: Currency allowlist is configured per deployment. Default allowlist EUR, USD, GBP. Minor-unit exponent comes from the ISO 4217 table.
- A-quotes-03: `request_ref` and `service_ref` are opaque identifiers owned outside this module. Existence is checked by a read to the owning module (timeout in failure_recovery_idempotency.md). This module owns no request record.
- A-quotes-05: No tax, fee or discount lines in v1. `total_minor` equals the sum of `line_total_minor`.
- A-quotes-06: Content hash uses RFC 8785 JCS with the fields in Section 7.
- A-quotes-07: At most one non-terminal quote per (`request_ref`, `requester_participant_id`).
- D03 (open, DECISIONS.md): mixed-currency valuation. This module supports one currency per revision. Cross-currency pinning is deferred to the valuation feature.
