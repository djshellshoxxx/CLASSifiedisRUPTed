# PS-109-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-109-03. **Owner:** [14_Accessibility/01_a11y/mod_keyboard](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_keyboard. **Consumers:** F07 (account deletion and suspension events), F10 (export and retention jobs), F15 (event envelope, outbox), F16 (capability denial); client keyboard runtime (PS-109-06 for queue behavior).

## Purpose and scope
Define the server lifecycle of one keyboard preference profile and the client sync sub-states that govern how local edits reach the server. Two machines are defined: the canonical server machine (authoritative) and the device sync machine (non-authoritative, offline-capable, per [D08](../../../DECISIONS.md)).

**Business outcome:** a profile is created on first change, changes are applied in a fixed order, and deletion is final for that profile id.

**Exclusions:** no workflow for feature actions (listing or trade flows) that shortcuts invoke; no moderation states; no suspension logic of its own (owned by F07/F16).

## Requirements
- **PS-109-03.R01** — Outcome: a profile moves only through the transitions in R04; every transition emits exactly one versioned event (PS-109-04) and writes one revision row (PS-109-01).
- **PS-109-03.R02** — Cases: normal (create, update, reset, delete); invalid (write to deleted profile); expired (queued write older than 7 days, A-KBD-06); duplicate (replayed write); concurrent (two devices, same revision); offline (queue on device); adversarial (write after account deletion; write from suspended account).
- **PS-109-03.R03** — Budgets: a server transition completes within the write budget (300 ms p95, PS-109-08). Device queue flush starts within 2 s of connectivity returning. Keyboard operation of every state-dependent prompt (restore, discard, retry) is possible without a pointer.
- **PS-109-03.R04** — Server state table and transitions are defined below.
- **PS-109-03.R05** — Guards: caller holds `kbd.profile.write` (PS-109-05); account state is active (F07); `schema_version` and `catalog_version` supported (PS-109-02).
- **PS-109-03.R06** — Timeouts: server transaction 5 s (write) and 3 s (read); device in-flight write 5 s, then retry; queued write expires after 7 days (A-KBD-06); tombstone hard-delete after 30 days (A-KBD-08).

## Server state table: keyboard_preference_profile
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| NOT_CREATED (virtual; no row) | none; defaults served on read with `profile_id: null`, `revision: 0` | to ACTIVE on KeyboardProfileCreated | caller authenticated | no |
| ACTIVE | KeyboardProfileCreated (revision 1), KeyboardProfileUpdated, KeyboardProfileReset | to ACTIVE (update, reset); to DELETED (user delete or F07 cascade) | write requires R05 guards; read requires owner | no |
| DELETED | KeyboardProfileDeleted or KeyboardProfileCascadeDeleted | none for this profile_id | none | yes |

A new profile for the same account after DELETED gets a new `profile_id`. The old id is never reused.

## Device sync state table (per profile, per device)
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| LOCAL_CLEAN | last queued write acked, or fresh load | to PENDING on local edit | none | no |
| PENDING | local edit enqueued | to IN_FLIGHT when online; to ABANDONED per write on expiry | queue length <= 50 (A-KBD-06) | no |
| IN_FLIGHT | write sent with idempotency key | to LOCAL_CLEAN on ack (queue empty); to PENDING on ack (queue not empty), network error or timeout; to CONFLICTED on 409; to LOCAL_CLEAN with user notice on definitive 4xx | single in-flight write per profile | no |
| CONFLICTED | 409 KEYBOARD_REVISION_CONFLICT | to PENDING on user reapply (new write, `expected_revision` = server revision); to LOCAL_CLEAN on user discard | user must choose; no automatic merge | no |
| ABANDONED | expiry (7 days) or user discard of a queued write | none for that queued write; a user retry creates a new queued write with a new idempotency key | write is removed from queue | yes (per queued write) |

## Transition details
| # | From | Trigger | Guard | To | Side effect |
|---|---|---|---|---|---|
| T01 | NOT_CREATED | PUT with first valid patch | R05 | ACTIVE | insert profile rev 1; event KeyboardProfileCreated |
| T02 | ACTIVE | PATCH valid | R05; expected_revision matches | ACTIVE | rev+1; event KeyboardProfileUpdated |
| T03 | ACTIVE | POST reset | R05; expected_revision matches | ACTIVE | restore defaults; rev+1; event KeyboardProfileReset |
| T04 | NOT_CREATED | POST reset | R05 | NOT_CREATED | no-op; no revision, no event |
| T05 | ACTIVE | DELETE | R05 | DELETED | clear focus_indicator, shortcut_hints, bindings; set deleted_at; purge history rows; event KeyboardProfileDeleted |
| T06 | ACTIVE | F07 AccountDeleted | F07 event verified (CTR-EVT-001 signature not required, internal) | DELETED | same as T05 with source `system_account_deleted` |
| T07 | ACTIVE | write with stale expected_revision | any | ACTIVE | reject KEYBOARD_REVISION_CONFLICT; no change |
| T08 | DELETED | any write | any | DELETED | reject KEYBOARD_PROFILE_DELETED |
| T09 | ACTIVE | write from suspended account | F07 state suspended | ACTIVE | reject KEYBOARD_FORBIDDEN; reads still allowed for export |

## Device transitions
- Concurrency rule: exactly one write per profile is IN_FLIGHT per device. Writes are sent in local enqueue order.
- Retry rule: on network error or timeout, the same write is re-sent with the same idempotency key (PS-109-06). The server replays the stored result if it already committed.
- Conflict rule: a 409 never auto-merges. The user chooses reapply or discard through a keyboard-operable dialog (PS-109-03 R03).
- Offline rule: edits while offline move LOCAL_CLEAN to PENDING and the UI shows the local values with a visible "not yet saved" status.
- Recovery rule: on app start, a device with PENDING writes resumes IN_FLIGHT flush; a device in CONFLICTED shows the conflict dialog again until the user acts or the queued writes expire.

## Open decisions
- A-KBD-06 (queue expiry 7 days, queue max 50), A-KBD-08 (tombstone 30 days). D08 (offline writes) remains OPEN at the program level; this file assumes queue-until-ack as its recommended default.

## Acceptance criteria
- Every server state has exactly one entry event; every transition T01–T09 has one test in PS-109-09.
- No state other than DELETED is terminal for the profile; no path from DELETED back to ACTIVE for the same profile_id.
- Device machine never marks a write as saved before server ack.
