# F08.S02.M01 — In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S02](../SPEC.md). **Process IDs:** PS-063-01…PS-063-10. **Code:** `packages/comms/src/negotiation/offers`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Structured offer and proposal cards inside conversation threads. A card is a signed reference to a record owned by another module (a bazaar offer, a negotiation counter, or a mutiny proposal revision) pinned to its exact revision hash; it is a view, never the canonical record. The sender's vault posts the card as an encrypted message item, the receiving vault verifies the signed reference against the referenced statement it already holds, renders live state derived from local events, and marks the card superseded or closed when the owning module reports a newer revision or a terminal state. Cards carry no money movement and no consent; accepting happens in the owning module and consent in F08.S02.M02.

## Responsibilities

- Own the ThreadOfferCard record (kind, reference ID, pinned revision hash, thread, poster) inside the vault.
- Post a card into a thread as a signed statement carried by an end-to-end encrypted message of F08.S01.M01.
- Verify inbound cards against the referenced statement and the poster's role in it; show unverifiable cards as unverified references with the reason.
- Keep each card's displayed state in step with the owning module's local events and mark older cards superseded when a newer revision of the same reference is posted.
- Never copy amounts, items or terms into the card beyond a display snapshot of at most 280 characters tagged as a snapshot.

## Not responsible for

- Creating, accepting, rejecting or expiring offers (F01.S04.M01) and counters (F01.S04.M02).
- Creating, revising or accepting proposals and cycles (F02).
- Signed consent on an exact revision (F08.S02.M02).
- Message transport and encryption (F08.S01.M01) and thread membership (F08.S01.M02).
- Future: cards for service quotes (F03), rental reservations (F05), and auction bids hosted on a relay (F04).

## User stories

- As a buyer, I can attach my offer to the conversation so the seller sees it as a card with the amount, status and an Open offer button.
- As a seller, I see that a card is outdated when the buyer changed the offer, and I am pointed to the newest card.
- As a cycle participant, I can post the proposal revision I am discussing and others see the exact revision it points to.
- As a recipient, I see a clear notice when a card refers to a record my device cannot verify.

## Edge cases

- Card references an offer revision the receiving vault has not received yet; the card shows waiting for record and retries when the statement arrives, for up to 7 days, then shows unverified.
- Poster is not a party to the referenced offer or proposal; the card is quarantined as unverified and no state is shown.
- Same offer posted twice into one thread; the second card supersedes the first when its revision is newer, otherwise it is ignored as a duplicate.
- Referenced offer is accepted on another device while the card is open; the card turns closed (accepted) after the local event arrives and offers no action buttons.
- The pinned revision hash does not match the statement the vault holds for that revision; the card shows revision mismatch and is not actionable.
- The thread is archived; cards become read-only and keep their last verified state.

## UX and accessibility

- Thread card: kind label (Offer, Counter, Proposal), snapshot line marked as snapshot at posting time, live status chip, Open record button.
- Post card sheet: picker listing the user's open offers or proposals involved in this thread, preview, Post button.
- Unverified card state: explanation and a Copy reference button; no action buttons.

**States:** loading; empty; waiting-for-record; posted; superseded; closed; unverified; offline

**Accessibility:** Each card is a landmark region with an accessible name made of kind, counterparty pseudonym and status.; Status changes are announced in an aria-live polite region and never conveyed by color alone.; The Open record button has an accessible name including the kind and is at least 44 by 44 px.

## Owned data

- `ThreadOfferCard` (classrup.comms.offer_card/v1, P2, RET-STANDARD)

## Interfaces

- Commands: `comms.offer_card.post`
- Queries: `comms.offer_card.list_thread`
- Emits: `comms.offer_card.posted`
- Consumes: `bazaar.offer.accepted`, `bazaar.offer.rejected`, `bazaar.offer.withdrawn`, `bazaar.offer.expired`, `bazaar.negotiation.countered`, `bazaar.negotiation.closed`, `mutiny.proposal.revised`, `mutiny.proposal.accepted`, `mutiny.proposal.rejected`, `mutiny.proposal.expired`, `comms.thread.archived`

## Dependencies

F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-063-01 | [Domain schema](domain_schema.md) | 3 |
| PS-063-02 | [Validation rules](validation_rules.md) | 3 |
| PS-063-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-063-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-063-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-063-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-063-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-063-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-063-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-063-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/negotiation/offers/index.ts`.

## Acceptance criteria

- All tests T01 to T13 pass in CI.
- No card ever shows accepted or closed unless a verified owning-module statement exists locally.
- A relay database dump after test traffic contains no card or offer data.
