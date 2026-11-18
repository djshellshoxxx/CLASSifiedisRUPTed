# PS-112-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-04. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); subject consumers are LocalBazaar listings and LocalMutiny proposals and cycles.

## Purpose and scope
Defines the public surface of currencies: eight commands, six queries and eleven domain events, with signatures, idempotency keys, schema versions and example payloads. Business outcome: other modules can obtain a pinned, expiring rate and a verifiable conversion without reading currencies' tables. Exclusions: no command moves funds, creates a payment, or confirms a real-world handover. Transport is HTTPS JSON; the binding below is the reference form.

## Requirements
- PS-112-04.R01: Eight commands are exposed (section "Commands"). Each has a signature, an actor set, an idempotency rule and a schema version. Actors and capability names come from authorization_capabilities.md.
- PS-112-04.R02: Six queries are exposed (section "Queries"). Queries are side-effect free, cursor-paginated at 100 rows maximum, and never return amounts for subjects the caller does not party to.
- PS-112-04.R03: Eleven events are emitted (section "Events"). Each uses the envelope below and an event name with a `.vN` suffix. Events containing `subject_ref` are delivered only to the owning subject service.
- PS-112-04.R04: Every state-changing command requires `Idempotency-Key` (V21). Every command body carries `schema_version: 1` (V20). Revisioned updates require `If-Match`.
- PS-112-04.R05: Envelope fields follow CTR-EVT-001 (F15, OPEN). Until that contract is approved, this module uses the fields listed under "Event envelope" and makes no compatibility promise beyond schema version 1.
- PS-112-04.R06: Error responses use the envelope in validation_rules.md. No command returns stack traces or storage details.

## Commands
| Command | Signature (reference form) | Actor | Idempotency | Revision |
|---|---|---|---|---|
| `currencies.catalog.register` | `register(req: {code, numeric_code?, name_key, minor_unit_exponent, kind}): CurrencyDefinition` | operator | Key; natural key `code` | created at 1 |
| `currencies.catalog.set_status` | `setStatus(req: {code, status, reason_code}, ifMatch: int): CurrencyDefinition` | operator | Key; same status = no-op | +1 |
| `currencies.fx.publish` | `publish(req: {base_code, quote_code, rate, source_id, as_of, ttl_minutes?, override_reason_code?, second_approver_ref?}): FxQuote` | operator, FX importer (allowlisted source) | Key | n/a |
| `currencies.fx.withdraw` | `withdraw(req: {quote_id, reason_code}, ifMatch: int): FxQuote` | operator | Key; WITHDRAWN = no-op | +1 |
| `currencies.valuation.pin` | `pin(req: {quote_id, subject_type, subject_ref, subject_deadline?}): ValuationPin` | subject service | Key; natural key (subject_ref, quote_id) | n/a |
| `currencies.valuation.release` | `release(req: {pin_id, reason_code}): ValuationPin` | subject service, scheduler | Key; terminal = no-op | +1 |
| `currencies.valuation.convert` | `convert(req: {pin_id, input_minor, rounding_policy?, supersedes_conversion_id?}): ConversionRecord` | subject service | Key (required, never natural) | n/a |
| `currencies.preference.set` | `setPreference(req: {display_code}, ifMatch: int): DisplayPreference` | participant (own only) | Key | +1 |

`release` maps `reason_code` as follows: `SUBJECT_CLOSED` gives RELEASED; `SUBJECT_CANCELLED` and `SUBJECT_DROPOUT` give INVALIDATED.

## Queries
| Query | Signature | Actor | Pagination |
|---|---|---|---|
| `currencies.catalog.list` | `list(filter: {status?, kind?}, cursor?, limit<=100): Page<CurrencyDefinition>` | public | cursor |
| `currencies.catalog.get` | `get(code): CurrencyDefinition` | public | none |
| `currencies.fx.get_active` | `getActive(base_code, quote_code): FxQuote` (newest ACTIVE, unexpired) | public | none |
| `currencies.valuation.get_pin` | `getPin(pin_id): ValuationPin` | party to subject, subject service, auditor with ticket | none |
| `currencies.valuation.list_conversions` | `listConversions(pin_id? or subject_ref?, cursor?, limit<=100): Page<ConversionRecord>` | party, subject service, auditor with ticket | cursor |
| `currencies.preference.get` | `getPreference(): DisplayPreference` | participant (own only) | none |

