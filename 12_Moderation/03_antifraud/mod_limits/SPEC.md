# F12.S03.M04 — Account limits

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-098-01…PS-098-10. **Code:** `packages/moderation/src/antifraud/limits`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Graduated per-key limits that a relay applies to what it hosts: listings per day, open offers, open cycle proposals, bids per day and new conversations per day. Limits rise with the key's age on that relay and its completed dealings, drop by a fixed factor at medium or high risk (friction, never a ban), and can be overridden by that relay's moderators with a reason and an expiry. Limits exist only per relay; a key's standing on one relay says nothing about another, and the vault never reports limits to anyone.

## Responsibilities

- Own the AccountLimit record per (relay, key, limit key) with tier, base value, multiplier, effective value and override.
- Derive tiers (new, established, trusted) from time first seen on this relay and completed dealings, using documented thresholds.
- Answer limit checks for the relay command bus, using F12.S03.M03 for flow limits and caller-supplied counts for stock limits.
- Apply the risk multiplier (medium 0.75, high 0.5, never below 1) and moderator overrides with reason, bound and expiry, and emit moderation.limit.changed.

## Not responsible for

- Rate limiting of requests (F12.S03.M03) and risk scoring (F12.S03.M01).
- Suspension and removal (F12.S02.M01).
- Reputation computation (F07.S03.M01); only completed-dealing counts are consumed.
- Future: limits negotiated between relays by signed attestation; per-category limits.

## User stories

- As a new member of a relay, I see exactly how many listings and offers I can have and how I move up (for example 'after 7 days and 3 completed deals').
- As a relay moderator, I can raise a trusted seller's limit for 30 days with a recorded reason.
- As a member whose limit was lowered by a risk level, I see the reason and when it is expected to recover.

## Edge cases

- Moderator lowers a limit below the member's current open count; existing items stay, new ones are refused with ACCOUNT_LIMIT_REACHED until the count drops.
- Override expires while the member is at the higher count; nothing is deleted, new items are refused until under the lower limit.
- Member moves to a different relay; the new relay starts them at tier new, and says so on the limits screen.
- Risk level changes twice within a minute; the effective limit follows the latest assessment and emits one limit.changed event per distinct effective value.
- Tier thresholds change by operator policy; existing keys are re-tiered at the next daily sweep and never lose more than one tier per sweep.
- A key with no first-seen record (restored relay); the tier defaults to new and first-seen is set to restore time.

## UX and accessibility

- My limits (relay member): table of limit, used, allowed, tier, active adjustments with reasons, and the next tier requirements.
- Limit reached sheet: which limit, current usage, when it resets or what to do (finish or archive an item), no hidden penalty wording.
- Moderator limit override form: key, limit, value (0..10 000), reason (10..500 characters), expiry (max 90 days).

**States:** loading; within-limit; near-limit; at-limit; adjusted-by-risk; overridden

**Accessibility:** Usage is shown as text 'used of allowed' plus a progress element with an accessible name.; Limit reached messages are announced in an aria-live assertive region once.; Override form fields have labels and errors linked with aria-describedby.

## Owned data

- `AccountLimit` (classrup.moderation.accountlimit/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `moderation.accountlimit.override`, `moderation.accountlimit.clear_override`
- Queries: `moderation.accountlimit.check`, `moderation.accountlimit.list_mine`
- Emits: `moderation.limit.changed`
- Consumes: `moderation.risk.elevated`, `commerce.deal.completed`, `identity.account.created`, `moderation.action.applied`

## Dependencies

F12.S03.M01, F12.S03.M03, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-098-01 | [Domain schema](domain_schema.md) | 3 |
| PS-098-02 | [Validation rules](validation_rules.md) | 3 |
| PS-098-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-098-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-098-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-098-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-098-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-098-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-098-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-098-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/limits/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- [object Object]
- Effective values follow the published tier table and multipliers exactly.
