# PS-110-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-110-01. **Owner:** [14_Accessibility/01_a11y/mod_screenreader](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_screenreader. **Consumers:** feature surfaces F01–F13 that resolve or announce catalog labels by `label_id`; shared cross-cutting contracts F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [registry](../../../planning/SPEC_REGISTRY.csv).

## Purpose and scope
Defines the records owned by mod_screenreader:
- `sr_label`: one accessible-text entry per (`label_id`, `locale`), with role, accessible name, announcement template and priority.
- `sr_release`: an immutable, checksummed set of active labels that clients download and cache.
- `sr_preference`: a participant's announcement verbosity and toggles. A server row exists only when the participant opts in to sync.
- `sr_announcement`: a transient rendered announcement. It is never persisted (A-screenreader-03).

## Requirements
- PS-110-01.R01: **Business outcome.** Assistive-technology users receive the same state explanation (invalid, expired, offline, rejected, disputed, pending-sync, success) as sighted users. Text comes from one versioned, plain-text catalog that operators can publish and roll back without a code deploy. Participants can set announcement verbosity.
  **Actors:** anonymous visitor (read active release), participant (own preference), feature owner (draft labels under own prefix), catalog editor, release manager, auditor (read-only), system service.
  **Exclusions:** no control of the OS or assistive technology product; no speech audio capture or storage; no focus order or keyboard map (mod_keyboard); no WCAG audit engine (mod_wcag); no translation workflow (02_internationalization); no user-generated content (listing titles, messages, names, amounts, coordinates) in any announcement; no notification delivery (F13); no custody of money.
- PS-110-01.R02: **Cases.** Normal: resolve an active label for a supported locale. Invalid: `label_id` outside the pattern; locale not enabled. Expired: not applicable to labels; a retired label resolves as not found. Duplicate: a second draft for an existing (`label_id`, `locale`) pair is rejected with `SCREENREADER_LABEL_EXISTS`. Concurrent: two editors update the same draft; the second receives `SCREENREADER_REVISION_CONFLICT`. Offline: preference changes queue locally (see failure spec). Adversarial: markup or control characters in text; a feature writing a label under another feature's prefix; unknown placeholders in templates.
- PS-110-01.R03: **Budgets.** Plain text only, with `role` set on every row. Announcement templates ≤ 240 characters; accessible names ≤ 120 characters. en-US is mandatory for every active `label_id`. One locale's release ≤ 400 KB uncompressed for 2 000 active rows. Single-row read from the server cache p95 ≤ 5 ms. Backup RPO for these tables ≤ 1 hour.

## sr_label

| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| label_id | string | no | regex `^sr\.f(0[1-9]\|1[0-8])\.[a-z0-9_]+(\.[a-z0-9_]+){1,3}$`, 8–96 chars; immutable after first active release | none | `sr.f01.listing.expire_notice` |
| locale | string | no | BCP 47 subset `^[a-z]{2,3}(-[A-Z]{2})?$`; must be enabled in locale configuration | none | `en-US` |
| revision | int | no | ≥ 1; +1 on every write | 1 | 3 |
| status | enum | no | `draft`, `active`, `retired`, `discarded` | `draft` | `active` |
| role | enum | no | `button`, `link`, `heading`, `status`, `alert`, `dialog`, `textbox`, `listbox`, `region`, `img` | `status` | `alert` |
| accessible_name | string | yes | 1–120 characters; plain text; no leading or trailing whitespace; no C0/C1 controls | null | `Offer expired` |
| state_description | string | yes | 0–160 characters; same text rules | null | `Expired; no further action possible.` |
| message_template | string | yes | 1–240 characters; placeholders limited to `{count}`, `{state}`, `{day}`, `{hours}` | null | `Listing expired on {day}. Restore it within {hours} hours.` |
| announce_priority | enum | no | `none`, `polite`, `assertive` | `none` | `polite` |
| allowed_params | array of enum | no | subset of `count`, `state`, `day`, `hours`; unique; max 4 items | `[]` | `["day", "hours"]` |
| catalog_version | int | yes | null while draft; references `sr_release.catalog_version` once published | null | 4 |
| updated_by | ULID | no | operator participant ID holding `sr.label.draft.write` | none | `01J9ZC3K8W5Q7R2N4T6V8X0Y1B` |
| created_at, updated_at | timestamp | no | RFC 3339, UTC, millisecond precision | now | `2026-11-10T09:00:00.000Z` |

