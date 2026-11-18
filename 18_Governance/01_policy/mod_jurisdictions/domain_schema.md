# PS-145-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-145-01. **Owner:** [18_Governance/01_policy/mod_jurisdictions](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_jurisdictions. **Consumers:** mod_prohibited, mod_goods, 01_LocalBazaar/01_listings/mod_publish, 06_Discovery, 11_Federation, 12_Moderation (see A-jurisdictions-17).

## Purpose and scope
Define the schema for the jurisdiction register: a versioned record of governance scopes (country or country subdivision), the coarse regions each scope covers, and references to the rule sets that apply there. Other modules ask this register which scopes apply to a coarse region at a given time. Do not assume implementation or successful external settlement.

## Requirements to specify
- PS-145-01.R01: Business outcome: operators can register, review, activate, supersede and retire jurisdiction profiles, and every other module can resolve "which scopes apply to this coarse region at time t" with a reproducible answer. Actors: policy_drafter, policy_approver, policy_owner, governance_auditor, platform_scheduler, consuming services. Exclusions: no legal determination of lawfulness; no rule content (owned by mod_prohibited and mod_goods); no verification of a user's residence, nationality or identity; no IP or device geolocation; no tax, FX, payment, escrow or custody; no exact home address, coordinates or postal code anywhere in this schema.
- PS-145-01.R02: Cases covered by the schema: normal (create, approve, activate, supersede, retire); invalid (unknown scope code, subdivision without parent, window in the past); expired (pending review older than 14 days, see workflow); duplicate (same scope_code twice, replayed command key); concurrent (two drafts for one jurisdiction, approval racing withdrawal); offline (no offline writes; clients queue nothing for this module, per D08); adversarial (precise-location fields injected, self-approval, oversized region list, personal data in internal_note).
- PS-145-01.R03: Localization and accessibility: user-visible names are stored only as `name_key` into the i18n catalog, never as free text. Clients render the localized string and fall back to the English catalog entry. Operator console forms meet WCAG 2.2 AA. Size budget: one serialized revision at most 8 KB.
- PS-145-01.R04: Cardinality: one `jurisdiction` per `scope_code`; at most one open revision (state DRAFT, PENDING_REVIEW or APPROVED) per jurisdiction; at most one ACTIVE revision per jurisdiction at any instant; RETIRED is terminal.
- PS-145-01.R05: Immutability: once a revision leaves DRAFT, its content fields (`name_key`, `region_codes`, ruleset refs, `effective_from`, `change_reason_code`, `internal_note`) never change. Corrections are new revisions. Only state, timestamps, `row_version` and approver fields change after submission.
- PS-145-01.R06: Location precision: `region_codes` accept only coarse catalog codes (Assumption A-jurisdictions-03). No schema field may hold coordinates, postal codes, street addresses or per-user location. User identifiers appear only as pseudonymous actor references from F07.
- PS-145-01.R07: Ownership and provenance: this module owns `jurisdiction`, `jurisdiction_revision`, `idempotency_record` and `governance_event`. Ruleset references are foreign references owned by mod_prohibited or mod_goods. Actor references are owned by F07. Retention class is `GOV-RECORD` (see privacy file).

## Entity: jurisdiction (identity)
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| jurisdiction_id | string (ULID) | no | 26 chars, Crockford base32, immutable, unique | generated | `01J9ZK3Q8V2M7R4T6W1X5Y0B9C` |
| scope_code | string | no | unique; `^[A-Z]{2}(-[A-Z0-9]{1,3})?$`; max 6 chars | none | `DE`, `US-CA` |
| level | enum `COUNTRY`, `SUBDIVISION` | no | derived from scope_code (no hyphen means COUNTRY) | derived | `SUBDIVISION` |
| parent_scope_code | string | yes | required iff level = SUBDIVISION; must name an existing COUNTRY profile | null | `US` |
| current_revision_no | integer | no | >= 0 | 0 | `3` |
| retired_at | timestamp (UTC) | yes | set once, when the RETIREMENT revision reaches RETIRED | null | `null` |
| row_version | integer | no | >= 1; incremented on every write; optimistic lock | 1 | `4` |
| created_at | timestamp (UTC) | no | RFC 3339, millisecond precision, `Z` suffix | server time | `2026-11-10T08:00:00.000Z` |

