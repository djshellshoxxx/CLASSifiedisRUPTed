# F09.S02.M02 — Disputes

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S02](../SPEC.md). **Process IDs:** PS-070-01…PS-070-10. **Code:** `packages/commerce/src/settlement/disputes`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A shared dispute case for any context that has parties and evidence: payment claims and deals, barter cycles, service bookings, rental deposits and rental damage. Context modules register a DisputeContextPort resolver that returns the parties and the signed context cid, so every vault derives the same respondents. The parties exchange signed evidence references and responses directly or through their relays, with attachments as metadata-stripped MediaBlobs of at most 5 MiB sent as end-to-end encrypted attachments. Every party of the case may jointly choose an optional mediator; a mediator's link to the relay it moderates is proved only by a relay-signed directory entry, and a self-declared mediator cannot decide anything alone. Outcomes are signed statements - no-fault close, refund claimed, return agreed, or enforcement referral - with an advisory disposition consumers map. An outcome records what was decided or asserted; it never moves, freezes or releases money, and the platform has no power to force a party.

## Responsibilities

- Own DisputeCase mirrored in each party's vault, opened by a signed statement classrup.commerce.dispute/v1 that references the context {type, id}.
- Collect evidence references (message cids, receipts, claims, attachment hashes) as signed statements classrup.commerce.dispute_evidence/v1, with per-party limits.
- Support an optional mediator selected by every party of the case (opener and all respondents) through signed selection and acceptance statements, with evidence shared to the mediator only by explicit party action.
- Record outcomes as signed statements classrup.commerce.dispute_outcome/v1, requiring acceptance by every party for refund_claimed and return_agreed and none for no_fault_close or enforcement_referral decided by an active mediator whose relay directory entry verifies.
- Run the case clock (7 days response, 14 days evidence, 7 days proposal validity, 30 days inactivity lapse) and emit dispute events.
- Provide the intake used by services disputes (F03.S02.M03) and by the payment-disputed prompt, without opening cases automatically.
- Resolve contexts through the DisputeContextPort {resolve(contextRef) -> {parties[{did, role}], contextCid}} registered by F09.S01.M01 (deal, payment_claim), F02.S03.M04 (cycle), F03.S02.M03 (booking), F05.S01.M02 (rental_deposit) and F05.S02.M03 (rental_damage).
- Route attachment evidence through F15.S02.M03 MediaBlob refs (≤ 5 MiB), stripped by F10.S02.M03 before encryption and sent as end-to-end encrypted attachments (FLOW-10 format, per-object key) through the injected AttachmentTransportPort, which the vault composition binds to the F08.S01.M01 mailbox adapter.
- Carry an advisory, non-executable disposition in outcomes and in commerce.dispute.resolved, and publish the default mapping from outcome types for deal and payment_claim contexts.
- Keep statements of an open case from blocked parties as evidence and allow a case against a blocked party.

## Not responsible for

- Moving, refunding, freezing or releasing money; a refund_claimed outcome is an advisory record and the respondent settles through a new Deal (F09.S01.M01).
- Global bans, takedowns or suspensions; an enforcement_referral is a referral to the mediator's relay, which acts only on what it hosts under its own policy.
- Moderation reports and appeals about content (F12), and service-specific intake forms (F03.S02.M03).
- Deciding who the parties of a context are; the context module's DisputeContextPort resolver answers that.
- Future: multi-mediator panels, jury-style community review, and binding arbitration through third-party providers.

## User stories

- As a buyer who paid but did not receive the item, I open a case on the deal, attach my messages and receipt, and see the seller's signed response.
- As a seller, I respond with my own evidence and propose a no-fault close or a return.
- As any party, I can propose a mediator from a relay that publishes a signed mediator directory, and nothing is shared with the mediator until every party has accepted and I choose to share an item.
- As a participant in a barter cycle, I open a case referencing the cycle and the other participants returned by the cycle's resolver are respondents.
- As someone who blocked a fraudster, I can still open a case against them, and their answers in my case are kept as evidence without notifying me.

## Edge cases

