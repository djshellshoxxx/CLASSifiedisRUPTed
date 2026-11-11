# F02.S01.M01 — Two-party barter

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S01](../SPEC.md). **Process IDs:** PS-015-01…PS-015-10. **Code:** `packages/mutiny/src/trade_proposals/two`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A direct item-for-item(s) proposal between two members, with an optional compensation leg. Each member keeps their own TradeProposal in their own vault. The proposal is a conversation of immutable signed revisions (F02.S01.M04); a party is bound only by their own F08.S02.M02 consent statement (subjectType mutiny_proposal, statement key consent.mutiny.proposal.accept.v1) on the exact revision digest and by their own signed reservation of their own items (classrup.bazaar.reservation/v1 with holder {type: cycle, id: proposalId}, issued through F02.S03.M02 and F01.S03.M01). The proposal is accepted, as judged separately by each vault, when comms.consent.verify reports both consents on the same head digest valid and both reservations are valid and unexpired before the deadline on that vault's clock. Acceptance hands the exchange to the cycle execution saga as a 2-party cycle whose id equals the proposal id. The platform takes no payment, relays only carry encrypted statements, and nothing is atomic across the two vaults.

## Responsibilities

- Own the TradeProposal aggregate (local view per vault) with states draft, open, accepted, rejected, withdrawn, expired and frozen.
- Create proposals and counters by orchestrating legs, revision, the principal's own reservation and the principal's signed consent in one local transaction.
- Ingest only the proposal withdrawal statement (classrup.mutiny.proposal_response/v1); react to the events of the single ingest owner of every other statement type (revisions F02.S01.M04, consents, declines and revocations F08.S02.M02, reservations F02.S03.M02) and re-evaluate the local acceptance verdict.
- Register the module's export section, deletion and retention purge handlers with F10 (N6) and pseudonymize erased parties in retained evidence.
- Expire proposals by the local clock (default 72 h, range 1 h to 14 d) and treat any clock disagreement as expired.
- Register the F08.S02.M02 SubjectCanonicalizerPort for subjectType mutiny_proposal by inverted registration: canonicalBytes(ref, rev) from F02.S01.M04, currentRevision(ref), partyRole(ref, did) and isCommitted(ref).

## Not responsible for

- Signature format, ingest and revocation of consent (F08.S02.M02), revision snapshots (F02.S01.M04), legs (F02.S01.M03), roster (F02.S01.M02), reservations (F02.S03.M02 on the F01.S03.M01 reservation statement).
- Executing the exchange, handover attestations and recovery (F02.S03.M04) and dropouts after acceptance (F02.S03.M03).
- Money offers on a sell listing (F01.S04.M01 offers) and price negotiation (F01.S04.M02).
- Future: proposals with more than two parties as editable drafts, and multi-currency compensation negotiation UIs.

## User stories

- As a member, I propose my guitar for a member's bicycle, review the exact terms I am signing, and see that it is sent only to that member in an encrypted envelope.
- As a recipient, I can accept, reject or counter, and when I accept I see precisely what I reserved of my own and what the other person has signed.
- As either party, I see the true sync state of every statement: saved here, prepared, relay received, or acknowledged by the other person.

## Edge cases

- Both parties counter at the same time offline; the vaults detect the fork, freeze the proposal and the parties renegotiate as a new proposal.
- The recipient accepts after the proposer's local deadline but before the recipient's own; each vault decides with its own clock and disagreement is treated as expired.
- The proposer's item was sold elsewhere after the proposal was sent; the proposer's reservation was refused earlier, or the recipient's feasibility check flags the signed reservation as expired, so the proposal never becomes accepted.
- The recipient's acceptance reaches the proposer after the proposer withdrew; the proposer's vault ignores it because the proposal is already terminal, and the recipient's vault closes the proposal as withdrawn and releases its own reservation when the signed withdrawal notice reaches it.
- The recipient revokes their consent through F08 before the proposer's vault evaluated it; the consent is void with reason consent_revoked and the proposal is not accepted.
- The proposer counters; the superseded own reservation is unlocked with reason superseded and the proposal is not withdrawn, because the newer own reservation for the same subject is active.
- A consent statement signed for revision 2 arrives after revision 3 exists; it is stored as void evidence and does not count, even if revision 3 has the same terms, because the digest also binds the revision number and prev hash.
- The same two members propose the same item sets twice; the second proposal is refused as a duplicate.
- Compensation is included; acceptance records the payer's obligation, but no money moves through ClassRup and payment evidence is a claim handled by F02.S04.M01 and F09.

## UX and accessibility

- Compose proposal: pick my items, pick their items, optional compensation, expiry selector (default 72 h), summary with value gap and tolerance, Send (signs consent and reserves my items).
- Proposal thread card: status, current revision number and hash fragment, who must act, sync state per statement (saved here, prepared, relay received, acknowledged by peer).
- Review and accept sheet: exact terms, feasibility checklist with basis chips, 'What I am signing' statement, any accepted imbalance that names me in the revision, buttons Accept, Counter, Reject (Reject signs an F08 decline).

**States:** loading; empty; draft; open; awaiting-peer; awaiting-me; accepted; rejected; withdrawn; expired; frozen; pending-offline; error

**Accessibility:** The consent statement is plain text above the Accept button and Accept has the accessible name 'Sign and accept revision N'.; Status and sync changes are announced through an aria-live polite region and never by color alone.; All buttons are at least 44 by 44 px and the review sheet is fully keyboard operable.

## Owned data

- `TradeProposal` (classrup.mutiny.trade_proposal/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.proposal.create`, `mutiny.proposal.accept`, `mutiny.proposal.counter`, `mutiny.proposal.reject`, `mutiny.proposal.withdraw`, `mutiny.proposal.ingest`
- Queries: `mutiny.proposal.get`, `mutiny.proposal.list_mine`
- Emits: `mutiny.proposal.created`, `mutiny.proposal.accepted`, `mutiny.proposal.rejected`, `mutiny.proposal.expired`, `mutiny.proposal.withdrawn`
- Consumes: `mutiny.proposal.revised`, `mutiny.revision.forked`, `comms.consent.signed`, `comms.consent.received`, `comms.consent.revoked`, `mutiny.cycle.locked`, `mutiny.cycle.unlocked`, `mutiny.lock.conflict_detected`, `mutiny.party.left`, `identity.block.added`, `bazaar.inventory.depleted`, `privacy.deletion.completed`

## Dependencies

F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-015-01 | [Domain schema](domain_schema.md) | 3 |
| PS-015-02 | [Validation rules](validation_rules.md) | 3 |
| PS-015-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-015-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-015-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-015-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-015-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-015-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-015-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-015-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/trade_proposals/two/index.ts`.

## Acceptance criteria

- All tests T01–T26 pass in CI.
- A party is never shown as bound to a revision unless a valid signature on that exact hash was verified in the viewing vault.
- Forks and clock disagreement always end in frozen or expired, never in acceptance.