## Entity: jurisdiction_revision (versioned rule binding)
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| revision_id | string (ULID) | no | unique | generated | `01J9ZK4A1N7X3C5E8G2H6J0K4M` |
| jurisdiction_id | string (ULID) | no | foreign key to jurisdiction | none | `01J9ZK3Q8V2M7R4T6W1X5Y0B9C` |
| revision_no | integer | no | >= 1; unique per jurisdiction_id; gap-free | none | `3` |
| state | enum | no | DRAFT, PENDING_REVIEW, REJECTED, WITHDRAWN, APPROVED, ACTIVE, SUPERSEDED, RETIRED | DRAFT | `ACTIVE` |
| name_key | string | no | `^jur\.[a-z0-9_]+(\.[a-z0-9_]+){1,3}$`; max 80 chars | none | `jur.us_ca.name` |
| region_codes | array of string | no | 1 to 50 items, unique, each a coarse catalog code; may be empty only when change_reason_code = RETIREMENT | none | `["US-CA"]` |
| prohibited_ruleset_ref | string | yes | `^rs_[A-Z0-9]{26}$`; owned by mod_prohibited | null | `rs_01J9ZK5B2P8Q4R6S0T3V7W9X1Y` |
| goods_ruleset_ref | string | yes | `^rs_[A-Z0-9]{26}$`; owned by mod_goods | null | `null` |
| effective_from | timestamp (UTC) | no | whole minute (seconds and milliseconds zero); see workflow lead-time guard | none | `2026-11-12T00:00:00.000Z` |
| effective_until | timestamp (UTC) | yes | system-set at supersession only; clients may not supply it in v1 | null | `null` |
| change_reason_code | enum | no | NEW_JURISDICTION, RULESET_UPDATE, REGION_CHANGE, SCOPE_CORRECTION, LEGAL_CHANGE_REPORTED, RETIREMENT, EMERGENCY_CORRECTION | none | `RULESET_UPDATE` |
| internal_note | string | yes | operator-only; max 280 chars; personal-data pattern scan (A-jurisdictions-05) | null | `Region list narrowed after catalog review.` |
| created_by_actor_ref | string (ULID) | no | pseudonymous F07 actor reference | none | `01J9ZJ8R0T2V4W6X8Y0Z2A4B6C` |
| submitted_by_actor_ref | string (ULID) | yes | set on submit; immutable afterwards | null | `01J9ZJ8R0T2V4W6X8Y0Z2A4B6C` |
| approved_by_actor_ref | string (ULID) | yes | set on approve; must differ from submitted_by_actor_ref | null | `01J9ZJ9D5F7G9H1J3K5L7M9N1P` |
| approved_at | timestamp (UTC) | yes | set on approve | null | `2026-11-10T09:30:00.000Z` |
| schema_version | string (semver) | no | fixed to the module schema version | `1.0.0` | `1.0.0` |
| row_version | integer | no | >= 1 | 1 | `2` |
| created_at, updated_at | timestamp (UTC) | no | RFC 3339 | server time | `2026-11-10T08:00:00.000Z` |

Database constraints: unique (jurisdiction_id, revision_no); partial unique index allowing at most one revision per jurisdiction_id with state in (DRAFT, PENDING_REVIEW, APPROVED); check that `parent_scope_code` is null when level = COUNTRY.

