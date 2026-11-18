# PS-111-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-01. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F07, F10, F15, F16 shared contracts per [dependency matrix](../../../DEPENDENCY_MATRIX.md); release gate, notifications, evidence, moderation and observability per [01_a11y SPEC](../SPEC.md).

## Purpose and scope
**Business outcome:** release managers and accessibility reviewers can see, for each ClassRup surface and release, which WCAG 2.2 success criteria pass, fail, need manual review or carry an approved waiver. Release decisions are therefore explicit and auditable.

**Actors:** `release_bot` (service identity, automated results), `a11y_reviewer` (manual outcomes, waivers), `release_manager` (reads gate status, requests waivers), `operator` (profile configuration), `auditor` (read-only). Authorization is in [authorization_capabilities.md](authorization_capabilities.md).

**Exclusions:**
- Rendering UI or implementing keyboard and screen-reader behavior (owned by mod_keyboard and mod_screenreader; this module references their criteria by SC ID only).
- Collecting disability, health or demographic data about any user.
- Legal, certification or public conformance statements. Gate status is an internal release signal (A-wcag-09).
- Storing screenshots, recordings or other binary evidence. The evidence store owns binaries; this module keeps opaque references (A-wcag-14).
- Automated remediation, scanner adapters and public conformance pages (deferred, see Open decisions).

## Requirements
- PS-111-01.R01 — Outcome, actors and exclusions as stated above.
- PS-111-01.R02 — Five entities below are the complete persisted model for this module. Each field is defined with type, nullability, constraints, default and example.
- PS-111-01.R03 — Operational budgets: at most 100 criterion rows per catalog version; at most 20,000 findings per check run; at most 200 findings per batch; notes at most 500 characters; at most 20 ACTIVE waivers per surface.
- PS-111-01.R04 — `scope_key` and `surface_id` are unique per their rules. A surface belongs to exactly one profile scope.
- PS-111-01.R05 — Gate status is derived, never stored (rule in section Gate status).
- PS-111-01.R06 — This module owns the five entities and their lifecycle. Identity, consent, location and evidence binaries stay with their owners.

## Entities

### wcag_profile
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| profile_id | string(26) | no | ULID, primary key (A-wcag-02) | generated | `01J9Z3K8Q5V6W7X8Y9ZAB0CDEF` |
| scope_key | string(64) | no | regex `^[a-z][a-z0-9_.-]{2,63}$`; unique where status in (ACTIVE, DISABLED) | none | `pwa.core` |
| wcag_version | string(3) | no | enum: `2.2` only (A-wcag-01) | `2.2` | `2.2` |
| target_level | string(2) | no | enum: `A`, `AA`, `AAA` | `AA` | `AA` |
| status | string(10) | no | enum: `ACTIVE`, `DISABLED`, `RETIRED` | `ACTIVE` | `ACTIVE` |
| version | integer | no | >= 1; incremented on every change | 1 | 3 |
| updated_by_actor_id | string(26) | no | pseudonymous actor ULID | none | `01J9Z3M2A0B1C2D3E4F5G6H7J8` |
| created_at | timestamp | no | RFC 3339 UTC, millisecond precision | now | `2026-11-10T08:00:00.000Z` |
| updated_at | timestamp | no | RFC 3339 UTC; `>= created_at` | now | `2026-11-10T09:12:44.318Z` |

### wcag_criterion (read-only catalog)
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| sc_id | string(7) | no | regex `^[1-4]\.[1-4]\.[0-9]{1,2}$`; part of primary key | none | `1.4.3` |
| catalog_version | string(8) | no | semver of the catalog, part of primary key | `2.2.0` | `2.2.0` |
| title_key | string(64) | no | localization key `wcag.sc.<sc_id with underscores>.title` | none | `wcag.sc.1_4_3.title` |
| level | string(3) | no | enum: `A`, `AA`, `AAA` | none | `AA` |
| principle | string(12) | no | enum: `perceivable`, `operable`, `understandable`, `robust` | none | `perceivable` |
| manual_only | boolean | no | see A-wcag-12 | `false` | `true` |

The catalog is seeded from the W3C WCAG 2.2 criterion list. It is not editable through any command.

### wcag_check_run
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| check_run_id | string(26) | no | ULID, primary key | generated | `01J9Z4R7T8U9V0W1X2Y3Z4A5B6` |
| scope_key | string(64) | no | must reference an existing wcag_profile | none | `pwa.core` |
| surface_id | string(64) | no | regex `^surf\.[a-z0-9_]+\.[a-z0-9_]+$`; must exist in surface catalog (A-wcag-03) | none | `surf.f01.listing_detail` |
| release_ref | string(64) | no | regex `^[0-9a-f]{7,40}$` or `^build-[0-9]{4,12}$` | none | `4f2c9a1` |
| method | string(10) | no | enum: `AUTOMATED`, `MANUAL`, `MIXED` | none | `MIXED` |
| tool_name | string(64) | yes | required when method is AUTOMATED or MIXED; null otherwise | null | `example-scanner` |
| tool_version | string(32) | yes | required with tool_name | null | `2.14.0` |
| status | string(10) | no | enum: `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` | `QUEUED` | `RUNNING` |
| attempt | integer | no | 1..3 | 1 | 1 |
| criteria_total | integer | no | equals count of criteria required by the profile target level at catalog version | computed at start | 50 |
| pass_count, fail_count, needs_review_count, not_applicable_count | integer | no | each >= 0; sum <= criteria_total | 0 | 41 |
| started_at, finished_at | timestamp | yes | finished_at null until terminal state | null | `2026-11-10T09:20:01.004Z` |

