# PS-103-01 — in-app notice schema

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-01 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-01.R01 — observable outcome and exclusions

The schema stores a generic reminder generated from one allowlisted, validated local event. It supports one active vault/principal's inbox and an explicit local read state. It does not store event prose, message content, addresses, payment material, preference settings, remote recipient state, or proof of remote delivery. The four approved event/key mappings and their exact local-only meanings are in the module [event allowlist](SPEC.md#event-allowlist-and-exact-display-meaning).

## PS-103-01.R02 — canonical version-1 record

A `LocalNoticeV1` is a local projection with exactly these fields; unknown fields are rejected:

| Field | Type / bound | Meaning |
|---|---|---|
| `schema_version` | integer, exactly `1` | Notice row schema. |
| `notice_id` | UUIDv4 string | Client-generated ID, unique only within this vault. |
| `vault_id`, `principal_id` | UUIDv4 strings | F15 vault and F07 local principal owner; never transported. |
| `source_event_id` | UUIDv4 string | F15 event that produced this notice. |
| `source_event_type` | one of the four exact CR-003 names | Closed source allowlist. |
| `source_event_version` | integer, exactly `1` | CR-003 event schema version. |
| `aggregate_id` | UUIDv4 string | Local aggregate reference from validated event metadata. |
| `aggregate_revision` | positive safe integer, `1..9,007,199,254,740,991` | Revision observed on the source event under CR-001, not a claim of current state. |
| `revision` | positive safe integer, `1..9,007,199,254,740,991` | Notice-row compare-and-swap revision; starts at 1 and increments by exactly 1 for each nonterminal mutation below MAX_SAFE_INTEGER. |
| `local_sequence` | positive safe integer, `1..9,007,199,254,740,991` | Monotonic insertion order allocated from this vault's counter in the same transaction as row/marker; no global ordering. |
| `category` | `listing` \| `reservation` \| `cycle` | Derived solely from event type. |
| `message_key` | one of four fixed keys in module SPEC | Localization lookup only; no interpolation values. |
| `target_ref` | UUIDv4 or `null` | Optional authorized local route target; defaults to `null` unless the target can be re-read under the active principal. |
| `created_at_ms` | nonnegative safe integer | Local advisory display/retention time; not trusted time. |
| `read_state` | `unread` \| `read` | Local presentation state. |
| `read_at_ms` | `null` or nonnegative safe integer | Present iff read; advisory local time. |

The canonical record is at most 4,096 UTF-8 bytes. It contains no copied source payload, correlation ID, causation ID, free text, key material, or digest of private text. Display title/body are resolved from the bundled locale catalog at render time and are not stored in the notice row.

## PS-103-01.R03 — collection bounds, ownership and retention

F15 stores records under `(vault_id, principal_id, notice_id)` and enforces that scope inside the transaction. The per-vault cap is 1,000 rows. F10 owns the policy value for retention; the proposed age cleanup is 30 advisory local days for read rows only. Unread rows require explicit user deletion, never age purge or cap eviction. If clock validity/order is uncertain, automatic age cleanup pauses. Dedupe markers live with the local event consumer cursor, not in public notice fields. No global uniqueness or remote backup is implied.

## Integrity constraints

The auxiliary NoticeSequenceStateV1 contains {schema_version: 1, vault_id, last_local_sequence, exhausted} and is initialized per vault to {last_local_sequence: 0, exhausted: false}. For each committed notice, F15 assigns last_local_sequence + 1 to the row and updates this state atomically with the notice and event marker. When the maximum safe integer is assigned, set exhausted=true and retain the maximum value; never overflow or wrap. The tuple (vault_id, principal_id, source_event_id) and local_sequence are each unique within the vault. source_event_type maps to category/message_key through a fixed table. unread requires read_at_ms=null; read requires a timestamp. Row revision is a compare-and-swap token. Successful unread-to-read mutation increments it once when below MAX_SAFE_INTEGER; if already at MAX_SAFE_INTEGER, a matching-CAS already-read operation is a no-op, while an unread-to-read mutation fails without wrapping. Delete always remains available with a matching expected revision: below MAX_SAFE_INTEGER it records the incremented value in a content-free deletion marker; at MAX_SAFE_INTEGER it records that same final value without incrementing. Stale expected revision returns REVISION_CONFLICT. Repeated processing cannot change the original notice ID or source references. target_ref is null rather than exposing an inaccessible object. Sequence exhaustion, and revision exhaustion for nonterminal mutations only, return RATE_LIMITED_LOCAL with Problem field_errors [{path, code}], retryable=false; codes are SEQUENCE_EXHAUSTED or REVISION_EXHAUSTED. Revision exhaustion applies to nonterminal mutation only; it does not block authorized deletion. Terminal delete remains available at maximum revision and never wraps or resets. Schema upgrades require F15 migration review; unknown versions quarantine rather than coerce.

## Acceptance mapping

- `TEST-PS-103-01`: exact required/unknown-field validation, type/bound limits, UUID and safe-integer boundaries, tuple uniqueness, read timestamp invariants, message key/event mapping, 4,096-byte and 1,000-row caps, and absence of private payload fields. These are future test oracles; no test has run.
