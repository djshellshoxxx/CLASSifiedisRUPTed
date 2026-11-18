# F13.S02.M04 — in

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F13.S02 preferences](../SPEC.md).

## Purpose and business behavior
Own the in-app inbox policy for each account: which notification categories are recorded in the inbox, how long items are kept, how many are kept, how items are grouped by object, and what counts as unread. The inbox is the durable record of notifications; push and email are interruptions that can be missed. Inbox recording is not gated by delivery windows or quiet pauses. The delivery and rendering of inbox items is owned by F13.S01.M03 (mod_inapp).

## User stories
- As a participant, I can keep a 30-day inbox of deadline and activity notices while turning off activity notices entirely.
- As a participant, I can see unread counts for each cycle or listing I am involved in.
- As a participant, I can archive or clear items without losing security notices.

## Scope
- In scope: category inclusion, retention, cap, grouping by object, read and archive state, pruning.
- Out of scope: the rendered UI (mod_inapp), interruptions (mod_push, mod_email, mod_hours, mod_quiet), consent (mod_opt).

## Public interfaces
Commands `inbox.set_preferences`, `inbox.mark_read`, `inbox.archive`; queries `inbox.list`, `inbox.unread_count`; events `inbox_preference.updated` and `notification.*`. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: notification records (F13, `ntf_`); channel consent (mod_opt); windows and pauses (mod_hours, mod_quiet) are not inputs to projection. Downstream: mod_inapp renders items. Object references use CTR-ID-001 prefixes (`cyc_`, `lst_`, `dsp_`). Contracts: CTR-EVT-001, CTR-ERR-001, CTR-CAP-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns `inbox_preference` (`inp_`, PENDING) and the inbox projection policy. Owns no notification content; `ntf_` records remain F13 records.

## Risk considerations
- Privacy: inbox reveals activity on objects; group keys must not reveal object IDs to anyone without the HMAC key.
- Abuse: inbox flooding; harassment via repeated object mentions; blocked senders.
- Correctness: retention and cap pruning must not delete items the user has not seen when they expected to keep them; state must be explained when items vanish.
- Accessibility: unread state must not be color-only.
- No platform custody of money; inbox items about payments say "claimed" until confirmed (CTR-COM-001).

## Completion criteria
Process specs PS-106-01 to PS-106-10 at SPEC-DRAFT-COMPLETE; PENDING prefix resolved; Privacy Lead review pending.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-106-01
- [x] [validation_rules.md](validation_rules.md) — PS-106-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-106-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-106-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-106-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-106-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-106-07
- [x] [observability_performance.md](observability_performance.md) — PS-106-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-106-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-106-10