### wcag_finding
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| finding_id | string(26) | no | ULID, primary key | generated | `01J9Z5B1C2D3E4F5G6H7J8K9M0` |
| check_run_id | string(26) | no | foreign key to wcag_check_run | none | `01J9Z4R7T8U9V0W1X2Y3Z4A5B6` |
| surface_id | string(64) | no | copied from run; immutable | none | `surf.f01.listing_detail` |
| sc_id | string(7) | no | must exist in catalog version of the run | none | `1.4.3` |
| outcome | string(14) | no | enum: `PASS`, `FAIL`, `NEEDS_REVIEW`, `NOT_APPLICABLE` | none | `FAIL` |
| review_state | string(12) | no | enum: `UNREVIEWED`, `CONFIRMED`, `OVERRIDDEN` | `UNREVIEWED` for automated, `CONFIRMED` for manual | `CONFIRMED` |
| reviewer_actor_id | string(26) | yes | required when review_state is CONFIRMED or OVERRIDDEN | null | `01J9Z3M2A0B1C2D3E4F5G6H7J8` |
| evidence_ref | string(80) | yes | regex `^evidence:[a-z0-9_-]{8,64}$`; opaque reference | null | `evidence:shot-0a91c3e2` |
| note | string(500) | yes | plain text, no markup, PII checks per [validation_rules.md](validation_rules.md) | null | `Contrast 3.9:1 on badge text` |
| revision | integer | no | >= 1; incremented on confirm or override | 1 | 2 |

Uniqueness: one finding per (`check_run_id`, `sc_id`). Automated and manual results for the same criterion in one run are merged by the rule in [workflow_state_machine.md](workflow_state_machine.md).

### wcag_waiver
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| waiver_id | string(26) | no | ULID, primary key | generated | `01J9Z6D4E5F6G7H8J9K0M1N2P3` |
| surface_id | string(64) | no | must exist in surface catalog | none | `surf.f01.listing_detail` |
| sc_id | string(7) | no | must exist in catalog | none | `1.4.3` |
| reason_code | string(32) | no | enum: `KNOWN_DEFECT_TRACKED`, `THIRD_PARTY_CONTROL`, `PLANNED_REMEDIATION`, `NOT_APPLICABLE_CONTEXT` | none | `PLANNED_REMEDIATION` |
| requested_by_actor_id | string(26) | no | pseudonymous ULID | none | `01J9Z3M2A0B1C2D3E4F5G6H7J8` |
| approved_by_actor_id | string(26) | no | must differ from requested_by_actor_id (A-wcag-08) | none | `01J9Z3N5P6Q7R8S9T0U1V2W3X4` |
| status | string(8) | no | enum: `ACTIVE`, `EXPIRED`, `REVOKED` | `ACTIVE` | `ACTIVE` |
| expires_at | timestamp | no | > created_at and <= created_at + 90 days | none | `2027-01-31T00:00:00.000Z` |
| note | string(500) | yes | plain text | null | `Tracked in defect tracker, fix scheduled` |
| created_at, revoked_at | timestamp | no / yes | revoked_at set only when status is REVOKED | now / null | `2026-11-10T10:00:00.000Z` |

## Relationships
- `wcag_profile` 1:N `wcag_check_run` through `scope_key`.
- `wcag_check_run` 1:N `wcag_finding`.
- `wcag_criterion` is referenced by `sc_id` from findings and waivers, pinned to one `catalog_version` per check run.
- `wcag_waiver` applies to (`surface_id`, `sc_id`) across all later runs until it expires or is revoked.

## Gate status (derived, not stored)
For a `surface_id` and `release_ref`, read the most recent check run with status COMPLETED. Let `required` be all criteria with level at or below the profile `target_level`.
- `PASS`: every required criterion has outcome PASS or NOT_APPLICABLE, or an ACTIVE waiver, and no run is in progress.
- `FAIL`: at least one required criterion has outcome FAIL with no ACTIVE waiver.
- `INCOMPLETE`: no COMPLETED run exists, a run is QUEUED or RUNNING, a required criterion is missing, or a required criterion is NEEDS_REVIEW with review_state UNREVIEWED.

Waivers never change a finding row. They only change the derived gate.

## Open decisions
- A-wcag-01: WCAG reference is 2.2 only (W3C Recommendation, October 2023). WCAG 2.1 is not supported in MVP. Upgrade path is a new catalog version.
- A-wcag-02: Identifiers are ULIDs (26 characters, Crockford base32) until CTR-ID-001 chooses the format.
- A-wcag-03: `surface_id` values are validated against a surface catalog published by F15 configuration. No such contract exists in [planning/CONTRACTS.md](../../../planning/CONTRACTS.md) yet; see the report to the lead.
- A-wcag-09: Gate status is an internal release signal. No public conformance claim is made or generated in MVP.
- A-wcag-14: Evidence binaries are stored by an evidence store outside this module. This module keeps `evidence:` references only.

## Testing expectations
- Schema tests in `TEST-PS-111-01-T01` to `TEST-PS-111-01-T04` (see [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md)).

## Acceptance criteria
- Every field in the five tables has type, nullability, constraint and example.
- Gate status derivation is reproducible from stored rows alone.
- Every open choice is an A-wcag assumption listed above.
