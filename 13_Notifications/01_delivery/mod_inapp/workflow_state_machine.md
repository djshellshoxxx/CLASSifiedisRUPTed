# PS-103-03 — event consumption and notice lifecycle

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-03 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-03.R01 — outcomes

Event handling produces exactly one of: `STORED_UNREAD`, `SUPPRESSED_BY_PREFERENCE`, `PENDING_RETRY`, `QUARANTINED`, or `CAP_PAUSED`. Only `STORED_UNREAD` creates a row. Suppressed events create no row. Every outcome is local to this event consumer and vault; none is a peer acknowledgment or user consent.

## PS-103-03.R02 — state transitions

**Consumer marker:** `UNSEEN -> PREFERENCE_CHECK -> STORED_UNREAD` or `SUPPRESSED_BY_PREFERENCE`. Preference/storage interruption returns to `PENDING_RETRY` with the cursor unchanged. Unsupported/malformed source data commits a terminal QUARANTINED rejection marker and source cursor advancement atomically for the exact F15 source_position, as specified in SPEC.md; this permits the next event after restart without raw payload retention or fabricated event ID. At capacity with no prunable read row, state becomes `CAP_PAUSED`; the source event remains pending until space is made or the user explicitly clears items.

**Notice row:** `UNREAD -> READ -> DELETED` or `UNREAD -> DELETED`. Read is explicit. Deleting an unread item requires `confirmation=true` and an explicit user confirmation; deleting a read item also uses the explicit delete command. Deletion is terminal. No transition returns deleted rows to unread or recreates them from duplicate event delivery. A mark-read retry with the same active F15 `command_id` and same canonical bytes returns its original receipt; a fresh command against an already-read row is an idempotent no-op. A conflicting revision returns `REVISION_CONFLICT`. If the command scope is already deleted, `OBJECT_DELETED` takes precedence for any replay payload and no receipt/body is returned.

The per-vault NoticeSequenceStateV1 counter, assigned local_sequence, event marker, created notice and any pruning happen in one F15 vault transaction. Its initial last_local_sequence is 0. Each stored notice gets last_local_sequence + 1; the counter advances only when the notice and marker commit. Suppressed events do not consume a sequence. Assigning 9,007,199,254,740,991 sets exhausted=true; the next notice fails with RATE_LIMITED_LOCAL / local_sequence: SEQUENCE_EXHAUSTED. The counter never wraps or resets. Row revision starts at 1 and increments exactly once for each committed nonterminal mutation below MAX_SAFE_INTEGER under compare-and-swap. After authorization and matching-CAS checks, an already-read row returns a no-op without increment even at MAX_SAFE_INTEGER. Only a genuine unread-to-read change at MAX_SAFE_INTEGER fails with RATE_LIMITED_LOCAL / revision: REVISION_EXHAUSTED, retryable=false. Delete remains available with the matching expected revision: below max it records the incremented final revision in a content-free marker; at max it records that same max revision without incrementing, then removes the row. A transaction abort rolls back row, marker, sequence and revision together. The consumer processes at most 100 source events per transaction, then yields to the UI. While the app is closed no transition is promised. On next unlock, persisted eligible local events may be caught up while the PWA is running; no live banner is replayed for an old event, only the generic inbox row.

## PS-103-03.R03 — storage loss, cap, and restoration

The 1,000-row cap is enforced atomically. If an insert would exceed it, prune oldest read rows by local_sequence only. Never evict unread rows automatically, including by age. If the cap remains full, return RATE_LIMITED_LOCAL, expose “Inbox full”, and leave the event pending until the user explicitly reads or deletes rows. The proposed 30-day age purge applies only to read rows; if local clock validity/order is uncertain, automatic age pruning pauses. If F15 persistence or preference resolution is unavailable, fail closed and do not acknowledge the source marker. In volatile mode, rows are tagged transient, displayed “This session only; not saved”, and cleared on reload/lock/close.

F15 restore must restore notice rows and their source-event consumer markers together or suppress the consumer until a consistent cursor is available. A mismatch is quarantined; the module never replays history blindly or fabricates catch-up delivery. Any user-cleared notice remains suppressed by the event marker while that source event remains replayable.

## Acceptance mapping

- `TEST-PS-103-03`: transition graph including explicit-confirmation `UNREAD -> DELETED`; abort at each transaction write; duplicate/reorder, two-tab race and restart; preference/storage retry; read-only pruning and unread cap pause; lock/restore mismatch; counter/revision increment and exhaustion; event marker/sequence/notice atomicity. Proposed behaviors only.