## Request and response examples
Request, convert (`POST /v1/currencies/valuations/convert`):
```json
{
  "schema_version": 1,
  "pin_id": "pin_01J9D1A3B5C7D9E1F3G5H7J9K1",
  "input_minor": "1250",
  "rounding_policy": "HALF_EVEN"
}
```
Headers: `Authorization: Bearer <service token>`, `Idempotency-Key: 01J9E4R7T1V3X5Z7B9D1F3H5J7`.

Response, `201 Created`:
```json
{
  "schema_version": 1,
  "conversion_id": "cnv_01J9E4R7T1V3X5Z7B9D1F3H5J7",
  "pin_id": "pin_01J9D1A3B5C7D9E1F3G5H7J9K1",
  "quote_id": "fxq_01J9C7K2M4N6P8Q0R2S4T6V8W0",
  "from_code": "EUR",
  "to_code": "USD",
  "input_minor": "1250",
  "output_minor": "1356",
  "exact_output_decimal": "1356.25",
  "rounding_policy": "HALF_EVEN",
  "computed_at": "2026-11-10T07:10:00Z"
}
```
Replay with the same key returns the same body with header `Idempotent-Replayed: true` and status 200.

Request, publish quote (`POST /v1/currencies/fx-quotes`):
```json
{"schema_version":1,"base_code":"EUR","quote_code":"USD","rate":"1.085","source_id":"ops_daily_table","as_of":"2026-11-10T06:00:00Z","ttl_minutes":60}
```

## Events
| Event | Payload fields (beyond envelope) | Audience |
|---|---|---|
| `currencies.catalog.registered.v1` | code, kind, status | public feed |
| `currencies.catalog.status_changed.v1` | code, from_status, to_status, reason_code | public feed |
| `currencies.fx.published.v1` | quote_id, base_code, quote_code, rate, source_id, expires_at | public feed |
| `currencies.fx.expired.v1` | quote_id | public feed |
| `currencies.fx.withdrawn.v1` | quote_id, status_reason_code | public feed |
| `currencies.valuation.pinned.v1` | pin_id, quote_id, subject_type, subject_ref, valid_until | owning subject service |
| `currencies.valuation.released.v1` | pin_id, status_reason_code | owning subject service |
| `currencies.valuation.invalidated.v1` | pin_id, status_reason_code | owning subject service |
| `currencies.valuation.expired.v1` | pin_id | owning subject service |
| `currencies.conversion.recorded.v1` | conversion_id, pin_id, quote_id | owning subject service |
| `currencies.preference.changed.v1` | (none; `user_ref` in envelope only) | audit log only |

Events carry no amounts. Subscribers read amounts through `listConversions` with their own capability.

## Event envelope (provisional, CTR-EVT-001)
```json
{
  "event_id": "evt_01J9E8M2N4P6Q8R0S2T4V6W8X0",
  "event_type": "currencies.conversion.recorded.v1",
  "schema_version": 1,
  "aggregate_type": "conversion_record",
  "aggregate_id": "cnv_01J9E4R7T1V3X5Z7B9D1F3H5J7",
  "aggregate_revision": 1,
  "occurred_at": "2026-11-10T07:10:00Z",
  "actor_ref": "svc_mutiny_01J9",
  "correlation_id": "corr_01J9E4R7",
  "idempotency_key": "01J9E4R7T1V3X5Z7B9D1F3H5J7",
  "provenance": {"source_module": "currencies", "source_version": "1.0.0"},
  "payload": {"conversion_id": "cnv_01J9E4R7T1V3X5Z7B9D1F3H5J7", "pin_id": "pin_01J9D1A3B5C7D9E1F3G5H7J9K1", "quote_id": "fxq_01J9C7K2M4N6P8Q0R2S4T6V8W0"}
}
```
Signatures are not used on internal events. Federated envelopes are out of MVP scope (CTR-FED-001 and D01).

## Versioning
- URL prefix `/v1`; body `schema_version` must equal 1 (V20).
- Within v1 only additive changes are allowed (new optional fields, new event types). Removing or retyping a field requires `.v2` events and `schema_version: 2` with a new command version. Compatibility rules are governed by CTR-SCH-001 (F15, OPEN).

## Open decisions
- Transport choice (HTTP JSON in the binding shown) is provisional; CTR-ID-001 and CTR-EVT-001 are OPEN in planning/CONTRACTS.md.
- A-currencies-16 (in failure_recovery_idempotency.md): outbox delivery is at-least-once; consumers dedupe by `event_id`.
- Related: D01 (federated protocol), D10 (key-based auth for service principals).
