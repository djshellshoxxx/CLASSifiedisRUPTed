# F12.S03.M04 — Account limits

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F12.S03](../SPEC.md). **Process IDs:** PS-098-01…PS-098-10. **Code:** `packages/moderation/src/antifraud/limits`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Graduated per-key limits that a relay applies only to resources it can observe itself: index writes of signed public projections it hosts (listings_per_day becomes index_writes_per_day), mailbox puts to recipient mailboxes the sender has not written to before, bids on auctions it hosts, and governance comments it accepts for a policy proposal (F18.S02.M01) from keys it first observed less than 7 days ago. Limits rise with the key's age since the relay's own first observation of it and with completed dealings counted only from completion statements that both parties voluntarily submit, drop by a fixed factor at medium or high risk and lift again as soon as the level drops (friction, never a ban), go to 0 while a restrict_feature action covers them, and can be overridden by that relay's moderators with a reason and an expiry. Offers and cycle proposals travel end to end encrypted between vaults, so caps on them are vault-local UX guards in F12.S03.M03. Limits exist only per relay; a key's standing on one relay says nothing about another, and the vault never reports limits to anyone.

## Responsibilities

- Own the AccountLimit record per (relay, key, limit key) with tier, base value, risk multiplier, action restriction, override and effective value.
- Derive tiers (new, established, trusted) from relay-clock time since first observation and completed dealings counted from voluntarily submitted two-party completion statements, using documented thresholds.
- Answer limit checks for the relay command bus in-process, using F12.S03.M03 flow buckets the relay itself consumed and never caller-supplied counts.
- Apply the risk multiplier (medium 0.75, high 0.5, never below 1) on every level rise and drop, action restrictions mapped from restricted capabilities, and moderator overrides with reason, bound and expiry, and emit moderation.limit.changed.
- [object Object]

## Not responsible for

- Rate limiting of requests and vault-local guards for open offers and open cycle proposals (F12.S03.M03), and risk scoring (F12.S03.M01).
- Suspension, removal and capability denial (F12.S02.M01 decides; F16.S01.M01 authorize() enforces suspensions).
- Reputation computation (F07.S03.M01); deals themselves (F09.S01.M01).
- Future: limits negotiated between relays by signed attestation; per-category limits.

## User stories

- As a new member of a relay, I see exactly how many listings I can index, how many new people I can message and how many bids I can place per day, and how I move up (for example 'after 7 days and 3 completed deals you chose to show this relay').
- As a relay moderator, I can raise a long-standing seller's limit for 30 days with a recorded reason.
- As a member whose limit was lowered by a risk level, I see the reason, and the limit returns as soon as the level drops.
- As a member, I may submit a completion statement both of us signed to count a deal towards my tier, knowing this tells the relay that we dealt.
- As a new member of a relay, I can comment once on each open policy proposal during my first 7 days there, and I see that this cap lifts when my key is 7 days old on that relay.

## Edge cases

- Moderator lowers a limit below the member's usage today; existing items stay, new index writes are refused with MODERATION_ACCOUNT_LIMIT_REACHED until the window resets.
- Override expires while the member is above the lower limit; nothing is deleted, new writes are refused until the window resets.
- Member moves to a different relay; the new relay starts them at tier new, and says so on the limits screen.
- Risk level changes twice within a minute; the effective limit follows the latest event and emits one limit.changed event per distinct effective value.
- Tier thresholds change by operator policy; existing keys are re-tiered at the next daily sweep and never lose more than one tier per sweep.
- A key with no first-seen record (restored relay); the tier defaults to new and first-seen is set to restore time.
- A caller passes currentCount 0 for a key that already used its limit; the field is refused with VALIDATION_FAILED and only the relay's own count is used.
- Two keys of the same person sign completion statements to each other to farm tier; counting refuses counterparties linked to the submitter's principal, counterparties first seen less than 7 days ago and more than one counted completion per pair in 30 days.
- A restrict_feature action covering federation.record.ingest is overturned on appeal; moderation.action.reverted clears the restriction and the limit returns with cause action_reverted.
- A key first seen 2 days ago posts a second comment on the same proposal; it is refused with RATE_LIMITED and retryAfterMs up to the key's 7-day mark, while its first comment on another proposal is accepted.
- Thirty keys first seen today each comment once on one proposal; the first 25 are accepted, the 26th and later get RATE_LIMITED from the proposal-wide new-key cap, and a key first seen 8 days ago is neither counted nor capped by it.

## UX and accessibility

- My limits (relay member): table of limit, used today, allowed, tier, active adjustments with reasons (risk level, action, override), and the next tier requirements.
- Limit reached sheet: which limit, current usage, when it resets or what to do, no hidden penalty wording.
- Count a completed deal (member): explanation that the relay learns the two keys dealt, preview of the completion statement fields sent (no amounts), submit.
- Moderator limit override form: key, limit, value (0..10 000), reason (10..500 characters), expiry (max 90 days).

**States:** loading; within-limit; near-limit; at-limit; adjusted-by-risk; restricted-by-action; overridden

**Accessibility:** Usage is shown as text 'used of allowed' plus a progress element with an accessible name.; Limit reached messages are announced in an aria-live assertive region once.; Override form fields have labels and errors linked with aria-describedby.

## Owned data

- `AccountLimit` (classrup.moderation.accountlimit/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `moderation.accountlimit.override`, `moderation.accountlimit.clear_override`, `moderation.accountlimit.submit_completion`
- Queries: `moderation.accountlimit.check`, `moderation.accountlimit.list_mine`
- Emits: `moderation.limit.changed`
- Consumes: `moderation.risk.elevated`, `moderation.risk.lowered`, `moderation.action.applied`, `moderation.action.reverted`, `identity.session.started`, `privacy.deletion.completed`

## Dependencies

F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-098-01 | [Domain schema](domain_schema.md) | 5 |
| PS-098-02 | [Validation rules](validation_rules.md) | 5 |
| PS-098-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-098-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-098-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-098-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-098-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-098-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-098-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-098-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/moderation/src/antifraud/limits/index.ts`.

## Acceptance criteria

- All tests T01–T22 pass in CI.
- No limit change is ever silent: each has a cause visible to the member on their limits screen.
- Effective values follow the published tier table, multipliers and restriction rule exactly, and no relay limit relies on a count the limited party supplied.
