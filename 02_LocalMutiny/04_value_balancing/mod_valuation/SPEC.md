# F02.S04.M03 — Participant valuation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S04](../SPEC.md). **Process IDs:** PS-027-01…PS-027-10. **Code:** `packages/mutiny/src/value_balancing/valuation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Each owner declares what an item is worth to them as a Money amount with a basis and an optional reference taken from the listing's asking price. The local ItemValuation record (classrup.mutiny.item_valuation/v1, P2) holds flags and lock state; only a whitelisted signed public projection (classrup.mutiny.item_valuation_projection/v1) is published, after privacy.consent.check(federation_publish), so that matching and other participants can compare values. Implausible values (below 20 percent or above 500 percent of a same-currency reference) are flagged automatically and only these automatic flags exclude the item everywhere; a participant of a subject in which the owner already signed consent or the reservation can flag the item to the owner, which blocks only that subject until the owner acknowledges with a short justification or redeclares. ClassRup never appraises items: values are the declarer's claims, they feed the MNY-5 tolerance checks and they never imply a market price.

## Responsibilities

- Own the ItemValuation record per owned item with Money amount, basis, optional note and reference price, plausibility verdict and status.
- Publish the owner's valuation as a signed projection classrup.mutiny.item_valuation_projection/v1 containing only the whitelisted fields, with a per-author sequence chain, after privacy.consent.check(federation_publish) per selected relay (N6), and verify and store other owners' valuation projections.
- Detect implausible values against the listing's asking price (same currency only) and exclude automatically flagged items from matching and commit everywhere until acknowledged.
- Accept flags only from participants of a non-terminal subject that includes the item and in which the owner has already signed consent or the reservation, scope each peer flag's block to the flagger's subject, cap flag-triggered state changes at one per item per 30 days, deliver flags to the owner as signed statements, and freeze valuations of items under an active own reservation.
- Register the module's export section, deletion and retention purge handlers with F10 (N6) and classify every field (F10.S02.M02).

## Not responsible for

- Appraisal, price guidance or market data; the platform never states what an item is worth.
- Currency conversion and quote pinning (F02.S04.M02) and tolerance comparison (F02.S02.M05).
- Listing price terms (F01.S02.M01) and listing content moderation, which is local filtering plus relay hosting policy (ADR-0016).
- Future: valuation history charts, optional external price reference adapters, and bundled-item valuations.

## User stories

- As an owner, I declare that my guitar is worth 120.00 EUR to me, see how that compares with my listing's asking price, and know that others will see this declared value.
- As a participant in a proposal in which the owner has already signed, I can flag a value that looks wrong and the owner is asked to explain or change it before our exchange proceeds.
- As an owner whose value was flagged, I acknowledge it with a short reason or redeclare it.

## Edge cases

- The declared value is 10 percent of the listing's asking price; it is flagged low automatically and the item is excluded from matching until the owner acknowledges.
- The listing price is in a different currency than the declaration; no ratio is computed, plausibility is unchecked and the UI says so.
- The item is reserved for a committed cycle; changing the value is refused so the consented terms stay true.
- Three different participants flag the same item within a day; only the first changes state for its own subject, further flags are counted and stored but do not change state, and at most one flag-triggered state change per item happens per 30 days.
- Mallory sends Alice a proposal naming Alice's item and flags it at once; Alice never signed consent or a reservation in that subject, so the flag is refused and the item stays usable.
- A peer flag in subject S1 is open; the item still matches and can be consented in subject S2, because a peer flag blocks only the flagger's subject.
- The member has not granted federation_publish for a selected relay; the projection is not sent there and the UI says so.
- A peer valuation projection arrives with a lower seq than the stored one; it is ignored and counted.
- The owner declares 0 or a negative amount; refused. Gift items use giveaway listings, not valuation.
- The owner changes the listing price after declaring; plausibility is re-evaluated against the new reference and may flag or clear the automatic flag.

## UX and accessibility

- Declare value sheet: amount and currency, basis selector (retail estimate, purchase price, replacement cost, other), note up to 280 characters, reference price shown when the listing has one, and the notice 'Visible to anyone who sees your listing. This is your own estimate, not an appraisal.'
- Flag value sheet for participants: reason choices (too high, too low, unclear) and optional comment.
- Flagged-value banner for the owner with Acknowledge (reason required) and Change value.

**States:** loading; empty; declared; flagged-auto; flagged-by-peer; acknowledged; locked-by-reservation; pending-offline; error

**Accessibility:** Amount field has a visible label including currency and uses inputmode decimal.; Flag and acknowledgement status are text banners announced via an aria-live polite region.; All buttons are at least 44 by 44 px and the sheets are keyboard operable.

## Owned data

- `ItemValuation` (classrup.mutiny.item_valuation/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `mutiny.valuation.declare`, `mutiny.valuation.flag`, `mutiny.valuation.acknowledge`, `mutiny.valuation.ingest`
- Queries: `mutiny.valuation.get`, `mutiny.valuation.list_mine`, `mutiny.valuation.list_for_items`
- Emits: `mutiny.valuation.declared`, `mutiny.valuation.flagged`
- Consumes: `bazaar.listing.edited`, `bazaar.sell_terms.set`, `bazaar.listing.unpublished`, `mutiny.cycle.locked`, `mutiny.cycle.unlocked`, `comms.consent.signed`, `comms.consent.received`, `mutiny.cycle.cancelled`, `mutiny.cycle.completed`, `mutiny.proposal.withdrawn`, `mutiny.proposal.rejected`, `privacy.consent.withdrawn`, `privacy.deletion.completed`

## Dependencies

F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F07.S02.M02, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-027-01 | [Domain schema](domain_schema.md) | 4 |
| PS-027-02 | [Validation rules](validation_rules.md) | 3 |
| PS-027-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-027-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-027-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-027-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-027-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-027-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-027-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-027-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/value_balancing/valuation/index.ts`.

## Acceptance criteria

- All tests T01–T18 pass in CI.
- No module or screen presents a declared value as an appraisal or market price.
- A reserved item's value cannot change and flagged values block matching and consent until acknowledged or redeclared.
