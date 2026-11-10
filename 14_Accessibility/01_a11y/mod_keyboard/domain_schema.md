# PS-109-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-109-01. **Owner:** [14_Accessibility/01_a11y/mod_keyboard](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_keyboard. **Consumers:** F07 (account lifecycle cascade), F10 (export and retention), F15 (event envelope, schema registry, typed errors), F16 (capability checks); feature modules F01–F14 read the action catalog as read-only reference data.

## Purpose and scope
Define the persisted model for keyboard operability preferences: one account-scoped profile, its shortcut bindings, and an append-only revision history. Runtime keyboard behavior (focus order, focus-indicator rendering, dialog focus handling, shortcut dispatch) is client behavior specified in PS-109-03 and PS-109-06. This file covers only data that must survive a session.

**Business outcome:** a keyboard-only user keeps the same focus-indicator style and shortcut set across sessions and devices, can change them without affecting other features, and can export or delete them.

**Exclusions:** no screen reader announcements (mod_screenreader); no WCAG audit tooling or conformance claims (mod_wcag); no pointer, touch or voice input profiles; no hardware or device identifiers; no per-device settings; no record of keys pressed, typing content or usage telemetry; no ownership of listings, trades or other feature actions that shortcuts trigger.

## Requirements
- **PS-109-01.R01** — Actors: account owner (reads and writes own profile); client app (reads, proposes writes, queues offline writes); relay (canonical store); operator (aggregate metrics only, never per-user content).
- **PS-109-01.R02** — Cases to model: normal (first write creates profile); invalid (unknown action, malformed combo, over limit); expired (queued offline write older than 7 days, PS-109-06); duplicate (replayed idempotency key); concurrent (two devices writing the same revision); offline (client queue); adversarial (oversized payload, client-supplied account_id mismatch, unknown fields, binding a browser-reserved combo).
- **PS-109-01.R03** — Budgets: serialized profile at most 8 KiB (A-KBD-14); at most 32 bindings; server read p95 150 ms and write p95 300 ms (PS-109-08). Editing must be possible with keyboard alone: every field is an enum or a combo chosen through a keyboard-operable control (PS-109-03).
- **PS-109-01.R04** — Entities: `keyboard_preference_profile` (canonical, mutable, versioned by `revision`); `keyboard_shortcut_binding` (value object embedded in profile); `keyboard_preference_revision` (append-only history); `keyboard_shortcut_catalog` (read-only reference, shipped with client build, versioned by `catalog_version`).
- **PS-109-01.R05** — Field constraints are fixed by the tables below. Unknown fields in requests are rejected; unknown fields in responses are ignored by clients (forward compatibility).
- **PS-109-01.R06** — Catalog v1 contains exactly the 12 actions listed below. Removing an action in a later catalog version keeps stored bindings for it; clients ignore them and the server never deletes them silently.
- **PS-109-01.R07** — History retains the last 20 revisions per profile for 90 days (A-KBD-07). Each revision stores a full snapshot and provenance.

## Entity: keyboard_preference_profile
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| profile_id | string (ULID, 26 chars) | no | immutable, unique (A-KBD-01) | generated | `01J9Z3K8Q4W6R2T5V7X1Y0ZABC` |
| account_id | string (opaque F07 account reference) | no | unique among non-deleted profiles; must match caller | none | `acct_ref_EXAMPLE_0001` |
| schema_version | string enum | no | must be `keyboard.profile/1` | `keyboard.profile/1` | `keyboard.profile/1` |
| catalog_version | string | no | must be a catalog version known to server | `kbd-catalog/1` | `kbd-catalog/1` |
| revision | integer | no | >= 1; +1 per committed write; never reused | 1 | 4 |
| focus_indicator | enum: `system_default`, `high_contrast`, `thick_outline` | no | one of three | `system_default` | `high_contrast` |
| shortcut_hints | enum: `hidden`, `visible_on_focus`, `always` | no | one of three | `visible_on_focus` | `visible_on_focus` |
| shortcut_bindings | array of binding | no | 0..32 items; unique `action_id` | `[]` (catalog defaults apply) | see example |
| created_at | RFC 3339 UTC, millisecond | no | server-assigned | server time | `2026-11-01T09:00:00.000Z` |
| updated_at | RFC 3339 UTC, millisecond | no | >= created_at; server-assigned | server time | `2026-11-10T08:15:30.412Z` |
| deleted_at | RFC 3339 UTC | yes | non-null only when tombstoned (PS-109-03) | null | null |

