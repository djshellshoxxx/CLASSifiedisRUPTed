# PS-103-02 — event and notice validation

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-02 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-02.R01 — acceptance boundary

Only F15-validated local CR-003 v1 events in the active unlocked vault may enter the consumer. This module validates the event metadata it relies on, never upgrades an event's trust level, and never turns imported peer data into a local authoritative event. Unknown event names and versions are suppressed without rendering or payload inspection beyond bounded schema checks.

## PS-103-02.R02 — exact validation sequence

For each candidate, in order:

1. Require an unlocked F07 local principal and matching `vault_id`/`principal_id` from the vault context; caller-supplied ownership is ignored.
2. Require `event_version=1`, a UUIDv4 `event_id`, UUIDv4 `vault_id`, `principal_id`, and `aggregate_id`, a positive safe `aggregate_revision` in `1..9,007,199,254,740,991`, and an F15 committed-local status.
3. Match the exact source event name against the module's four-event allowlist. Slash aliases, prefixes, historical aliases, `message.sent`, `payment.*`, imported/federated events, and unknown versions are ineligible.
4. Verify the event belongs to this vault/principal and is not marked quarantined or deleted. A changed event under an existing `event_id` returns `CONFLICT_QUARANTINED` and does not overwrite prior output.
5. Derive category and `message_key` from the fixed table. Do not read, interpolate, log, or persist event text/payload. Only validated IDs/revision are retained.
6. Resolve F13.S02 preference decision. `DISABLED` suppresses and advances the local consumer marker with no notice. `{state: UNAVAILABLE}`, malformed output, including any disabled-inbox/non-disabled-banner combination, or resolver error returns `POLICY_UNAVAILABLE` and leaves the event pending. `QUIET` permits the inbox item but suppresses a live banner.
7. Verify the resulting record is within schema bounds, <=4,096 UTF-8 bytes, and within per-vault cap rules before atomic insertion.

`occurred_at` and wall-clock values are advisory only. No event is accepted as newer, expired, settled, globally ordered, or peer acknowledged based on timestamp. The parent CR-002 command limit of 256 KiB applies before F15 dispatch; this consumer accepts only the fixed small event fields and does not copy a large input body. Query cursors must match `n1:<vault_uuid>:<principal_uuid>:<high_watermark>:<after_sequence>`, ASCII length <=128 bytes, canonical lowercase UUIDv4 values, canonical decimal nonnegative safe integers without leading zeroes (except `0`). `after_sequence <= high_watermark` is required. Cursor owner mismatch, invalid bounds, or a cursor from another query contract returns `CURSOR_STALE`.

## PS-103-02.R03 — rejection and privacy cases

Malformed IDs/revisions, wrong owner, locked vault, invalid source state, unsupported event/version, policy unavailability, cap exhaustion, unknown localization key and schema mismatch each follow the typed outcomes in [commands and errors](commands_queries_events.md). No user-controlled string may enter a banner, accessibility label or log. Quiet-hour boundaries use the preference resolver's advisory local decision; clock skew cannot cause a claim about remote deadline or delivery. The notification view's CAS revision must be a positive safe integer; expected revision must exactly match the row before mutation. Sequence allocation must be within the positive safe-integer range; exhaustion fails with `RATE_LIMITED_LOCAL` and a typed field reason, never wraps.

## Acceptance mapping

- `TEST-PS-103-02`: allowlist positive/negative corpus; cross-vault/principal injection; unsupported aliases/version; altered duplicate event ID; locked/unavailable store; preference disabled/unavailable/quiet; invalid timestamp and maximum-size cases; payload canaries never rendered or retained. No product tests are claimed.
