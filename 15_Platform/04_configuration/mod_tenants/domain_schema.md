# PS-125-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-01.R01 | `tenant_id` matches `^ten_[0-9A-HJKMNP-TV-Z]{26}$`, is immutable and is never reused. ASSUMPTION: `ten_` prefix, to be registered in CTR-ID-001. | MVP |
| PS-125-01.R02 | `slug` is unique per node after NFKC and lowercase folding; 3–32 characters. | MVP |
| PS-125-01.R03 | No PRIVATE_PERSONAL field. Only `admin_ref` (`acc_`) links to a person. Record `max_data_class` = PSEUDONYMOUS. | MVP |
| PS-125-01.R04 | `config` ≤ 16 KiB, carries `schema_version` per CTR-SCH-001. | MVP |
| PS-125-01.R05 | A node holds ≤ 1,000 non-deleted tenants (ASSUMPTION, MVP sizing). | MVP |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| tenant_id | string | `^ten_[0-9A-HJKMNP-TV-Z]{26}$`, immutable | PUBLIC |
| slug | string | `^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$`, unique | PUBLIC |
| display_name | string | 1–80 chars, NFC, no control characters | PUBLIC |
| status | enum | `provisioning`, `active`, `suspended`, `offboarding`, `deleted` | PUBLIC |
| admin_ref | string | `^acc_`, must be an active account at write time | PSEUDONYMOUS |
| federation_mode | enum | `none` (default), `restricted`; D01 PROVISIONAL | PUBLIC |
| retention_profile | enum | `standard` (default), `extended`; D07 PROVISIONAL | PUBLIC |
| region_cells | array of string | 0–20 items, each in the registered cell set (CTR-PRV-001 R04) | LOCATION_COARSE |
| config | object | ≤ 16 KiB, keys from the allowlist in PS-125-02 | PSEUDONYMOUS (owner-visible) |
| revision | integer | ≥ 1, +1 per committed change | PUBLIC |
| created_by, updated_by | string | `acc_` or `sys_` | PSEUDONYMOUS |
| created_at, updated_at, deleted_at | string | RFC 3339 UTC, millisecond precision | PUBLIC |
| schema_version | string | `1.0.0` | PUBLIC |

Constraints: no hard delete. A `deleted` tenant keeps `tenant_id`, `status`, `deleted_at` and a tombstone marker; all other fields are removed after the retention window in PS-125-07. Provenance is `source_kind = local`.

## Commands / queries / events
Not applicable to the schema itself; see [PS-125-04](commands_queries_events.md).

## States & transitions
Lifecycle is defined in [PS-125-03](workflow_state_machine.md).

## Validation & errors
Field rules and codes are in [PS-125-02](validation_rules.md).

## Authorization
Field visibility is in [PS-125-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Unique slug is enforced by a database unique constraint, not by check-then-insert. Schema migrations follow CTR-SCH-001 MAJOR/MINOR rules.

## Privacy, retention, abuse
`admin_ref` is pseudonymous and is redacted in logs (PS-125-07). Region cells are coarse only; precise location is forbidden on this record (CTR-PRV-001 R03).

## Observability & budgets
Record size and count are reported as `tenant_records_total{status}`. Read budget defined in [PS-125-08](observability_performance.md).

## Tests
- TEST-PS-125-01-01 (unit): slug, ID and status values accept and reject per regex.
- TEST-PS-125-01-02 (property): NFKC folding maps visually equal slugs to one value and reports `TEN.SLUG_TAKEN`.
- TEST-PS-125-01-03 (contract): record validates against the CTR-SCH-001 1.0.0 schema.

## Acceptance criteria
1. Every field in the table has one class and one constraint.
2. No field stores precise location or free-text personal data.
3. Tombstone contains only `tenant_id`, `status`, `deleted_at` and marker.

## Assumptions & open decisions
- ASSUMPTION: `ten_` prefix and 1,000-tenant sizing.
- PROVISIONAL (D01 default, unapproved): `federation_mode` default `none`, opt-in only.
- PROVISIONAL (D07 default, unapproved): `retention_profile` `standard` default.
- PROVISIONAL (D05 default, unapproved): region cells are coarse public regions only.
