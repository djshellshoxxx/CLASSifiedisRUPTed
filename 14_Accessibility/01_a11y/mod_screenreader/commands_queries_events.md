# PS-110-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-110-04. **Owner:** [14_Accessibility/01_a11y/mod_screenreader](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_screenreader. **Consumers:** feature surfaces F01–F13 that resolve or announce catalog labels by `label_id`; shared cross-cutting contracts F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [registry](../../../planning/SPEC_REGISTRY.csv).

## Purpose and scope
Defines the versioned command, query and event surface of mod_screenreader. Payloads use `schema_version: 1` (CTR-SCH-001, owner F15). Event envelope fields follow CTR-EVT-001 (owner F15). Error envelope follows CTR-ERR-001. Authorization for each call is in [authorization_capabilities.md](authorization_capabilities.md). State effects are in [workflow_state_machine.md](workflow_state_machine.md).

## Requirements
- PS-110-04.R01: **Business outcome.** Feature surfaces resolve or announce a state explanation by `label_id` with one call; operators stage, approve, publish and roll back catalog releases; participants read and update their own preferences. **Exclusions:** no subscription to feature domain events (A-screenreader-08); no read of another participant's preference; no write of user-generated text.
- PS-110-04.R02: **Cases.** Normal: resolve with a valid param set. Invalid: unknown command field; wrong `schema_version`. Expired: an idempotency key older than 24 hours is treated as new (A-screenreader-09). Duplicate: same `Idempotency-Key` and body returns the original response with `Idempotent-Replayed: true`. Concurrent: two `upsertDraft` calls with the same `expected_revision`; one wins, the other gets `SCREENREADER_REVISION_CONFLICT`. Offline: preference updates carry `client_revision` and queue locally. Adversarial: same key with a different body; a command with a forged `caller` field (ignored, identity from session token).
- PS-110-04.R03: **Budgets.** `catalog.resolve` p95 ≤ 50 ms server-side. Query responses are cacheable with `ETag` equal to the release checksum. Payloads ≤ 16 KiB per request. No command or query returns text the caller did not supply, except resolve and release reads of active catalog content. All error messages are plain text with a `detail_key`.

## Commands

All state-changing commands require `Idempotency-Key` (ULID, header), `schema_version`, and the caller's session. The caller's identity comes from the session token and is never read from the body.

| Command | Signature | Effect | Idempotency | Capability |
|---|---|---|---|---|
| `screenreader.label.upsertDraft` | `upsertDraft(label: LabelBody, expected_revision: int or null) -> {label, revision}` | creates or updates a draft row | key + body hash; `expected_revision` checked (VR-11) | `sr.label.draft.write` |
| `screenreader.label.discardDraft` | `discardDraft(label_id, locale, expected_revision) -> {status}` | draft to discarded | key | `sr.label.draft.write` |
| `screenreader.release.stage` | `stage(entries: [{label_id, locale, op: upsert or remove, revision}]) -> {catalog_version, state}` | creates or extends the single staging release | key | `sr.release.stage` |
| `screenreader.release.publish` | `publish(catalog_version, expected_checksum, approver_ids: [ULID] or null) -> {catalog_version, state, published_at}` | staging to published; outbox event written | key | `sr.release.publish` |
| `screenreader.release.rollback` | `rollback(target_version) -> {catalog_version, state: staging}` | new staging release copying target content | key | `sr.release.rollback` |
| `screenreader.release.abandon` | `abandon(catalog_version) -> {state: abandoned}` | staging to abandoned | key | `sr.release.abandon` |
| `screenreader.preference.update` | `update(patch: PreferencePatch, expected_revision: int) -> {revision, updated_at}` | updates own preference | key; `expected_revision` checked | `sr.preference.own.write` |
| `screenreader.preference.setSyncEnabled` | `setSyncEnabled(enabled: bool, local_snapshot: PreferenceBody or null) -> {sync_enabled, revision}` | opt-in creates server row; opt-out deletes it | key | `sr.preference.own.write` |

Request example, `upsertDraft`:
```json
{
  "schema_version": 1,
  "label": {
    "label_id": "sr.f01.listing.expire_notice",
    "locale": "en-US",
    "role": "status",
    "message_template": "Listing expired on {day}. Restore it within {hours} hours.",
    "announce_priority": "polite",
    "allowed_params": ["day", "hours"]
  },
  "expected_revision": 3
}
```
Headers: `Idempotency-Key: 01J9ZF2Q6S8U0W2Y4A6C8E0G2J`

