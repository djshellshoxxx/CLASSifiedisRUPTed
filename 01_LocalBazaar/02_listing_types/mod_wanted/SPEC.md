# F01.S02.M02 — Wanted listing type

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F01.S02](../SPEC.md). **Process IDs:** PS-007-01…PS-007-10. **Code:** `packages/bazaar/src/listing_types/wanted`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Lets a member post what they are looking for: category, keywords, the minimum acceptable condition, quantity, an optional maximum budget and whether they would barter. The WantSpec is attached to a wanted-kind listing. It becomes matchable (event bazaar.want.declared) when the listing is published, pauses while the listing is unpublished or expired or its needed-by date has long passed, and feeds local barter matching and relay matching over public projections. The maximum budget is private by default and is absent from the projection and from relay matching unless the owner switches budgetVisible on. Every edit of a published want is recorded as a listing revision so the owner sees unsent changes.

## Responsibilities

- [object Object]
- Keep the budget private by default; include it in the projection only when budgetVisible is true.
- Track the want lifecycle (draft, open, paused, fulfilled, withdrawn) driven by listing publication, expiry and close events, the needed-by date and owner actions.
- [object Object]
- Record each want edit of a published listing as a listing revision (source wanted_spec) through F01.S01.M02.
- Register the F10 privacy ports for WantSpec and classify every field (N6).

## Not responsible for

- Creating the wanted listing record (F01.S01.M01) and publishing it (F01.S01.M03).
- Cycle matching and proposals (F02); this module only declares wants.
- Search over other people's wants (F06 relay and local index over signed projections).
- Currency registry (F09.S03.M01) beyond checking that the budget currency is registered and within the per-currency cap of F09.S03.M03.
- Future: wants with attached reference photos and recurring wants.

## User stories

- As a buyer, I post that I want a used road bike in good condition or better within 25 km and keep my maximum budget private.
- As a trader, I mark my want as barter-acceptable so the matcher can include it in swap cycles.
- As a member, I mark my want fulfilled and it stops appearing in matches.
- As a member, when my wanted listing expires and I publish it again, my want is matchable again without re-entering it.

## Edge cases

- Budget currency not registered; BAZAAR_WANT_CURRENCY_UNKNOWN is returned.
- Owner publishes the wanted listing, then unpublishes it; the want pauses and stops being matchable until republished.
- The wanted listing expires; the want pauses, and publishing the listing again reopens it and emits bazaar.want.declared again.
- Keywords include a prohibited term; publication is blocked by the listing publication module, and the want stays draft.
- Owner sets budgetVisible true after publishing; the change is recorded as a listing revision, shows unsent changes, requires a new signed projection and warns that fetched copies of earlier versions remain private.
- Two devices of the same owner mark the want fulfilled and withdrawn at once; the second gets CONFLICT_STATE.
- The wanted listing is unpublished and then closed with reason fulfilled; the paused want becomes fulfilled instead of failing with CONFLICT_STATE.
- neededBy passed 8 days ago; the sweep pauses the want and asks the owner to extend or withdraw; extending neededBy reopens it while the listing is published.

## UX and accessibility

- Want form: category, keywords as chips (max 10), minimum condition selector (new, like new, good, fair, poor, for parts), quantity, max budget with a private toggle and explanation, barter switch with note, distance bucket, needed-by date.
- My wants list with status chips and actions Mark fulfilled, Withdraw and Extend needed-by.

**States:** loading; empty; saving-local; saved-local; unsent-changes; open; paused; fulfilled; withdrawn; conflict

**Accessibility:** Keyword chips are removable by keyboard and have accessible names including the keyword.; The budget privacy toggle states its effect in text next to the control.; Status changes are announced in an aria-live polite region; buttons are at least 44x44 px.

## Owned data

- `WantSpec` (classrup.bazaar.want_spec/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `bazaar.want.define`, `bazaar.want.mark_fulfilled`, `bazaar.want.withdraw`
- Queries: `bazaar.want.get`, `bazaar.want.list_open`
- Emits: `bazaar.want.declared`, `bazaar.want.withdrawn`, `bazaar.want.fulfilled`
- Consumes: `bazaar.listing.published`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `bazaar.listing.closed`, `bazaar.listing.archived`, `bazaar.listing.deleted`

## Dependencies

F01.S01.M01, F01.S01.M02, F18.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-007-01 | [Domain schema](domain_schema.md) | 3 |
| PS-007-02 | [Validation rules](validation_rules.md) | 4 |
| PS-007-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-007-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-007-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-007-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-007-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-007-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-007-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-007-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/bazaar/src/listing_types/wanted/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI.
- Budget never appears in events, logs, projections or relay matching unless the owner turned budgetVisible on.
- A want is open only while its listing is published, under duplicated and out-of-order events, and a want whose listing is published again is matchable again.
