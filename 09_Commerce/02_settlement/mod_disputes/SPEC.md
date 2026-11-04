# F09.S02.M02 — Disputes

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S02](../SPEC.md). **Process IDs:** PS-070-01…PS-070-10. **Code:** `packages/commerce/src/settlement/disputes`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A shared dispute case for any context that has parties and evidence: payment claims and deals, barter cycle legs, service bookings and rentals. The parties exchange signed evidence references and responses directly or through their relays, and may jointly choose an optional mediator (a moderator of a relay both of them select). Outcomes are signed statements: no-fault close, refund claimed, return agreed, or enforcement referral. An outcome records what was decided or asserted; it never moves, freezes or releases money, and the platform has no power to force a party.

## Responsibilities

- Own DisputeCase mirrored in each party's vault, opened by a signed statement classrup.commerce.dispute/v1 that references the context {type, id}.
- Collect evidence references (message cids, receipts, claims, attachment hashes) as signed statements classrup.commerce.dispute_evidence/v1, with per-party limits.
- Support an optional mediator selected by both parties through signed selection and acceptance statements, with evidence shared to the mediator only by explicit party action.
- Record outcomes as signed statements classrup.commerce.dispute_outcome/v1, requiring both parties' acceptance for refund_claimed and return_agreed and none for no_fault_close or enforcement_referral decided by a mediator.
- Run the case clock (7 days response, 14 days evidence, 7 days proposal validity, 30 days inactivity lapse) and emit dispute events.
- Provide the intake used by services disputes (F03.S02.M03) and by the payment-disputed prompt, without opening cases automatically.

## Not responsible for

- Moving, refunding, freezing or releasing money; a refund_claimed outcome is an advisory record and the respondent settles through a new Deal (F09.S01.M01).
- Global bans, takedowns or suspensions; an enforcement_referral is a referral to the mediator's relay, which acts only on what it hosts under its own policy.
- Moderation reports and appeals about content (F12), and service-specific intake forms (F03.S02.M03).
- Future: multi-mediator panels, jury-style community review, and binding arbitration through third-party providers.

## User stories

- As a buyer who paid but did not receive the item, I open a case on the deal, attach my messages and receipt, and see the seller's signed response.
- As a seller, I respond with my own evidence and propose a no-fault close or a return.
- As either party, I can propose a mediator from a relay we both trust, and nothing is shared with the mediator until I choose to share it.
- As a participant in a barter cycle leg, I open a case referencing the cycle and the other legs' parties are respondents.

## Edge cases

- The respondent never answers; after 7 days the case moves to evidence with respondentSilent true, and the opener may propose an outcome that the silent party can still accept later.
- Both parties propose different outcomes at the same time; both proposals are kept as evidence, the case needs one proposal accepted by all parties, and conflicting accepted outcomes freeze the case with COMMERCE_DISPUTE_FORK.
- The selected mediator's relay becomes unreachable; the case stays in mediation with the mediator marked unavailable after 7 days and the parties may select another or resolve between themselves.
- Evidence item larger than 10 MiB or the 21st item of a party is refused with COMMERCE_DISPUTE_EVIDENCE_LIMIT.
- The opener withdraws after the respondent already accepted a proposal; the accepted outcome stands only if all parties' acceptances are already held, otherwise the case is withdrawn.
- A party opens a second case on the same context while one is open; refused with COMMERCE_DISPUTE_DUPLICATE and the existing case is shown.
- A dispute statement arrives for a context the vault does not know; it is quarantined for 24 h pending the context statement, then dropped.

## UX and accessibility

- Open dispute: pick reason (not_received, not_as_described, payment_not_acknowledged, no_show, damage, other), describe in up to 1 000 characters, attach evidence, choose respondents (prefilled from the context).
- Case timeline: signed statements in order of arrival with sync state per statement, evidence list, countdown to the next deadline, clear note 'ClassRup cannot move money or force anyone'.
- Mediator picker: list from selected relays with their published mediation policy and a plain statement of what the relay can and cannot do.
- Outcome screen: outcome type, optional advisory refund amount and note, Accept and Reject buttons for each party.

**States:** loading; empty; opened; awaiting-response; evidence; mediation; outcome-proposed; resolved; withdrawn; frozen-conflict; pending-offline

**Accessibility:** Timeline is an ordered list with each statement announced with its author and sync state.; Deadlines are text dates, not only countdown graphics, and changes are announced politely.; Accept and Reject buttons have names including the outcome type and are at least 44 by 44 px.

## Owned data

- `DisputeCase` (classrup.commerce.dispute/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `commerce.dispute.open`, `commerce.dispute.add_evidence`, `commerce.dispute.respond`, `commerce.dispute.select_mediator`, `commerce.dispute.accept_mediator`, `commerce.dispute.propose_outcome`, `commerce.dispute.accept_outcome`, `commerce.dispute.withdraw`, `commerce.dispute.ingest`
- Queries: `commerce.dispute.get`, `commerce.dispute.list_mine`, `commerce.dispute.list_mediators`
- Emits: `commerce.dispute.opened`, `commerce.dispute.evidence_added`, `commerce.dispute.resolved`, `commerce.dispute.outcome_proposed`, `commerce.dispute.withdrawn`
- Consumes: `commerce.payment.disputed`, `services.dispute.opened`, `privacy.deletion.completed`

## Dependencies

F09.S01.M01, F09.S02.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-070-01 | [Domain schema](domain_schema.md) | 3 |
| PS-070-02 | [Validation rules](validation_rules.md) | 3 |
| PS-070-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-070-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-070-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-070-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-070-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-070-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-070-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-070-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/settlement/disputes/index.ts`.

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- No dispute state, event or outcome invokes any payment, refund, freeze or release operation.
- A mediator sees only evidence the parties chose to share and only after both accepted the mediator.
- Conflicting accepted outcomes always freeze the case.
