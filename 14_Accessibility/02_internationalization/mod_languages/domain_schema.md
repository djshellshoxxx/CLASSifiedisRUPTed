# PS-113-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-01. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Defines the persisted records of the languages capability: a platform-maintained catalog of supported language tags, one current language preference per participant, and an append-only history of preference revisions. Canonical contract IDs are referenced from [CONTRACTS.md](../../../planning/CONTRACTS.md); this file does not duplicate them.

## Requirements to specify
- [x] PS-113-01.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-01.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-01.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-01.R04: Field-level schema for `language_catalog_entry`, `language_preference` and `language_preference_revision`, with types, nullability, constraints, defaults and examples (sections below).
- [x] PS-113-01.R05: Global invariants that every persisted state must satisfy.
- [x] PS-113-01.R06: Text-direction rule derived from script subtag.

## Business outcome and exclusions
**Outcome:** A participant selects an ordered list of up to five supported languages. The list selects interface text and decides which declared content language is shown first. Operators add, deprecate and retire supported languages through the catalog without a client release.

**Actors:** participant (pseudonymous, owns own preference), operator (manages catalog), system (applies defaults and retention), auditor (reads revision history under capability).

**Exclusions (not owned here):**
- Translation of user-generated content (listing text, messages, proposals). Owned by content modules; this module only validates the language tag a content owner declares.
- Machine translation, translation memory and translator workflow.
- Infer language from location, IP address, device fingerprint, name or payment data. Device locale may be shown as a suggestion only (A-languages-15).
- Storage of nationality, ethnicity or residence. A language list is a display preference, not an identity attribute.
- Certified or legal translation of contracts, receipts or evidence.
- Currency, FX and number formats (sibling module mod_currencies).
- Text bundles for UI strings (A-languages-10).

## Canonical references
- Identifiers: CTR-ID-001 (format OPEN, see A-languages-01).
- Event envelope: CTR-EVT-001. Schema versioning: CTR-SCH-001. Typed errors: CTR-ERR-001.
- Capabilities: CTR-CAP-001 (see [authorization_capabilities.md](authorization_capabilities.md)).
- Location, retention and disclosure classes: CTR-PRV-001 (see [privacy_retention_abuse.md](privacy_retention_abuse.md)).
- Participant identity: opaque `participant_id` issued by F07. This module never stores a legal name, email or address.

## Entity: language_catalog_entry
Operator-managed. One row per supported language tag. Public read.

| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| entry_id | string(26) | no | primary key, ULID-shaped, immutable | generated | `01J8ZQ3V6Y0F9K2M4N5P7R8S9T` |
| language_tag | string(2..35) | no | canonical BCP 47 (see validation_rules V-01); unique among rows with status != retired | none | `pt-BR` |
| primary_subtag | string(2..3) | no | lowercase ISO 639 code derived from tag | derived | `pt` |
| script_subtag | string(4) | yes | ISO 15924, Title case | null | `Latn` |
| region_subtag | string(2) or string(3) digits | yes | ISO 3166-1 alpha-2 uppercase, or UN M.49 digits | null | `BR` |
| native_name | string(1..80) | no | NFC; no control characters; trimmed; no HTML | none | `Português (Brasil)` |
| text_direction | enum `ltr` / `rtl` | no | must equal direction table value for script (R06) | derived, else `ltr` | `ltr` |
| status | enum `draft` / `active` / `deprecated` / `retired` | no | transitions in [workflow_state_machine.md](workflow_state_machine.md) | `draft` | `active` |
| is_platform_default | boolean | no | exactly one row true; that row is `en` (A-languages-03) | false | `true` (for `en` only) |
| fallback_tag | string(2..35) | yes | references another row's language_tag with status active or deprecated; no cycles; chain depth <= 3 | null (resolves to `en`) | `pt` |
| ui_coverage_pct | integer 0..100 | no | share of UI message keys with approved translation | 0 | `87` |
| deprecated_at | timestamp UTC | yes | set on entry to `deprecated`; cleared on return to `active` | null | `2026-11-01T00:00:00.000Z` |
| retired_at | timestamp UTC | yes | set only when status is `retired`; immutable after set | null | null |
| revision | integer >= 1 | no | optimistic concurrency token; +1 per accepted write | 1 | `4` |
| schema_version | integer | no | equals 1 for this spec | 1 | `1` |
| created_at | timestamp UTC | no | RFC 3339, millisecond precision | now | `2026-11-10T09:14:02.118Z` |
| updated_at | timestamp UTC | no | >= created_at | now | `2026-11-10T09:14:02.118Z` |
| created_by_ref | string(1..64) | no | opaque operator principal from F07; no display name | none | `op_7H2KQ9TR4X` |

## Entity: language_preference
Current state, one row per participant. Participant-owned write path only.

| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| preference_id | string(26) | no | primary key, ULID-shaped | generated | `01J8ZR0A1B2C3D4E5F6G7H8J9K` |
| participant_id | string(1..64) | no | unique; opaque F07 pseudonymous id | none | `pid_a1b2c3d4e5f6` |
| status | enum `active` / `withdrawn` | no | `withdrawn` means participant cleared the list | `active` | `active` |
| ordered_language_tags | array of language_tag | no | length 1..5 when `active`; length 0 when `withdrawn`; unique values; order = rank 1..n | `["en"]` | `["pt-BR","en"]` |
| source | enum `user_selected` / `system_default` | no | how the current list was set | `system_default` | `user_selected` |
| revision | integer >= 1 | no | +1 per accepted write; compared to `expected_revision` on writes | 1 | `3` |
| schema_version | integer | no | equals 1 | 1 | `1` |
| created_at | timestamp UTC | no | first accepted write | now | `2026-11-10T09:20:44.001Z` |
| updated_at | timestamp UTC | no | >= created_at | now | `2026-11-10T11:02:17.530Z` |

Stored tags are kept in canonical form. Tags are stored by value, not by foreign key, so a retired tag still identifies the list the participant chose (A-languages-05).

## Entity: language_preference_revision
Append-only history. Written in the same transaction as the `language_preference` change. No updates. Removed only by the retention job in [privacy_retention_abuse.md](privacy_retention_abuse.md).

| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| revision_id | string(26) | no | primary key | `01J8ZR3K4M5N6P7Q8R9S0T1V2W` |
| preference_id | string(26) | no | references language_preference | `01J8ZR0A1B2C3D4E5F6G7H8J9K` |
| participant_id | string(1..64) | no | copied from preference at write time | `pid_a1b2c3d4e5f6` |
| revision | integer >= 1 | no | unique with preference_id | `3` |
| previous_tags | array, length 0..5 | no | tags before the write | `["en"]` |
| new_tags | array, length 0..5 | no | tags after the write | `["pt-BR","en"]` |
| change_kind | enum `set` / `withdraw` / `erase_tombstone` | no | what the command did | `set` |
| command_id | string(26) | no | idempotency key of the originating command (see failure_recovery_idempotency.md) | `01J8ZR4X5Y6Z7A8B9C0D1E2F3G` |
| actor_ref | string(1..64) | no | `participant_id` for self-service; `system:<job>` for system | `pid_a1b2c3d4e5f6` |
| recorded_at | timestamp UTC | no | server clock, millisecond precision | `2026-11-10T11:02:17.530Z` |
| schema_version | integer | no | equals 1 | `1` |

## Text direction rule (R06)
`text_direction` is derived from the script subtag using a versioned table maintained with catalog data (A-languages-11). Initial right-to-left set: `Arab`, `Hebr`, `Syrc`, `Thaa`, `Nkoo`, `Adlm`. All other scripts are `ltr`. When the tag has no script subtag, the script is the default script of the primary subtag from the same table. An operator may not set a direction that contradicts the table; the write fails with `LANGUAGES_DIRECTION_MISMATCH`.

## Global invariants
- INV-1: exactly one `language_catalog_entry` row has `is_platform_default = true`; its tag is `en` and its status is `active`.
- INV-2: at most one non-retired catalog row per `language_tag`.
- INV-3: `language_preference.status = active` implies 1..5 tags; `withdrawn` implies 0 tags.
- INV-4: `language_preference.revision` never decreases; `(preference_id, revision)` is unique in revision history.
- INV-5: `participant_id` appears at most once in `language_preference`.
- INV-6: `retired_at` is non-null if and only if `status = retired`.
- INV-7: a revision row's `new_tags` equals the `ordered_language_tags` stored on the preference at that revision.

## Capacity and limits
- Non-retired catalog entries: at most 200 (A-languages-09).
- Tags per preference: at most 5.
- Fallback chain depth: at most 3 hops, terminating at `en` (A-languages-22).

## Assumptions
**Assumption A-languages-01:** Identifiers are 26-character ULID-shaped Crockford base32 strings until CTR-ID-001 fixes the format. Changing the format is a schema-version change.

**Assumption A-languages-03:** `en` is the platform default and fallback root. It cannot be deprecated or retired and is the only row with `is_platform_default = true`.

**Assumption A-languages-05:** Stored preference tags are never rewritten when catalog status changes. Resolution at read time skips non-active tags and applies fallback (see [commands_queries_events.md](commands_queries_events.md), query `languages.preference.resolve`).

**Assumption A-languages-09:** Capacity limits above apply to the first release. Raising them requires a schema review.

**Assumption A-languages-10:** UI message bundles are produced outside this module. This module exposes only catalog status and `ui_coverage_pct`, supplied by the localization build pipeline.

**Assumption A-languages-11:** The rtl script set is versioned with catalog data and reviewed when the catalog changes. The initial set is listed in R06.

**Assumption A-languages-22:** Fallback chains are at most 3 hops and resolve to `en` if they do not terminate earlier.

## Open decisions
- A-languages-01: identifier format pending CTR-ID-001 (owner F15).
- A-languages-03, A-languages-05, A-languages-09, A-languages-10, A-languages-11, A-languages-22: see above. Each is a recommended default, not an approved architecture decision.
- Whether catalog coverage data is pushed by the build pipeline or pulled by this module is unresolved; default is push with `languages.catalog.set_coverage` under the operator capability.

## Test references
Fixtures and tests: [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md), IDs `TEST-PS-113-01-Tnn`.
