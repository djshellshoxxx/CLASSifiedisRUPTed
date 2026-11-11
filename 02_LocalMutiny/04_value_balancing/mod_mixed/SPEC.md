# F02.S04.M01 — Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S04](../SPEC.md). **Process IDs:** PS-026-01…PS-026-10. **Code:** `packages/mutiny/src/value_balancing/mixed`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

When the value gap of a participant exceeds the MNY-5 tolerance (5 percent of the larger side or the configured absolute minimum, with the stricter length profiles of F02.S02.M01 and F02.S02.M02), a compensation leg offsets it, either as money from one participant to another or as an extra item line in a direct proposal. Money legs are payment claims (CTR-COM-001), not payments: ClassRup never holds funds, a claim is made by the payer, acknowledged by the payee (cash or external) or confirmed final on chain, and nothing is marked paid without that evidence. A deterministic planner proposes the legs; the participants may change them in a new revision, and everyone consents to the exact amounts. A disadvantaged participant may instead accept the imbalance through an acceptedImbalances entry of the revision snapshot that names them, so the digest covers it and their consent on that digest is the signed acceptance. Money legs become obligations of a noncustodial F09 Deal opened with commerce.deal.open {contextRef {type: cycle_compensation, id}, contextCid, parties, obligations} (N5).

## Responsibilities

- Compute the deterministic compensation plan from normalized net positions and tolerances, and own CompensationLeg records from proposed to a terminal state.
- Open the noncustodial Deal with commerce.deal.open {contextRef {type: cycle_compensation, id: cycleId, or recoveryCaseId for recovery legs}, contextCid: head revision contentHash or the accepting recovery action cid, parties, obligations: the money legs with obligationId = compensationLegId}, create payment claims through commerce.payment.claim when the payer asserts payment, match payment events by dealId and obligationId or claimId, mirror the claim status (claimed, acknowledged, disputed, expired, final) onto the leg, and call commerce.deal.cancel when the cycle is cancelled or a due leg is withdrawn.
- Report settlement to execution so a cycle completes only when item legs are received and money legs are acknowledged or final, and let recovery waive or dispute a leg.
- Keep money legs in the cycle settlement currency in integer minor units with no rounding after normalization.
- Activate compensation legs created by a recovery case once the payer and the payee both accepted the option (called by F02.S03.M04), and register export, deletion and retention handlers with F10 (N6).

## Not responsible for

- Moving, holding, escrowing or verifying funds; wallets, banks and chains are external (CTR-COM-001 COM-1, COM-5).
- Value declaration (F02.S04.M03) and normalization and quotes (F02.S04.M02).
- Sealing legs into revisions and consent (F02.S01.M04, F02.S03.M01) and execution completion (F02.S03.M04).
- Payment claim state machine, receipts and disputes (F09.S01.M01, F09.S02.M02).
- Future: installment compensation, multi-currency payment legs, and chain verifier adapters that unlock crypto legs automatically.

## User stories

- As a coordinator of a 3-party cycle with a 60.00 EUR value gap, I see a proposed plan of who pays whom, adjust it, and every participant consents to the exact amounts.
- As a payer, I tell the app that I paid 40.00 EUR in cash and the payee sees my claim and can acknowledge it; until then everyone sees 'claimed (unverified)'.
- As a payee, I acknowledge the payment only when I actually received it, and I can dispute a claim that is false.

## Edge cases

- All gaps are within tolerance; the planner returns an empty plan and no compensation leg is created.
- Net positions need three transfers; the planner produces at most N minus 1 legs by largest-first matching and ties by DID ascending.
- The payer claims payment by crypto but no chain verifier is configured; the claim stays claimed, the cycle cannot complete automatically, and the UI offers cash or external settlement or a recovery waiver.
- The payer claims payment by crypto and the payee's configured verifier reports final; commerce.payment.finalized for that claim settles the leg.
- A recovery case offers a compensation of 80.00 EUR from Dan to Alice; the leg stays proposed until both Dan and Alice signed accept, then becomes due with its own Deal.
- The payee disputed the claim and later the dispute is withdrawn; the leg returns to claimed and waits for acknowledgement instead of staying disputed forever.
- The payee acknowledges payment but the payer never claimed; acknowledgement without a claim is refused because the claim is the payer's assertion.
- The head snapshot carries an acceptedImbalances entry naming a participant whose gap it covers, signed through that participant's consent on the digest; the planner leaves that participant out and the leg set is smaller.
- The cycle is cancelled before any handover; proposed and due legs are withdrawn, commerce.deal.cancel is called for the Deal, and no money is owed.
- The cycle becomes partially_executed; due legs stay, and the recovery case may waive, adjust or dispute them.
- Compensation legs expire after 14 days without progress per COM-3, and the expiry is shown to both parties.

## UX and accessibility

- Value balance table: for each participant gives, receives, gap, tolerance, and suggested payment 'Bob pays Alice 40.00 EUR' with Accept plan and Edit buttons.
- Payment status card per leg using the CTR-COM-001 labels: claimed (unverified), acknowledged by payee, disputed, expired, and 'No funds are held by ClassRup'.
- Claim payment sheet for the payer: method (cash, crypto, external), optional reference up to 128 characters, confirmation text 'I assert that I paid'.

**States:** loading; no-compensation-needed; proposed; due; claimed; acknowledged; disputed; expired; waived; withdrawn; error

**Accessibility:** Payment status labels are text and are announced through an aria-live polite region when they change.; Amounts have currency in the label and the plan table is a real table with headers.; Claim and Acknowledge buttons are at least 44 by 44 px and name the person and amount.

## Owned data

- `CompensationLeg` (classrup.mutiny.compensation_leg/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.compensation.propose`, `mutiny.compensation.withdraw`, `mutiny.compensation.claim`, `mutiny.compensation.activate`
- Queries: `mutiny.compensation.suggest_plan`, `mutiny.compensation.get`, `mutiny.compensation.list_for_subject`
- Emits: `mutiny.compensation.proposed`, `mutiny.compensation.claimed`, `mutiny.compensation.settled`
- Consumes: `mutiny.cycle.committed`, `mutiny.cycle.cancelled`, `mutiny.cycle.declined`, `mutiny.proposal.revised`, `mutiny.leg.received`, `commerce.payment.claimed`, `commerce.payment.acknowledged`, `commerce.payment.finalized`, `commerce.payment.disputed`, `commerce.payment.expired`, `commerce.dispute.resolved`, `commerce.dispute.withdrawn`, `commerce.deal.cancelled`, `mutiny.recovery.resolved`, `privacy.deletion.completed`

## Dependencies

F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-026-01 | [Domain schema](domain_schema.md) | 4 |
| PS-026-02 | [Validation rules](validation_rules.md) | 3 |
| PS-026-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-026-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-026-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-026-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-026-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-026-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-026-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-026-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/value_balancing/mixed/index.ts`.

## Acceptance criteria

- All tests T01–T23 pass in CI.
- No leg is ever settled without payee acknowledgement, chain finality, or a received extra item, and ClassRup never holds funds.
- The planner is deterministic, conserves sums and leaves every participant within tolerance or with an explicit signed acceptance.
