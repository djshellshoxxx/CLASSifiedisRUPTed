# F07.S03.M01 — Reputation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S03](../SPEC.md). **Process IDs:** PS-058-01…PS-058-10. **Code:** `packages/identity/src/trust/reputation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Reviews and reputation computed locally from signed statements. A review is a signed statement (classrup.identity.review/v1) by one party about another that points to a completed transaction context and carries the counterparties' signatures over that completion (deal, cycle, booking or rental). Each vault verifies reviews it receives, then computes a ReputationSummary for any DID from the reviews it has seen - count, Bayesian average and per-type completed counts - with explicit Sybil dampening by author age, repetition, reciprocity and closed review islands. There is no central reputation store; the summary says how many sources it was built from and that reviews can be missing. Dampening slows manipulation; it cannot prevent it where creating identities is free (Douceur 2002).

## Responsibilities

- Open a ReviewWindow (30 days, claim-based) when a local completion event arrives for a context the principal took part in, listing the eligible author-subject pairs.
- Create, sign, withdraw and receive reviews; accept a received review only if its author and subject are parties of the completion proof and the proof carries both parties' signatures over the completion cid.
- Own ReputationSummary per subject DID and recompute it deterministically with the documented weights; emit identity.reputation.recomputed and identity.review.posted.
- Keep dampening honest and visible - show raw counts next to the Bayesian average and the number of sources.

## Not responsible for

- Producing completion evidence; the owning transaction modules emit completion events and sign completion statements (F09, F02, F03, F05).
- Attestations such as 'met in person' (F07.S03.M02) and relay-side moderation of reviews (hosting policy only).
- Identity proofing or deduplication of persons; no module can prove two DIDs are the same or different people.
- Future: commit-reveal double-blind reviews, vouching graphs, portable reputation proofs across relays, reputation-aware ranking.

## User stories

- As a buyer, after a completed deal I can rate the seller from 1 to 5, choose up to 3 tags and add a short comment; it is signed and sent to them and, if I choose, to my relays.
- As a seller, I see the reviews I received and my summary, with an honest note about how many sources it comes from.
- As a stranger evaluating a seller, I see the seller's rating with raw counts, completed-transaction counts and a note when most reviews come from new or tightly linked accounts.
- As a reviewer, I can withdraw my review with a signed tombstone.

## Edge cases

- A review refers to a completion with only one party's signature; it is quarantined with reason proof_incomplete and not counted.
- The same author reviews the same subject for the same context twice; the second is refused with IDENTITY_REVIEW_DUPLICATE.
- In a 4-party cycle only pairs connected by a leg may review each other; a review between non-adjacent parties is refused with IDENTITY_REVIEW_NOT_ELIGIBLE.
- A review is posted 40 days after completion; the author's vault refuses it, and a received review with a claimed time beyond the window plus 2 days of skew is quarantined.
- Two new accounts review each other five times; repeat and reciprocity factors reduce their weight to near the floor and the UI notes 'many reviews from linked accounts'.
- A burst of 30 positive reviews from accounts first seen locally in the last 3 days; they count in raw totals but contribute small effective weight.
- A reviewer's relay hides their review under hosting policy; other sources still carry it, and the summary shows the reduced source count.
- The subject deletes their vault; reviews they received exist in other vaults and relays; the product says reviews are statements by others and cannot be deleted by the subject.
- A review's comment contains a link or personal data; shown as plain text, reportable to the relay, and hideable locally.

## UX and accessibility

- Review sheet after completion: 1 to 5 star radio group, up to 3 tags, comment (500 chars), preview of what will be signed and where it will be sent, Send.
- Reputation card on a profile: Bayesian average to one decimal, raw review count, positive and negative counts, completed counts by type, 'based on N reviews from M sources seen by this device', dampening notice when applicable.
- Reviews list: author pseudonym with DID fingerprint, rating, tags, comment, context type, 'Hide for me' and 'Withdraw' (own).

**States:** loading; empty; eligible; posting; pending-offline; quarantined; withdrawn; error

**Accessibility:** Star rating is a native radio group with text labels such as '4 of 5', not colour or shape only, and targets of 44 by 44 px.; Reputation figures are real text with units, and dampening notices are announced via aria-live polite.; The comment counter announces remaining characters politely at 450, 490 and 500.

## Owned data

- `Review` (classrup.identity.review/v1, P1, RET-EVIDENCE)
- `ReputationSummary` (classrup.identity.reputation_summary/v1, P1, RET-STANDARD)
- `ReviewWindow` (classrup.identity.review_window/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `identity.review.post`, `identity.review.receive`, `identity.review.withdraw`, `identity.review.hide`
- Queries: `identity.reputation.get`, `identity.review.list_for_subject`, `identity.review.list_eligible`
- Emits: `identity.review.posted`, `identity.reputation.recomputed`
- Consumes: `commerce.deal.completed`, `mutiny.cycle.completed`, `services.booking.completed`, `rentals.rental.closed`, `federation.tombstone.applied`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-058-01 | [Domain schema](domain_schema.md) | 3 |
| PS-058-02 | [Validation rules](validation_rules.md) | 3 |
| PS-058-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-058-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-058-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-058-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-058-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-058-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-058-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-058-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/trust/reputation/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Golden dampening vectors are stable and a sybil ring cannot raise the effective weight of its reviews above 15 percent of raw in the ring test.
- The UI always shows raw counts, source count and the dampening notice, and never claims verified identity of persons.
