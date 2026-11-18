# PS-113-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-04. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Defines the public interface of the languages capability: commands that change state, queries that read it, and the domain events emitted after each committed change. Shapes are working contracts; the envelope and schema registry are owned by CTR-EVT-001 and CTR-SCH-001.

## Requirements to specify
- [x] PS-113-04.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-04.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-04.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-04.R04: Command signatures with idempotency key and schema version.
- [x] PS-113-04.R05: Query signatures with pagination, caching and response shapes.
- [x] PS-113-04.R06: Domain event names, payloads and envelope fields, with subscriber expectations.
- [x] PS-113-04.R07: Request and response JSON examples for each state-changing command.

## Business outcome and exclusions
**Outcome:** A client can read the catalog, set or clear a participant's language list, and ask which language to use for display. Operators can change catalog status. Every committed change emits one event.

**Exclusions:** bulk import of preferences (see [import_export_backup_rollback.md](import_export_backup_rollback.md)); push delivery of events to end users; translation requests; any query that reveals another participant's list.

## Common envelope
Every command carries:
- `command_id` (string(26), ULID-shaped): idempotency key, required (see [failure_recovery_idempotency.md](failure_recovery_idempotency.md)).
- `schema_version` (integer, must be 1).
- `actor` is taken from the authenticated session, never from the body.

Every response carries `correlation_id` and, on success, `revision` of the affected aggregate. Errors use the envelope in [validation_rules.md](validation_rules.md).

## Commands
| Name | Signature | Actor | Idempotent | Emits |
|---|---|---|---|---|
| `languages.catalog.create_draft` | `(command_id, language_tag, native_name, text_direction, fallback_tag?, ui_coverage_pct) -> {entry_id, status:"draft", revision}` | operator with `languages.catalog.write` | yes | `languages.catalog.entry_created.v1` |
| `languages.catalog.set_coverage` | `(command_id, entry_id, expected_revision, ui_coverage_pct) -> {entry_id, revision}` | operator with `languages.catalog.write` | yes | `languages.catalog.coverage_updated.v1` |
| `languages.catalog.transition` | `(command_id, entry_id, expected_revision, target_status: active\|deprecated\|retired) -> {entry_id, status, revision}` | operator with `languages.catalog.status` | yes | `languages.catalog.entry_status_changed.v1` |
| `languages.preference.set` | `(command_id, expected_revision, ordered_language_tags: string[1..5]) -> {preference, revision, replayed}` | participant (self only) with `languages.preference.write:self` | yes | `languages.preference.changed.v1` |
| `languages.preference.withdraw` | `(command_id, expected_revision) -> {status:"withdrawn", revision}` | participant (self only) | yes | `languages.preference.withdrawn.v1` |

`expected_revision` for `languages.preference.set` is `0` when no row exists (state `none`).

## Queries
| Name | Signature | Actor | Caching | Response |
|---|---|---|---|---|
| `languages.catalog.list` | `(status_filter: default active+deprecated, if_none_match?) -> entries[]` | public (no auth required for `active`) | `Cache-Control: max-age=86400`, ETag (A-languages-16) | `{entries:[{language_tag, native_name, text_direction, status, fallback_tag, ui_coverage_pct, revision}], etag}` |
| `languages.preference.get` | `(participant_id = self) -> preference or null` | participant (self) | no-store | `{preference_id, status, ordered_language_tags, revision, updated_at}` |
| `languages.preference.resolve` | `(participant_id = self, candidate_tags?: string[0..8]) -> {effective_tag, reason, skipped_tags}` | participant (self) or service with `languages.preference.resolve` | no-store | see example |
| `languages.preference.revisions` | `(participant_id, cursor?, limit<=50) -> {items[], next_cursor}` | participant (self) or auditor with `languages.preference.revisions.read` | no-store | revision rows without `command_id` for non-auditors |

`languages.preference.resolve` algorithm: walk `ordered_language_tags` in order and return the first entry with status `active`. If none, walk each tag's fallback chain (max 3 hops). If still none, return `en` with `reason = platform_default`. `candidate_tags` are only used when the participant has no list (`reason = candidate_match`). Device locale is never sent to the server unless the participant includes it in `candidate_tags` (A-languages-15).

## Events
Envelope (CTR-EVT-001 working fields): `event_id`, `event_name`, `schema_version`, `aggregate_type`, `aggregate_id`, `revision`, `actor_ref`, `occurred_at` (UTC, ms), `correlation_id`, `command_id`, `payload`.