## Entity: idempotency_record and governance_event
| Entity | Field | Type | Null | Constraint / note |
|---|---|---|---|---|
| idempotency_record | idempotency_key | string (UUID v4, lowercase) | no | unique with actor_ref and command_name |
| idempotency_record | command_name | string | no | e.g. `jurisdiction.submit_revision` |
| idempotency_record | actor_ref | string (ULID) | no | caller pseudonymous reference |
| idempotency_record | payload_hash | string (hex SHA-256) | no | hash of canonical JSON request body |
| idempotency_record | result_ref | string | yes | revision_id or jurisdiction_id produced |
| idempotency_record | response_status | integer | no | HTTP-style status returned on first execution |
| idempotency_record | expires_at | timestamp (UTC) | no | created_at + 72 h (A-jurisdictions-11) |
| governance_event | event_id | string (ULID) | no | unique; deduplication key for consumers |
| governance_event | event_type | string | no | e.g. `jurisdiction.revision_approved` |
| governance_event | aggregate_id | string (ULID) | no | jurisdiction_id |
| governance_event | aggregate_revision | integer | no | revision_no of the affected revision |
| governance_event | actor_ref | string | no | pseudonymous ULID, or `SYSTEM` for the scheduler |
| governance_event | occurred_at | timestamp (UTC) | no | server clock |
| governance_event | correlation_id | string (UUID v4) | no | propagated from caller |
| governance_event | provenance | enum | no | LOCAL_OPERATOR, SCHEDULER, IMPORT |
| governance_event | schema_version | string (semver) | no | matches envelope version in CTR-EVT-001 |
| governance_event | signature | string | yes | required only for federated publication (CTR-FED-001); null in v1 |
| governance_event | payload | object | no | event-specific; never contains internal_note in any copy leaving the module |

## Example: revision as stored (operator view)
```json
{
  "revision_id": "01J9ZK4A1N7X3C5E8G2H6J0K4M",
  "jurisdiction_id": "01J9ZK3Q8V2M7R4T6W1X5Y0B9C",
  "revision_no": 3,
  "state": "APPROVED",
  "name_key": "jur.us_ca.name",
  "region_codes": ["US-CA"],
  "prohibited_ruleset_ref": "rs_01J9ZK5B2P8Q4R6S0T3V7W9X1Y",
  "goods_ruleset_ref": null,
  "effective_from": "2026-11-12T00:00:00.000Z",
  "effective_until": null,
  "change_reason_code": "RULESET_UPDATE",
  "internal_note": "Region list narrowed after catalog review.",
  "submitted_by_actor_ref": "01J9ZJ8R0T2V4W6X8Y0Z2A4B6C",
  "approved_by_actor_ref": "01J9ZJ9D5F7G9H1J3K5L7M9N1P",
  "schema_version": "1.0.0",
  "row_version": 4
}
```

## Dependencies and predecessor specifications
Parent [module SPEC](SPEC.md), [project trust model](../../../PROJECT_SPEC.md), [contract placeholders](../../../planning/CONTRACTS.md). Canonical contracts referenced, not duplicated: CTR-ID-001 (identifiers), CTR-EVT-001 (event envelope), CTR-ERR-001 (typed errors), CTR-CAP-001 (capabilities), CTR-SCH-001 (schema versions), CTR-PRV-001 (location, retention and disclosure classes), CTR-FED-001 (federated envelope, out of scope in v1). Shared identity F07, privacy F10, platform F15, security F16.

## Open decisions
- A-jurisdictions-01: `scope_code` uses ISO 3166-1 alpha-2 and ISO 3166-2 subdivision codes; hierarchy depth limited to two levels (country, subdivision). Alternative: custom codes. Owner: F18 with F10 review.
- A-jurisdictions-02: Entity identifiers are 26-character ULIDs; idempotency keys are UUID v4. Pending CTR-ID-001 (OPEN).
- A-jurisdictions-03: Launch coarse region catalog equals the ISO scope-code space, so `region_codes` values are scope codes. F10 may replace the catalog through a catalog version change without altering this schema's shape.
- Cross-reference: A-jurisdictions-05 (internal_note scan) is defined in validation_rules.md; A-jurisdictions-17 (consumers) in commands_queries_events.md; D05 and D07 in [DECISIONS.md](../../../DECISIONS.md) remain OPEN.

## Acceptance criteria
- [ ] Every field in the tables above has a type, nullability, constraint, default and example.
- [ ] Field set contains no coordinates, postal codes, street addresses or per-user location fields (checked by contract test TEST-PS-145-01-T04).
- [ ] Security and architecture review approval (future gate).
