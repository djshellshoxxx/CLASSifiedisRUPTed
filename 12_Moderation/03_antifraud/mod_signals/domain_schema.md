# PS-101-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (prefix `sgn` PENDING registry addition), CTR-PRV-001, CTR-EVT-001, CTR-SCH-001.

**Decision labels:** Retention default 30 days is PROVISIONAL (D07 default, unapproved). Aggregate threshold K_MIN = 5 is PROVISIONAL (D07 default, unapproved; F10 to validate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-01.R01 | Each signal is one immutable record `sgn_<26>` (CTR-ID-001 class `ulid`). This module is the canonical owner of the signal record class (B-06). Consumers reference `sgn_` IDs by full ID only. | MVP |
| PS-101-01.R02 | Only the fields in Data are accepted. Any other field is rejected (`SIGNAL.FORBIDDEN_FIELD`). | MVP |
| PS-101-01.R03 | Signals store derived features only: no message text, listing body, IP address, device identifier, coordinates or contact data. | MVP |
| PS-101-01.R04 | `window_start` and `window_end` are UTC, hour-aligned, span at most 7 days. | MVP |
| PS-101-01.R05 | `expires_at` = `created_at` + 30 days (RET-OPS). | MVP |
| PS-101-01.R06 | `subject_ref` is an `acc_` ID. `prf_` IDs are never stored (CTR-CAP-001 R02). | MVP |
| PS-101-01.R07 | Federated signals are Future scope. They need CTR-FED-001 and D01 resolution. | Future |

## Data / schema
```json
{
  "signal_id": "sgn_<26>",
  "schema_version": "1.0.0",
  "signal_type": "listing_velocity | message_velocity | report_density | auth_burst | bid_pattern",
  "signal_type_enum": "open (CTR-SCH-001 R04); unknown values stored, never scored",
  "subject_ref": "acc_<26>",
  "source_module": "F-ID string, e.g. F04.S02.M01",
  "source_event_ref": "evt_<26>",
  "value": "integer 0..100",
  "confidence_bucket": "low | medium | high",
  "window_start": "RFC3339 UTC, hour-aligned",
  "window_end": "RFC3339 UTC, hour-aligned, <= window_start + 7d",
  "created_at": "RFC3339 UTC, server-set",
  "expires_at": "created_at + 30d",
  "state": "ACTIVE | SUPPRESSED | EXPIRED | REDACTED (projection, see PS-101-03)",
  "revision": "integer >= 1"
}
```
Data classes: `subject_ref`, `value`, `window_*` are PSEUDONYMOUS. `source_module` is PUBLIC. No field is LOCATION_PRECISE or SECRET.

Provenance: `source_module` and `source_event_ref` are required. A signal without provenance is invalid.

## Commands / queries / events
Defined in PS-101-04. Record shape is versioned with `schema_version` (CTR-SCH-001); a new signal type is MINOR.

## States & transitions
See PS-101-03. Stored records are immutable; state is a projection.

## Validation & errors
See PS-101-02. Owner of persisted records: this module. Retention and rollback: PS-101-07, PS-101-10.

## Authorization
Not applicable to schema shape. Access rules: PS-101-05.

## Failure, idempotency, concurrency, offline
Uniqueness key: (`source_event_ref`, `signal_type`). Details: PS-101-06.

## Privacy, retention, abuse
Retention 30 days (RET-OPS). Subject deletion produces REDACTED (PS-101-07).

## Observability and budgets
Record count and size metrics: PS-101-08.

## Tests
- TEST-PS-101-01 (unit): every field in Data validates; unlisted field rejected.
- TEST-PS-101-02 (property): 10,000 random windows satisfy R04.

## Acceptance criteria
1. Schema registered in CTR-SCH-001 registry with golden fixtures.
2. No field carries an IP address, device ID, coordinate or free text.
3. `sgn` prefix registered in CTR-ID-001 (PENDING; F15 review).

## Assumptions & open decisions
- ASSUMPTION: signal_type set is open; five initial types are the MVP set.
- D07 retention default (PROVISIONAL, unapproved). D01 federation of signals deferred (PROVISIONAL, unapproved).