| Event | Payload fields | Subscribers (provisional) |
|---|---|---|
| `languages.catalog.entry_created.v1` | `entry_id, language_tag, status` | observability; UI bundle build |
| `languages.catalog.coverage_updated.v1` | `entry_id, ui_coverage_pct` | observability |
| `languages.catalog.entry_status_changed.v1` | `entry_id, language_tag, from_status, to_status` | content modules that filter by language; UI bundle build |
| `languages.preference.changed.v1` | `preference_id, revision, ordered_language_tags, source` | observability (counts only) |
| `languages.preference.withdrawn.v1` | `preference_id, revision` | observability |
| `languages.preference.erased.v1` | `preference_id, erasure_ref` | erasure job confirmation; no tags, no participant id |

Payload rules: `participant_id` is never in an event payload except where the envelope `actor_ref` needs it; `native_name` is not repeated in events. Subscribers must be idempotent on `event_id`. Delivery is at least once.

## Request and response examples
Set preferences (request):
```json
{"command_id":"01J8ZS1A2B3C4D5E6F7G8H9J0K","schema_version":1,"expected_revision":2,"ordered_language_tags":["pt-BR","en"]}
```
Set preferences (response, 200):
```json
{"preference":{"preference_id":"01J8ZR0A1B2C3D4E5F6G7H8J9K","status":"active","ordered_language_tags":["pt-BR","en"],"revision":3,"updated_at":"2026-11-10T11:02:17.530Z"},"revision":3,"replayed":false,"correlation_id":"c_9f2a71"}
```
Catalog transition (request):
```json
{"command_id":"01J8ZS2B3C4D5E6F7G8H9J0K1M","schema_version":1,"entry_id":"01J8ZQ3V6Y0F9K2M4N5P7R8S9T","expected_revision":4,"target_status":"deprecated"}
```
Catalog transition (response, 200):
```json
{"entry_id":"01J8ZQ3V6Y0F9K2M4N5P7R8S9T","status":"deprecated","revision":5,"correlation_id":"c_4b18de"}
```
Resolve (response, 200):
```json
{"effective_tag":"en","reason":"fallback","skipped_tags":["pt-BR"],"correlation_id":"c_0d7e33"}
```
Event example:
```json
{"event_id":"01J8ZS3C4D5E6F7G8H9J0K1M2N","event_name":"languages.preference.changed.v1","schema_version":1,"aggregate_type":"language_preference","aggregate_id":"01J8ZR0A1B2C3D4E5F6G7H8J9K","revision":3,"actor_ref":"pid_a1b2c3d4e5f6","occurred_at":"2026-11-10T11:02:17.530Z","correlation_id":"c_9f2a71","command_id":"01J8ZS1A2B3C4D5E6F7G8H9J0K","payload":{"ordered_language_tags":["pt-BR","en"],"source":"user_selected"}}
```

## Schema versioning (CTR-SCH-001)
- Current version for all commands, queries and events: 1.
- Additive changes (new optional field, new event) keep version 1. Removing or renaming a field, or changing a type, requires version 2.
- A version 2 release dual-reads both versions for at least 180 days (A-languages-17).
- Unknown `schema_version` returns `LANGUAGES_SCHEMA_VERSION_UNSUPPORTED`.

## Performance budget (R03)
- `languages.catalog.list`: p95 <= 150 ms uncached; expected to be served from edge cache. Payload <= 60 KB for 200 entries.
- `languages.preference.get` and `resolve`: p95 <= 100 ms.
- Commands: p95 <= 300 ms.
- Labels in responses are native-script strings; clients render them with `lang` and `dir`.

## Assumptions
**Assumption A-languages-15:** Device locale is a UI suggestion only and is not stored server-side unless the participant saves it as a list.

**Assumption A-languages-16:** Catalog list is cacheable for 24 hours with ETag revalidation on client.

**Assumption A-languages-17:** v1 changes are additive only. Breaking changes require version 2 with 180-day dual read.

## Open decisions
- A-languages-15, A-languages-16, A-languages-17.
- Whether `languages.preference.resolve` is a query or an internal service call is unresolved; default is query with self-only access plus a service capability for notifications.
- Subscriber map is provisional until Prompt 3 validates it against the registry.

## Test references
Contract tests for each command, query and event: `TEST-PS-113-04-Tnn` in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