## Value object: keyboard_shortcut_binding
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| action_id | enum from catalog | no | must exist in catalog_version; unique per profile | none | `focus_search` |
| key_combo | string | no | canonical form `Alt+<key>` (A-KBD-04, A-KBD-05); `<key>` from allowlist in validation_rules.md; not reserved | catalog default | `Alt+S` |
| enabled | boolean | no | | true | true |

Scope is not stored per binding; it is fixed by the catalog.

## Read-only reference: keyboard_shortcut_catalog (kbd-catalog/1)
| action_id | Scope | Default combo | Description key |
|---|---|---|---|
| skip_to_main_content | global | Alt+M | `kbd.action.skip_to_main` |
| open_shortcut_help | global | Alt+K | `kbd.action.shortcut_help` |
| focus_search | global | Alt+S | `kbd.action.focus_search` |
| focus_navigation | global | Alt+N | `kbd.action.focus_navigation` |
| save_draft | global | Alt+G | `kbd.action.save_draft` |
| return_to_previous_context | global | Alt+B | `kbd.action.return_previous` |
| next_list_item | list_view | Alt+ArrowDown | `kbd.action.next_item` |
| previous_list_item | list_view | Alt+ArrowUp | `kbd.action.previous_item` |
| open_selected_item | list_view | Alt+Enter | `kbd.action.open_item` |
| toggle_filter_panel | list_view | Alt+R | `kbd.action.toggle_filters` |
| confirm_dialog | dialog | Alt+C | `kbd.action.confirm` |
| cancel_dialog | dialog | Alt+Backspace | `kbd.action.cancel` |

Description keys resolve through 02_internationalization; this module stores no translated text.

## Entity: keyboard_preference_revision (append-only)
| Field | Type | Constraints |
|---|---|---|
| revision_id | ULID | immutable |
| profile_id | ULID | references profile |
| revision | integer | unique per profile |
| prior_revision | integer or null | null only for revision 1 |
| snapshot | object | full profile body minus timestamps, same schema |
| source | enum: `client_web`, `client_offline_replay`, `import`, `rollback`, `system_account_deleted` | required |
| actor_ref | string | account_ref for user actions; `system` otherwise |
| correlation_id | string | from CTR-EVT-001 envelope |
| created_at | RFC 3339 UTC | server-assigned |

## Example: profile body (response)
```json
{
  "profile_id": "01J9Z3K8Q4W6R2T5V7X1Y0ZABC",
  "account_id": "acct_ref_EXAMPLE_0001",
  "schema_version": "keyboard.profile/1",
  "catalog_version": "kbd-catalog/1",
  "revision": 4,
  "focus_indicator": "high_contrast",
  "shortcut_hints": "visible_on_focus",
  "shortcut_bindings": [
    {"action_id": "focus_search", "key_combo": "Alt+S", "enabled": true}
  ],
  "created_at": "2026-11-01T09:00:00.000Z",
  "updated_at": "2026-11-10T08:15:30.412Z",
  "deleted_at": null
}
```

## Ownership, provenance and boundaries
- This module owns the four entities above. F07 owns the account; the module stores only `account_id`.
- Client-side pending writes live in a local IndexedDB queue (PS-109-06). They are not canonical and never appear in exports.
- Provenance on every revision is required (`source`, `actor_ref`, `correlation_id`).
- Rollback and import create new revisions; they never rewrite or delete history rows inside the retention window (PS-109-10).

## Open decisions
- A-KBD-01 (ULID identifiers; CTR-ID-001 is OPEN), A-KBD-04/05 (combo grammar and reserved list), A-KBD-07 (history depth and retention; D07 OPEN), A-KBD-14 (payload budget). See [DECISIONS.md](../../../DECISIONS.md) D07 and D10.

## Acceptance criteria
- Every field has type, nullability, constraint, default and example.
- Catalog, combo grammar and entity set match PS-109-02 and PS-109-04 exactly.
- Canonical IDs and envelopes reference CTR-ID-001 and CTR-EVT-001; no schema is duplicated from planning/CONTRACTS.md.
- Test IDs: TEST-PS-109-01 (see PS-109-09 for numbered cases).