- The respondent never answers; after 7 days the case moves to evidence with noResponseReceivedHere true, and the opener may propose an outcome that the other party can still accept later.
- Both parties propose different outcomes at the same time; both proposals are kept as evidence, the case needs one proposal accepted by all parties, and conflicting accepted outcomes freeze the case with COMMERCE_DISPUTE_FORK.
- The selected mediator's relay becomes unreachable; the case stays in mediation with the mediator marked unavailable after 7 days and the parties may select another or resolve between themselves.
- An attachment larger than 5 MiB or the 21st item of a party is refused with COMMERCE_DISPUTE_EVIDENCE_LIMIT.
- The opener withdraws after the respondent already accepted a proposal; the accepted outcome stands only if all parties' acceptances are already held, otherwise the case is withdrawn.
- A party opens a second case on the same context while one is open; refused with COMMERCE_DISPUTE_DUPLICATE and the existing case is shown.
- A dispute statement arrives for a context the vault does not know; it is quarantined for 24 h pending the context statement, then dropped.
- In a 3-party cycle the opener and one respondent accept a mediator; the mediator stays proposed and sees nothing until the third participant also signs acceptance.
- A party selects a mediator did with no relay-signed directory entry (a sock puppet presented as a relay moderator); the mediator is labelled self-declared and its no_fault_close or enforcement_referral needs every party's acceptance, refused otherwise with COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED.
- A JPEG with GPS EXIF tags is attached; F10.S02.M03 strips EXIF, XMP and GPS before encryption, so the respondent and the mediator receive the image without location data.
- The opener has blocked the respondent; the respondent's response and evidence in the open case are stored with notifications suppressed, and the timeline says 'responses from a party you blocked are hidden'; noResponseReceivedHere stays false.
- A context type that no module registered (for example a legacy rental type) is refused with COMMERCE_DISPUTE_CONTEXT_INVALID.
- 10 000 fresh dids each send one dispute statement; the bounded quarantine evicts the oldest entries and then drops statements from dids that are party to no known context.
- F03.S02.M03 retries a booking case open with the same idempotencyRef (its linkId) after a crash; the existing case is returned and no second dispute statement is signed.
- A services.dispute.opened event arrives with origin federated, or a local one for a booking whose case already exists; neither creates a case, and the local one only prefills evidence in the opener vault.
- The owner opens a rental_damage case against a renter they blocked after the reservation was confirmed; the open is not refused and the renter's statements in the case are stored with notifications suppressed.

## UX and accessibility

- Open dispute: pick reason (not_received, not_as_described, payment_not_acknowledged, no_show, damage, other), describe in up to 1 000 characters, attach evidence (images stripped of location data, at most 5 MiB each), choose respondents (prefilled from the context resolver).
- Case timeline: signed statements in order of arrival with sync state per statement, evidence list, countdown to the next deadline, 'responses from a party you blocked are hidden' when applicable, clear note 'ClassRup cannot move money or force anyone'.
- Mediator picker: relay-signed directory entries from selected relays with their published mediation policy, validity and a plain statement of what the relay can and cannot do; a mediator without a verified entry is labelled Self-declared.
- Outcome screen: outcome type, optional advisory refund amount and disposition (continue, settled, cancelled, waived, favoured party), note, Accept and Reject buttons for each party, and who has accepted so far.

**States:** loading; empty; opened; awaiting-response; evidence; mediation; mediator-pending-acceptance; self-declared-mediator; outcome-proposed; resolved; withdrawn; frozen-conflict; pending-offline

**Accessibility:** Timeline is an ordered list with each statement announced with its author and sync state.; Deadlines are text dates, not only countdown graphics, and changes are announced politely.; Accept and Reject buttons have names including the outcome type and are at least 44 by 44 px.

## Owned data

- `DisputeCase` (classrup.commerce.dispute/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.dispute.open`, `commerce.dispute.add_evidence`, `commerce.dispute.respond`, `commerce.dispute.select_mediator`, `commerce.dispute.accept_mediator`, `commerce.dispute.propose_outcome`, `commerce.dispute.accept_outcome`, `commerce.dispute.withdraw`, `commerce.dispute.ingest`
- Queries: `commerce.dispute.get`, `commerce.dispute.list_mine`, `commerce.dispute.list_mediators`
- Emits: `commerce.dispute.opened`, `commerce.dispute.evidence_added`, `commerce.dispute.resolved`, `commerce.dispute.outcome_proposed`, `commerce.dispute.withdrawn`
- Consumes: `commerce.payment.disputed`, `services.dispute.opened`, `privacy.deletion.completed`

## Dependencies

F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-070-01 | [Domain schema](domain_schema.md) | 6 |
| PS-070-02 | [Validation rules](validation_rules.md) | 5 |
| PS-070-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-070-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-070-05 | [Authorization and capabilities](authorization_capabilities.md) | 4 |
| PS-070-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-070-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-070-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-070-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-070-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/settlement/disputes/index.ts`.

## Acceptance criteria

- All tests T01 to T30 pass in CI.
- No dispute state, event or outcome invokes any payment, refund, freeze or release operation.
- A mediator sees only evidence the parties chose to share and only after every party of the case accepted the mediator.
- Conflicting accepted outcomes always freeze the case.
- A self-declared mediator can never close a case without every party's acceptance.
- Statements in an open case are never dropped because of a block, and no image evidence carries location metadata.
