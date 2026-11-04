# F01.S02.M02 — Wanted listing type

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S02](../SPEC.md). **Process IDs:** PS-007-01…PS-007-10. **Code:** `packages/bazaar/src/listing_types/wanted`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Lets a member post what they are looking for: category, keywords, acceptable conditions, quantity, an optional maximum budget and whether they would barter. The WantSpec is attached to a wanted-kind listing. It becomes matchable (event bazaar.want.declared) when the listing is published, and feeds local barter matching and relay matching over public projections. The maximum budget is private by default and is never published unless the owner switches budgetVisible on.

## Responsibilities

- [object Object]
- Keep the budget private by default; include it in the projection only when budgetVisible is true.
- Track the want lifecycle (draft, open, paused, fulfilled, withdrawn) driven by listing publication events and owner actions.
- [object Object]

## Not responsible for

- Creating the wanted listing record (F01.S01.M01) and publishing it (F01.S01.M03).
- Cycle matching and proposals (F02); this module only declares wants.
- Search over other people's wants (F06 relay and local index over signed projections).
- Currency registry (F09.S03.M01) beyond checking that the budget currency is registered.
- Future: wants with attached reference photos and recurring wants.

## User stories

- As a buyer, I post that I want a used road bike in good condition within 25 km and keep my maximum budget private.
- As a trader, I mark my want as barter-acceptable so the matcher can include it in swap cycles.
- As a member, I mark my want fulfilled and it stops appearing in matches.

## Edge cases

- Budget currency not registered; BAZAAR_WANT_CURRENCY_UNKNOWN is returned.
- Owner publishes the wanted listing, then unpublishes it; the want pauses and stops being matchable until republished.
- The wanted listing expires; the want is withdrawn with reason expired and the matching engine receives the withdrawal event.
- Keywords include a prohibited term; publication is blocked by the listing publication module, and the want stays draft.
- Owner sets budgetVisible true after publishing; this is a material edit that requires a new signed projection and shows a warning that fetched copies of earlier versions remain private.
- Two devices of the same owner mark the want fulfilled and withdrawn at once; the second gets CONFLICT_STATE.

## UX and accessibility

- Want form: category, keywords as chips (max 10), acceptable conditions, quantity, max budget with a private toggle and explanation, barter switch with note, distance bucket, needed-by date.
- My wants list with status chips and actions Mark fulfilled and Withdraw.

**States:** loading; empty; saving-local; saved-local; open; paused; fulfilled; withdrawn; conflict

**Accessibility:** Keyword chips are removable by keyboard and have accessible names including the keyword.; The budget privacy toggle states its effect in text next to the control.; Status changes are announced in an aria-live polite region; buttons are at least 44x44 px.

## Owned data

- `WantSpec` (classrup.bazaar.want_spec/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `bazaar.want.define`, `bazaar.want.mark_fulfilled`, `bazaar.want.withdraw`
- Queries: `bazaar.want.get`, `bazaar.want.list_open`
- Emits: `bazaar.want.declared`, `bazaar.want.withdrawn`, `bazaar.want.fulfilled`
- Consumes: `bazaar.listing.published`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.closed`, `bazaar.listing.archived`, `bazaar.listing.deleted`

## Dependencies

F01.S01.M01, F18.S01.M03, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-007-01 | [Domain schema](domain_schema.md) | 3 |
| PS-007-02 | [Validation rules](validation_rules.md) | 3 |
| PS-007-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-007-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-007-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-007-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-007-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-007-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-007-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-007-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listing_types/wanted/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- Budget never appears in events, logs or projections unless the owner turned budgetVisible on.
- A want is open only while its listing is published, under duplicated and out-of-order events.
