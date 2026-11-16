# CTR-SCH-001 — Schema registry, compatibility and migration

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F15 Platform (named owner UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-SCH-001 (this file). **Depends on:** CTR-ID-001, CTR-EVT-001, CTR-PRV-001. **Consumed by:** every payload schema, CTR-FED-001 (version negotiation), CTR-COM-001, all offline clients (D08).

**Decision label:** Compatibility windows and the registry format are PROVISIONAL (ASSUMPTION, unapproved).

## Scope

Owns the registry of payload and record schemas, the semantic versioning rules, compatibility classification, deprecation, and migration hooks. Does not define envelope fields (CTR-EVT-001) or data classes (CTR-PRV-001); it references them.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-SCH-001.R01 | Every payload and persisted record type has exactly one registry entry: `schema_id` (dotted lowercase, equals `event_type` for events), `schema_version` (SemVer `MAJOR.MINOR.PATCH`), format `json-schema-2020-12`, owner module, and data-class annotations per field. | MVP |
| CTR-SCH-001.R02 | Each version's canonical JSON Schema is stored with a SHA-256 digest. Published versions are immutable. Fixes produce a new PATCH. | MVP |
| CTR-SCH-001.R03 | Change classification per the table below. CI runs a compatibility checker against the previous published version and blocks merges with unversioned breaking changes (`SCH.BREAKING_UNVERSIONED`). | MVP |
| CTR-SCH-001.R04 | Enums are declared `open` or `closed` in the registry. Adding a value to an open enum is MINOR. Adding a value to a closed enum is MAJOR. Consumers must accept unknown values of open enums as opaque strings. | MVP |
| CTR-SCH-001.R05 | Readers accept any MINOR or PATCH newer than they know within the same MAJOR, ignoring unknown optional fields (preserved for signed payloads, CTR-EVT-001 R05). | MVP |
| CTR-SCH-001.R06 | Unknown MAJOR → reject with `SCH.UNKNOWN_VERSION`. Offline queued commands with unknown MAJOR remain pending and are marked "client upgrade required"; they are never discarded (D08). | MVP |
| CTR-SCH-001.R07 | Migration hooks (see Data) are pure, deterministic and idempotent. Upcast runs on read. Stored bytes are never rewritten. | MVP |
| CTR-SCH-001.R08 | Lossy migrations are forbidden for signed evidence (CTR-COM-001 claims, CTR-FED-001 envelopes). For those records the original bytes are retained and a lossless view is produced. | MVP |
| CTR-SCH-001.R09 | Every supported `from` version has golden fixtures for each migration path. | MVP |
| CTR-SCH-001.R10 | Any change to a field's data class is at least MINOR and requires F10 review. Downgrades (sensitive → less sensitive) are MAJOR. Upgrades to a more sensitive class are MAJOR. | MVP |

## Data / schema

Registry entry (one per `schema_id` and version):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-SCH-001:registry-entry:1.0.0",
  "type": "object",
  "required": ["schema_id","schema_version","status","format","owner","open_enums","data_classes","sha256","supported_until"],
  "properties": {
    "schema_id": {"type": "string", "pattern": "^[a-z][a-z_]{1,31}(\\.[a-z][a-z_]{1,31})?$"},
    "schema_version": {"type": "string", "pattern": "^(0|[1-9]\\d{0,3})\\.(0|[1-9]\\d{0,4})\\.(0|[1-9]\\d{0,5})$"},
    "status": {"enum": ["draft","active","deprecated","retired"]},
    "format": {"const": "json-schema-2020-12"},
    "owner": {"type": "string", "pattern": "^F(0[1-9]|1[0-8])$"},
    "open_enums": {"type": "array", "items": {"type": "string"}},
    "data_classes": {"type": "object", "additionalProperties": {"enum": ["PUBLIC","PSEUDONYMOUS","LOCATION_COARSE","PRIVATE_PERSONAL","FINANCIAL_EVIDENCE","LOCATION_PRECISE","SECRET"]}},
    "sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
    "supported_until": {"type": ["string","null"], "format": "date"},
    "deprecated_at": {"type": ["string","null"], "format": "date-time"},
    "federated": {"type": "boolean"},
    "signed": {"type": "boolean"}
  }
}
```

`data_classes` must not contain `SECRET` for any event or federated schema (CTR-EVT-001 R11). Enforced by lint.

**Change classification:**

| Change | Class |
|---|---|
| Add optional field with defined default | MINOR |
| Add required field | MAJOR |
| Remove or rename field | MAJOR |
| Change type or format | MAJOR |
| Tighten constraint (narrower pattern, lower max) | MAJOR |
| Relax constraint | MINOR |
| Add value to open enum | MINOR |
| Add value to closed enum | MAJOR |
| Change default that alters meaning | MAJOR |
| Data class raised or lowered | MAJOR (plus F10 review) |
| Description or example only | PATCH |

**Migration hook interface:**

```json
{
  "schema_id": "listing.published",
  "from": "1.x",
  "to": "2.0.0",
  "kind": "upcast",
  "pure": true,
  "deterministic": true,
  "idempotent": true,
  "lossless": true,
  "fixtures": ["fixtures/listing.published/1.2.0-to-2.0.0/*.json"]
}
```

`kind` is `upcast` (read path) or `projection` (write-side view for a peer still on an older supported major). A projection must be declared lossy or lossless. Lossy projections are never used for signed records (R08).

## States & transitions

Registry entry status: `draft` → `active` (on publish) → `deprecated` (on `schema.deprecate`) → `retired` (after `supported_until`). `retired` is terminal. Reads of retired versions return `SCH.RETIRED`.

## Commands / queries / events

Registry operations (F15 internal, not client-facing):

| Operation | Effect |
|---|---|
| `schema.publish` | Adds version as `active`. Requires compatibility check pass. |
| `schema.deprecate` | Sets `deprecated_at` and `supported_until`. Emits `schema.deprecated`. |
| `schema.retire` | Sets `retired`. Only after `supported_until` and federation peer notice (CTR-FED-001). |

Events: `schema.published`, `schema.deprecated`, `schema.retired` (CTR-EVT-001 envelope; `aggregate_type = schema`; registry IDs are dotted `schema_id` strings, not CTR-ID-001 entity IDs. ASSUMPTION).

## Versioning and compatibility

- Supported window: a MAJOR version is supported for at least 90 days after the next MAJOR is published for local-only schemas, and at least 365 days for federated or signed schemas (ASSUMPTION).
- Compatibility mode: local schemas BACKWARD; federated and signed schemas FULL within a MAJOR (ASSUMPTION).
- Consumers are tested against every supported producer version (consumer-driven contract tests; TD-03).
- Deprecation: `deprecated` status keeps readers working; producers must not write deprecated MAJOR versions after `deprecated_at` + 30 days (ASSUMPTION).

## Examples

Valid registry entry:

```json
{
  "schema_id": "listing.published",
  "schema_version": "1.2.0",
  "status": "active",
  "format": "json-schema-2020-12",
  "owner": "F01",
  "open_enums": ["listing_kind"],
  "data_classes": {"title": "PUBLIC", "price": "FINANCIAL_EVIDENCE", "region_cell": "LOCATION_COARSE"},
  "sha256": "9b1f0c2e7d4a6b8c0e2f4a6b8d0c2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a1b2c3d",
  "supported_until": "2027-11-16",
  "deprecated_at": null,
  "federated": true,
  "signed": true
}
```

Invalid (violations: `schema_id` uses uppercase; `owner` not a module ID; `sha256` is not 64 hex; `data_classes` contains `SECRET`; `format` not allowed):

```json
{
  "schema_id": "Listing.Published",
  "schema_version": "1.2",
  "status": "active",
  "format": "xml",
  "owner": "listing team",
  "open_enums": [],
  "data_classes": {"api_key": "SECRET"},
  "sha256": "not-a-digest",
  "supported_until": null,
  "federated": true,
  "signed": true
}
```

Violations: `schema_id` (R01); `schema_version` not SemVer (R01); `format` (R01); `owner` not `F01`–`F18` (R01); `data_classes.api_key = SECRET` (CTR-EVT-001 R11); `sha256` (R02).

## Validation and errors

| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| SCH.UNKNOWN_VERSION | false | validation / 400 | Reader has no MAJOR for the record. Federation maps this to `FED.VERSION_UNSUPPORTED`. |
| SCH.INVALID_DEFINITION | false | validation / 400 | Registry entry fails schema or lint. |
| SCH.BREAKING_UNVERSIONED | false | unprocessable_state / 422 | CI: breaking change without MAJOR bump. |
| SCH.MIGRATION_FAILED | false | internal / 500 | Migration threw or produced invalid output. Record quarantined, original bytes kept. |
| SCH.DATA_CLASS_CHANGE_REQUIRES_REVIEW | false | unprocessable_state / 422 | Data class change without F10 approval record. |
| SCH.RETIRED | false | gone / 410 | Retired version requested. |

## Authorization

Registry publish, deprecate and retire require `sys` principal with the F15 release role and an `ope` approval for retire (CTR-CAP-001). Read access to the registry is public.

## Failure, idempotency, concurrency, offline

- Publishing is idempotent by (`schema_id`, `schema_version`, `sha256`). Re-publishing the same digest is a no-op; a different digest for the same version is rejected.
- Migration failures do not block other records. The failing record is quarantined and an alert is raised (BT-01).
- Offline clients store the schema versions they support. A pending command whose version is unsupported stays pending (R06) and is revalidated after upgrade.

## Privacy, retention, abuse

- The registry holds no personal data. Data class annotations are metadata.
- Migration fixtures must use synthetic data only. Real records may not be used as fixtures.
- Registry retention: all versions kept indefinitely (retired versions retained for audit, RET-AUD for change records).

## Observability and budgets

- Metrics: `schema_unknown_version_total{schema_id}`, `schema_migration_failures_total`, `schema_consumer_contract_failures_total`.
- Alert on any unknown-version rejection for federated peers (CTR-FED-001 trust signal).
- Budget: upcast ≤ 1 ms p95 per record (ASSUMPTION).

## Tests

- TEST-CTR-SCH-001-01 (lint): registry entries validate against the registry-entry schema; `SECRET` absent from event and federated schemas.
- TEST-CTR-SCH-001-02 (compatibility checker): each change-classification row produces the stated class; unversioned breaking change fails CI (R03).
- TEST-CTR-SCH-001-03 (open/closed enum): unknown open-enum value accepted as opaque; unknown closed-enum value rejected.
- TEST-CTR-SCH-001-04 (forward read): v1.1 reader reads v1.2 record; unknown optional field preserved in signed payload round trip.
- TEST-CTR-SCH-001-05 (unknown MAJOR): local rejection with `SCH.UNKNOWN_VERSION`; federated mapping to `FED.VERSION_UNSUPPORTED`; offline pending command stays pending.
- TEST-CTR-SCH-001-06 (migration golden): every fixture path upcasts to expected output; applying twice yields identical output (idempotent).
- TEST-CTR-SCH-001-07 (migration failure): forced exception quarantines record and keeps original bytes.
- TEST-CTR-SCH-001-08 (lossy guard): lossy projection on signed record is rejected at build time.
- TEST-CTR-SCH-001-09 (immutability): publishing a changed body under an existing version is rejected by digest mismatch.
- TEST-CTR-SCH-001-10 (consumer-driven): each consumer's contract tests run against all supported producer versions.

## Acceptance criteria

1. Every payload schema in the registry has an entry with owner, data classes and digest.
2. CI compatibility checker enforces R03 on every merge touching schemas.
3. TEST-CTR-SCH-001-01 through -10 pass in CI.
4. No lossy migration exists for any signed or federated schema.

## Assumptions & open decisions

- ASSUMPTION: 90-day local and 365-day federated support windows.
- ASSUMPTION: FULL compatibility within MAJOR for federated and signed schemas.
- ASSUMPTION: `schema.*` events use dotted `schema_id` strings for the aggregate, not CTR-ID-001 IDs.
- OPEN: whether `event_type` should be a separate registry entry (CTR-EVT-001 open item). Default: registry-owned, lint-checked.
- OPEN: registry storage location and publication format (F15).
