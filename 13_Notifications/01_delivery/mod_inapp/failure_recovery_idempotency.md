# PS-103-06 — failure recovery and idempotency

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-06 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-06.R01 — failure model

Failures include duplicate/out-of-order local event delivery, tab races, transaction abort/quota, locked or unavailable vault, unavailable preference/capability resolver, corrupt schema, cursor mismatch, restoration fork, and volatile-memory loss. None may be converted into a remote delivery success or inferred user consent.

## PS-103-06.R02 — dedupe and atomic recovery

The unique local key is `(consumer_id="F13.inapp.v1", source_event_id)` within one vault/principal. In one F15 transaction: re-read the marker and current revision, recheck capability/policy, insert at most one row, apply permitted pruning, and persist marker/cursor. A transaction abort leaves all of these unchanged. Replayed identical events return the recorded local outcome. If an event ID is reused with conflicting event type/version/aggregate reference, keep the original row, quarantine the conflicting source, and return `CONFLICT_QUARANTINED`.

Commands use CR-002 idempotency `(vault_id, principal_id, operation, command_id)`. For an active receipt, same canonical request bytes returns the original receipt; changed bytes returns `IDEMPOTENCY_MISMATCH`. CR-002 deleted-scope behavior takes precedence: after a deletion marker exists, any replay payload returns `OBJECT_DELETED` without comparing bytes or returning original request/receipt content. Do not silently mint a fresh command ID after an unknown outcome. Read/delete and cursor advancement cannot race past `expected_revision`; retry after `REVISION_CONFLICT` requires a fresh query and explicit user action. Row revision begins at 1 and increments once for each committed nonterminal mutation below MAX_SAFE_INTEGER. After receipt/marker lookup, authorization and CAS check, matching already-read is a no-op even at maximum; only unread-to-read mutation at maximum revision returns `RATE_LIMITED_LOCAL` / `revision: REVISION_EXHAUSTED`, retryable=false. Authorized delete still succeeds with matching expected_revision at maximum; it records that max as the content-free final-revision marker without incrementing. Per-vault local sequence increments once per committed notice in the same transaction as row and event marker; it never resets or wraps. Sequence exhaustion returns `RATE_LIMITED_LOCAL` / `local_sequence: SEQUENCE_EXHAUSTED`, retryable=false.

## PS-103-06.R03 — recovery outcomes

- `VAULT_LOCKED`, `STORAGE_UNAVAILABLE`, or `POLICY_UNAVAILABLE`: show a local unavailable state; do not advance source cursor or claim persistence.
- `STORAGE_QUOTA_EXCEEDED` or logical cap: prune read rows under the approved policy; if still full, pause at the pending event and return `RATE_LIMITED_LOCAL`.
- Corrupt/unknown schema or restore disagreement: quarantine, stop writes for the affected inbox and require reviewed repair; never choose latest timestamp/arrival or replay blindly.
- Volatile mode: explicitly transient, no durable receipt/read state, clear on lock/reload/close. Reopening may not recover those notices.
- Lost/evicted local storage: disclose possible loss; no product backup or cross-device recovery is promised.

## Acceptance mapping

- `TEST-PS-103-06`: crash/fault injection before and after each transaction step; same/different command retry; duplicate event; event-ID conflict; quota; independent tab races; schema migration failure; restore fork; memory-mode loss. No actual recovery tests have run.