Example row:
```json
{
  "label_id": "sr.f01.listing.expire_notice",
  "locale": "en-US",
  "revision": 3,
  "status": "active",
  "role": "status",
  "accessible_name": null,
  "state_description": null,
  "message_template": "Listing expired on {day}. Restore it within {hours} hours.",
  "announce_priority": "polite",
  "allowed_params": ["day", "hours"],
  "catalog_version": 4,
  "updated_by": "01J9ZC3K8W5Q7R2N4T6V8X0Y1B",
  "updated_at": "2026-11-10T09:00:00.000Z"
}
```

## sr_release

| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| catalog_version | int | no | primary key; ≥ 1; strictly increasing; gap-free | none | 4 |
| state | enum | no | `staging`, `published`, `superseded`, `abandoned` | `staging` | `published` |
| row_count | int | no | ≥ 1 | none | 412 |
| checksum_sha256 | string | no | 64 lowercase hex over canonical JSON of the release rows (keys sorted, UTF-8, no insignificant whitespace) | none | `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d` |
| rollback_of | int | yes | set when content was copied from an earlier published version | null | 2 |
| supersedes_version | int | yes | previous published version | null | 3 |
| approver_ids | array of ULID | yes | required when any row has `announce_priority = assertive`; two distinct release managers, neither equal to the stager | null | `["01J9ZC3K8W5Q7R2N4T6V8X0Y1B", "01J9ZD0M4R6T8V2X5Z7B9C1D3F"]` |
| published_at | timestamp | yes | set when state is `published` | null | `2026-11-10T09:30:00.000Z` |

Invariants: at most one row in `staging`; a `published` row is immutable; `row_count` equals the count of rows with the same `catalog_version`.

## sr_preference

| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| participant_id | ULID | no | primary key; references the F07 account; row exists only while sync is enabled | none | `01J9ZE5N7P9R1T3V5X7Z9B1D3F` |
| verbosity | enum | no | `brief`, `standard`, `detailed` | `standard` | `brief` |
| announce_background_sync | bool | no | controls announcements for queued-write results | true | true |
| announce_deadline_warnings | bool | no | controls announcements for expiry warnings | true | false |
| locale_override | string | yes | same pattern as `locale`; must be enabled; null follows device locale | null | `es-MX` |
| revision | int | no | ≥ 1 | 1 | 7 |
| schema_version | int | no | fixed at 1 for this release | 1 | 1 |
| updated_at | timestamp | no | RFC 3339, UTC | now | `2026-11-10T09:12:00.000Z` |

## sr_announcement (transient)

| Field | Type | Notes |
|---|---|---|
| announcement_id | ULID | generated per emission; not stored |
| label_id, locale | string | resolved label and the locale actually used after fallback |
| priority | enum | from the resolved label |
| text | string | rendered from `message_template`; ≤ 240 characters |
| params | object | keys restricted to `allowed_params`; values typed (count int, state enum, day `YYYY-MM-DD`, hours int 1–720) |
| correlation_id | ULID | supplied by the caller |
| catalog_version | int | release used for rendering |

## Open decisions
- **A-screenreader-01:** Record IDs are 26-character ULID strings (Crockford base32). CTR-ID-001 leaves UUID versus ULID OPEN. If CTR-ID-001 chooses UUID, only the regex and examples change.
- **A-screenreader-02:** Preferences are device-local by default. A server row is written only after the signed-in participant opts in to sync. This keeps account-free use and minimises stored data. Linked to D10 (auth and portability, OPEN).
- **A-screenreader-03:** Announcement payloads are never persisted. Diagnostics keep only counters, as defined in observability_performance.md.