Response example:
```json
{
  "schema_version": 1,
  "label": { "label_id": "sr.f01.listing.expire_notice", "locale": "en-US", "revision": 4, "status": "draft" },
  "revision": 4,
  "idempotent_replayed": false
}
```

## Queries

| Query | Signature | Returns | Cache |
|---|---|---|---|
| `screenreader.catalog.resolve` | `resolve(label_id, locale, params: object) -> {text, priority, role, locale_used, catalog_version}` | rendered text from the active release | client cache per release; `Cache-Control: private, max-age=300` |
| `screenreader.catalog.getRelease` | `getRelease(catalog_version or "latest", locale) -> {release_meta, rows[]}` | active rows for one locale | `ETag` = checksum |
| `screenreader.preference.get` | `get() -> PreferenceBody or {sync_enabled: false}` | caller's own preference only | `no-store` |
| `screenreader.coverage.report` | `report(feature_code, locale) -> {required, labelled, ratio}` | counts only | operator only, no cache |

Resolve request and response:
```json
{ "schema_version": 1, "label_id": "sr.f01.listing.expire_notice", "locale": "es-MX", "params": { "day": "2026-11-01", "hours": 48 } }
```
```json
{ "schema_version": 1, "text": "El anuncio venció el 2026-11-01. Restáuralo en 48 horas.", "priority": "polite", "role": "status", "locale_used": "es-MX", "catalog_version": 4 }
```
Unknown and non-active labels both return `SCREENREADER_LABEL_NOT_FOUND` (404), so drafts cannot be enumerated.

## Events (CTR-EVT-001 envelope)

Envelope fields used: `event_id` (ULID), `aggregate` (`sr_release` or `sr_preference`), `aggregate_revision`, `actor` (pseudonymous ULID), `occurred_at`, `correlation_id`, `idempotency_key`, `schema_version`, `provenance` (module name and build ID).

| Event | Emitted by | Payload (besides envelope) |
|---|---|---|
| `screenreader.release.staged.v1` | `release.stage` | `catalog_version`, `row_count` |
| `screenreader.release.published.v1` | `release.publish` | `catalog_version`, `checksum_sha256`, `row_count`, `approver_count` |
| `screenreader.release.superseded.v1` | publish commit of a newer release | `catalog_version`, `superseded_by` |
| `screenreader.release.rolled_back.v1` | `release.rollback` (on publish) | `catalog_version`, `rollback_of` |
| `screenreader.preference.updated.v1` | `preference.update` | `participant_id`, `revision`, `changed_keys` (names only, no values) |
| `screenreader.coverage.degraded.v1` | scheduled job | `feature_code`, `locale`, `ratio` |

Event example:
```json
{
  "event_id": "01J9ZG7H3K5M9P1R3T5V7X9Z1B",
  "aggregate": "sr_release",
  "aggregate_revision": 4,
  "actor": "01J9ZD0M4R6T8V2X5Z7B9C1D3F",
  "occurred_at": "2026-11-10T09:30:00.000Z",
  "correlation_id": "01J9ZH1A2B3C4D5E6F7G8H9J0K",
  "idempotency_key": "01J9ZF2Q6S8U0W2Y4A6C8E0G2J",
  "schema_version": 1,
  "provenance": { "module": "mod_screenreader", "build_id": "<build id>" },
  "catalog_version": 4,
  "checksum_sha256": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d",
  "row_count": 412,
  "approver_count": 2
}
```
Delivery is at-least-once through the outbox; consumers dedupe on `event_id`.

## Idempotency and versioning
- Key scope: (caller, command name, `Idempotency-Key`). Retention 24 hours (A-screenreader-09).
- Same key and same body hash: return stored response. Same key and different hash: `SCREENREADER_IDEMPOTENCY_CONFLICT` (409).
- Breaking change: new `schema_version`; old version served for at least one release cycle (CTR-SCH-001 migration rules).

## Open decisions
- **A-screenreader-08:** v1 does not subscribe to feature domain events. Features call resolve or announce explicitly. An event-driven announcer is deferred until a feature needs it, to avoid coupling this module to every domain.
- **A-screenreader-09:** Idempotency keys are retained 24 hours. Longer retention would increase storage of request hashes without a stated need.
