# CTR-EVT-001 — Event envelope

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F15 Platform (named owner UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-EVT-001 (this file). **Depends on:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001, CTR-ERR-001, CTR-CAP-001. **Consumed by:** CTR-FED-001, CTR-COM-001, all modules emitting domain events.

**Decision label:** Signing algorithm and canonical JSON choice are PROVISIONAL (ASSUMPTION, unapproved). Federation wire rules are PROVISIONAL (D01 default, unapproved; see CTR-FED-001).

## Scope

The envelope that wraps every domain event written to the authoritative store, forwarded to subscribers, or exchanged with a federated peer. The payload schema is owned by CTR-SCH-001. Envelope fields are closed as listed below; unknown top-level fields are preserved (see Versioning).

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-EVT-001.R01 | Envelope contains the required fields in the schema below. Producers submit without `recorded_at`; stored and forwarded events always carry it. | MVP |
| CTR-EVT-001.R02 | `revision` is per aggregate. First event = 1. Each committed event increments by exactly 1. Assigned by the owning node under the aggregate lock. Commands carry `expected_revision`; mismatch → `EVT.REVISION_CONFLICT`. | MVP |
| CTR-EVT-001.R03 | Idempotency scope = (originating actor, command type, `idempotency_key`). Same key + same request digest → return original result, no new event. Same key + different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Records retained 7 days (ASSUMPTION). | MVP |
| CTR-EVT-001.R04 | `occurred_at` is producer-claimed; `recorded_at` is server-set at commit. For client-origin events: `recorded_at − 7 days ≤ occurred_at ≤ recorded_at + 5 min` (ASSUMPTION), else `EVT.TIMESTAMP_OUT_OF_RANGE`. Ordering never uses timestamps; use `revision`. | MVP |
| CTR-EVT-001.R05 | `signature` is REQUIRED on events with `provenance.source_kind = federated_import` and on any event exported to a peer. OPTIONAL otherwise. Signing input: UTF-8 bytes of `CLASSRUPT-EVT-SIG-v1\n` followed by RFC 8785 (JCS) serialization of the envelope with the `signature` member removed. Algorithm: Ed25519 (RFC 8032) via an audited library (ASSUMPTION). | MVP |
| CTR-EVT-001.R06 | `actor_ref.ref` is an opaque ID (`acc_`, `sys_`, `ope_`, `mod_`, `fpr_`). Names, emails, phone numbers, IP addresses, device identifiers and coordinates are forbidden in any envelope field. | MVP |
| CTR-EVT-001.R07 | Payload is validated against `schema_version` (CTR-SCH-001). Unknown major → `SCH.UNKNOWN_VERSION`. | MVP |
| CTR-EVT-001.R08 | Stored events are immutable. Corrections are new events. Redaction keeps the envelope and replaces payload content with a digest (see Data). Storage keeps a hash chain (ASSUMPTION): `chain_n = SHA-256(chain_(n-1) ‖ JCS(envelope_n with payload_digest))`. Deletion without a redaction event is detectable. | MVP |
| CTR-EVT-001.R09 | All events produced by one user-initiated command share one `correlation_id`. Sagas (for example, cycle execution) use one `correlation_id` for the whole saga. | MVP |
| CTR-EVT-001.R10 | `event_type` = `<aggregate_type>.<past-tense-verb>` (for example `listing.published`). Regex in Data. Verb is past tense. | MVP |
| CTR-EVT-001.R11 | `max_data_class` = most sensitive class in payload per CTR-PRV-001 ordering. `SECRET` is forbidden in any event (`EVT.SECRET_IN_PAYLOAD`). | MVP |
| CTR-EVT-001.R12 | Payload ≤ 64 KiB serialized (ASSUMPTION), nesting depth ≤ 8. Numbers are JSON integers within ±(2^53 − 1). Money and quantities use decimal strings (CTR-COM-001). Floats are forbidden for money. | MVP |
| CTR-EVT-001.R13 | Federation export re-keys `correlation_id`, omits `idempotency_key`, replaces `actor_ref` with a per-audience pseudonym and sets `provenance.origin_node` to the exporting node (CTR-FED-001). | MVP |

## Data / schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-EVT-001:envelope:1.0.0",
  "type": "object",
  "additionalProperties": true,
  "required": ["event_id","event_type","aggregate_type","aggregate_id","revision","actor_ref","occurred_at","provenance","correlation_id","idempotency_key","schema_version","max_data_class","payload"],
  "properties": {
    "event_id": {"type": "string", "pattern": "^evt_[0-9A-HJKMNP-TV-Z]{26}$"},
    "event_type": {"type": "string", "maxLength": 64, "pattern": "^[a-z][a-z_]{1,31}\\.[a-z][a-z_]{1,31}$"},
    "aggregate_type": {"type": "string", "pattern": "^[a-z][a-z_]{1,31}$"},
    "aggregate_id": {"type": "string", "pattern": "^[a-z]{3}_[0-9A-HJKMNP-TV-Z]{26}$"},
    "revision": {"type": "integer", "minimum": 1, "maximum": 9007199254740991},
    "actor_ref": {
      "type": "object", "required": ["kind","ref"], "additionalProperties": false,
      "properties": {
        "kind": {"enum": ["user","sys","ope","mod","fpr"]},
        "ref": {"type": "string", "pattern": "^(acc|sys|ope|mod|fpr)_[0-9A-HJKMNP-TV-Z]{26}$"}
      }
    },
    "occurred_at": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"},
    "recorded_at": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"},
    "provenance": {
      "type": "object", "required": ["origin_node","source_kind"], "additionalProperties": false,
      "properties": {
        "origin_node": {"type": "string", "pattern": "^nod_[0-9A-HJKMNP-TV-Z]{26}$"},
        "source_kind": {"enum": ["client_direct","client_offline_replay","server_internal","federated_import","migration","operator_correction"]}
      }
    },
    "signature": {
      "type": "object", "required": ["alg","key_id","value"], "additionalProperties": false,
      "properties": {
        "alg": {"const": "Ed25519"},
        "key_id": {"type": "string", "pattern": "^key_[0-9A-HJKMNP-TV-Z]{26}$"},
        "value": {"type": "string", "pattern": "^[A-Za-z0-9_-]{86}$"}
      }
    },
    "correlation_id": {"type": "string", "pattern": "^[a-z]{3}_[0-9A-HJKMNP-TV-Z]{26}$"},
    "idempotency_key": {"type": "string", "pattern": "^[A-Za-z0-9_-]{16,128}$"},
    "schema_version": {"type": "string", "pattern": "^(0|[1-9]\\d{0,3})\\.(0|[1-9]\\d{0,4})\\.(0|[1-9]\\d{0,5})$"},
    "max_data_class": {"enum": ["PUBLIC","PSEUDONYMOUS","LOCATION_COARSE","PRIVATE_PERSONAL","FINANCIAL_EVIDENCE","LOCATION_PRECISE"]},
    "audience": {"type": "string", "pattern": "^(nod_[0-9A-HJKMNP-TV-Z]{26}|public)$"},
    "expires_at": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"},
    "payload": {"type": "object"}
  }
}
```

Notes:
- `audience` and `expires_at` are federation-scoped optional fields. They are REQUIRED on federated events and signed with the envelope (CTR-FED-001).
- `recorded_at` is forbidden on submissions and required on stored events (R01). This is enforced in the write path, not in the schema.
- `payload_digest` (stored form only) = SHA-256 of JCS(payload). Used by R08.
- Event IDs use the `evt` prefix. Correlation IDs use the `cor` prefix (CTR-ID-001 registry).

## States & transitions

Not applicable. Event records are append-only (R08). Aggregate lifecycle states belong to each module's `workflow_state_machine`.

## Commands / queries / events

Each command that produces events declares `expected_revision` (or `expected_revision: null` for creation), `idempotency_key` and the emitted `event_type` list. Event subscribers receive envelopes in `(aggregate_id, revision)` order per aggregate. Cross-aggregate order is not guaranteed.

## Versioning and compatibility

- Envelope fields are versioned with this contract. Adding a required field = MAJOR. Adding an optional field = MINOR.
- Unknown top-level fields: preserved verbatim, never interpreted, included in signature input when present. Readers in the same MAJOR must not drop them when re-forwarding.
- Payload compatibility follows CTR-SCH-001 (independent of envelope version).
- Stored events keep the envelope version they were written with. Upcasting happens on read.

## Examples

Valid (local event, no signature):

```json
{
  "event_id": "evt_01HZX3K9Q7M2V8T4W6Y0B5N1CD",
  "event_type": "listing.published",
  "aggregate_type": "listing",
  "aggregate_id": "lst_01HZX3M0J4R8S2A6C9E3F5G7H1",
  "revision": 3,
  "actor_ref": {"kind": "user", "ref": "acc_01HZX3J7N2P5Q8R1S4T6V0W9ZB"},
  "occurred_at": "2026-11-16T09:12:04.317Z",
  "recorded_at": "2026-11-16T09:12:04.402Z",
  "provenance": {"origin_node": "nod_01HZX3K0M2N4P6Q8R0S2T4V6WB", "source_kind": "client_direct"},
  "correlation_id": "cor_01HZX3K2C5D7F9G1H3J5K7M9NB",
  "idempotency_key": "9f2c1d7e-4b8a-4e61-9c3d-a0b1c2d3e4f5",
  "schema_version": "1.0.0",
  "max_data_class": "LOCATION_COARSE",
  "payload": {"title": "Used road bike", "price": {"amount_minor": "15000", "currency": "EUR", "exponent": 2}, "region_cell": "DE-BE-C1"}
}
```

Invalid (violations listed below the block):

```json
{
  "event_id": "evt_01HZX3K9Q7M2V8T4W6Y0B5N1CD",
  "event_type": "listing.published",
  "aggregate_type": "listing",
  "aggregate_id": "acc_01HZX3M0J4R8S2A6C9E3F5G7H1",
  "revision": 0,
  "actor_ref": {"kind": "user", "ref": "jane.doe@example.com"},
  "occurred_at": "2026-11-16 09:12:04",
  "provenance": {"origin_node": "nod_01HZX3K0M2N4P6Q8R0S2T4V6WB", "source_kind": "client_direct"},
  "correlation_id": "cor_01HZX3K2C5D7F9G1H3J5K7M9NB",
  "schema_version": "1.0.0",
  "max_data_class": "SECRET",
  "payload": {"price": 150.00}
}
```

Violations: `aggregate_id` prefix `acc_` does not match `listing` (CTR-ID-001); `revision` 0 below minimum (R02); `actor_ref.ref` is an email address (R06); `occurred_at` not RFC3339 UTC with milliseconds (R04); `idempotency_key` missing (required); `max_data_class` = `SECRET` (R11); `payload.price` is a float (R12).

## Validation and errors

| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| EVT.ENVELOPE_INVALID | false | validation / 400 | Schema violation (fields, patterns, prefixes). |
| EVT.REVISION_CONFLICT | false | conflict / 409 | `expected_revision` mismatch. Client reloads, then issues a new command. |
| EVT.IDEMPOTENCY_KEY_REUSED | false | conflict / 409 | Same key, different request digest. |
| EVT.TIMESTAMP_OUT_OF_RANGE | false | validation / 400 | Violates R04. |
| EVT.SECRET_IN_PAYLOAD | false | validation / 400 | Payload contains SECRET-class data (R11). |
| EVT.SIGNATURE_REQUIRED | false | validation / 400 | Federated or exported event without signature. |
| EVT.REVISION_GAP | true | internal / 500 | Replication saw a gap. Replica holds and resyncs; never skips (R02). |
| SYS.PAYLOAD_TOO_LARGE | false | validation / 413 | Violates R12 size or depth. |

## Authorization

Producers are authorized per command (CTR-CAP-001). Event subscribers receive only envelope fields and payload fields their capabilities allow. Field filtering uses the field visibility policy in CTR-CAP-001. `actor_ref` disclosure follows R06.

## Failure, idempotency, concurrency, offline

- Commit is atomic per aggregate: revision check, event append, and hash chain update in one transaction.
- Offline clients submit with `source_kind = client_offline_replay` and their original `occurred_at`. The server acknowledges only after commit (D08). A replayed command with the same `idempotency_key` returns the original result (R03).
- Concurrent writers with the same `expected_revision`: exactly one commits.
- Replay of an acknowledged event is a no-op (duplicate detection by `event_id` and idempotency scope).

## Privacy, retention, abuse

- `max_data_class` drives disclosure and retention per CTR-PRV-001.
- Idempotency records: RET-OPS (30 days max; 7-day default, see CTR-PRV-001).
- Abuse: payload size and depth limits (R12) run before schema validation and before any cryptographic work.

## Observability and budgets

- Metrics: `evt_commit_latency_ms` p95 ≤ 150 ms for single-aggregate commit (ASSUMPTION); `evt_revision_conflicts_total`; `evt_rejections_total` by code.
- Audit: every committed event is recorded in CTR-EVT-001 streams; security-relevant event types also emit `aud_` records (CTR-CAP-001).
- Logs: envelope IDs, `event_type`, `revision`, `max_data_class`, codes. Never payload content.

## Tests

- TEST-CTR-EVT-001-01 (schema): positive and negative fixture set for every required field and pattern (valid example passes; invalid example fails on each listed violation).
- TEST-CTR-EVT-001-02 (concurrency): 50 parallel writers with the same `expected_revision`; exactly 1 commits, 49 receive `EVT.REVISION_CONFLICT`.
- TEST-CTR-EVT-001-03 (replication): gap injected at revision N; replica does not apply N+1; resync restores order.
- TEST-CTR-EVT-001-04 (idempotency): same key + same digest returns original `event_id`; same key + different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`.
- TEST-CTR-EVT-001-05 (canonicalization): RFC 8785 test vectors pass; signature verifies over the domain-prefixed JCS input; one-byte payload change fails verification.
- TEST-CTR-EVT-001-06 (time bounds): offline replay accepted within 7 days; 8-day-old and +6-minute-future `occurred_at` rejected.
- TEST-CTR-EVT-001-07 (lint): `SECRET` class cannot appear in any event schema or fixture (R11).
- TEST-CTR-EVT-001-08 (hash chain): redaction keeps chain verifiable; direct row deletion is detected.
- TEST-CTR-EVT-001-09 (limits): 64 KiB + 1 byte and depth-9 payloads rejected before schema validation.
- TEST-CTR-EVT-001-10 (export): federated export omits `idempotency_key`, re-keys `correlation_id`, pseudonymizes `actor_ref` (cross-check with CTR-FED-001 tests).

## Acceptance criteria

1. Envelope schema above validates the valid example and rejects every listed violation.
2. TEST-CTR-EVT-001-01 through -10 pass in CI.
3. Concurrent-writer test shows exactly one commit per revision.
4. No envelope field carries names, emails, IP addresses, device IDs or coordinates (static lint and fixture scan).
5. Hash-chain verification job passes on a seeded store with one redaction.

## Assumptions & open decisions

- ASSUMPTION: Ed25519 and RFC 8785 JCS are the canonical signing choices; to be confirmed by F16 cryptographic review (S3-04, S3-03).
- ASSUMPTION: the `cor` prefix added to CTR-ID-001 is accepted by F15 review (MINOR change to the registry).
- ASSUMPTION: 64 KiB payload limit and 7-day idempotency retention.
- PROVISIONAL (D01 default, unapproved): signed envelope with explicit federation fields.
- OPEN: whether `event_type` should be a separate registry entry rather than a string convention (CTR-SCH-001).
